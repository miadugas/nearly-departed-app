// Deletes the calling user's account. App Store Guideline 5.1.1(v) requires
// account deletion to be available in-app; auth.users deletion cascades to
// public.profiles and public.favorites via their FK constraints.
//
// Deploy: supabase functions deploy delete-account
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// into the edge runtime; Apple revocation additionally uses APPLE_* secrets.
import { decodeJwt, importPKCS8, SignJWT } from "npm:jose@5";
import { createClient } from "npm:@supabase/supabase-js@2";

const APPLE_CLIENT_ID = "com.miadugas.nearlydeparted";
const APPLE_AUDIENCE = "https://appleid.apple.com";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";

type RevocationResult = {
  revoked: boolean;
  reason: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getAppleIdentityProviderId(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;

  const identities = (user as { identities?: unknown }).identities;
  if (!Array.isArray(identities)) return null;

  const appleIdentity = identities.find((identity) => {
    if (!identity || typeof identity !== "object") return false;
    return (identity as { provider?: unknown }).provider === "apple";
  });
  if (!appleIdentity || typeof appleIdentity !== "object") return null;

  const identity = appleIdentity as {
    id?: unknown;
    identity_data?: unknown;
    provider_id?: unknown;
  };
  const identityData =
    identity.identity_data && typeof identity.identity_data === "object"
      ? (identity.identity_data as { sub?: unknown })
      : null;

  for (const candidate of [
    identityData?.sub,
    identity.provider_id,
    identity.id,
  ]) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return null;
}

function hasAppleSecrets(): boolean {
  return ["APPLE_TEAM_ID", "APPLE_KEY_ID", "APPLE_PRIVATE_KEY"].every(
    (name) => Boolean(Deno.env.get(name)),
  );
}

async function createAppleClientSecret(): Promise<string> {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!teamId || !keyId || !privateKey) {
    throw new Error("Apple secrets are not configured.");
  }

  const signingKey = await importPKCS8(privateKey, "ES256");
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + 15 * 60)
    .setAudience(APPLE_AUDIENCE)
    .setSubject(APPLE_CLIENT_ID)
    .sign(signingKey);
}

async function revokeAppleToken(
  user: unknown,
  authorizationCode: string | null,
): Promise<RevocationResult> {
  const appleProviderId = getAppleIdentityProviderId(user);
  if (!appleProviderId) {
    return { revoked: false, reason: "no_apple_identity" };
  }
  if (!authorizationCode) {
    return { revoked: false, reason: "authorization_code_missing" };
  }
  if (!hasAppleSecrets()) {
    return { revoked: false, reason: "not_configured" };
  }

  try {
    const clientSecret = await createAppleClientSecret();
    // Bounded so a stalled Apple endpoint can never run the function into its
    // own timeout — deletion must proceed even when revocation can't (TN3194).
    const tokenResponse = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) {
      return { revoked: false, reason: "token_exchange_failed" };
    }

    const tokenPayload = (await tokenResponse.json()) as {
      id_token?: unknown;
      refresh_token?: unknown;
    };
    if (
      typeof tokenPayload.id_token !== "string" ||
      typeof tokenPayload.refresh_token !== "string"
    ) {
      return { revoked: false, reason: "token_response_invalid" };
    }

    const claims = decodeJwt(tokenPayload.id_token);
    if (claims.sub !== appleProviderId) {
      return { revoked: false, reason: "identity_mismatch" };
    }

    const revokeResponse = await fetch(APPLE_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        client_secret: clientSecret,
        token: tokenPayload.refresh_token,
        token_type_hint: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!revokeResponse.ok) {
      return { revoked: false, reason: "revoke_failed" };
    }

    return { revoked: true, reason: "revoked" };
  } catch {
    return { revoked: false, reason: "revocation_failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization" }, 401);
  }

  // Resolve the caller from their JWT — the anon-key client scoped with the
  // caller's Authorization header can only ever identify the caller, so no
  // user can delete anyone but themselves.
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Invalid session" }, 401);
  }

  let appleAuthorizationCode: string | null = null;
  try {
    const body = (await req.json()) as unknown;
    if (body && typeof body === "object") {
      const candidate = (body as { appleAuthorizationCode?: unknown })
        .appleAuthorizationCode;
      if (typeof candidate === "string" && candidate.length > 0) {
        appleAuthorizationCode = candidate;
      }
    }
  } catch {
    // Account deletion must continue if the optional revocation payload is invalid.
  }

  const revocation = await revokeAppleToken(user, appleAuthorizationCode);

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(
    user.id,
  );
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true, ...revocation });
});
