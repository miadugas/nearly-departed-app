import { describe, expect, it } from "vitest";

import { friendlyAuthMessage } from "@/lib/auth/messages";

const FALLBACK = "Couldn't send the code.";

describe("friendlyAuthMessage — fixed policy", () => {
  // The TestFlight regression: a Supabase 500 arrives with the whole JSON
  // response body as the message, and it was rendered verbatim in the UI.
  it("never leaks a raw server payload", () => {
    const raw = new Error(
      '{"status":500,"statusText":"Internal Server Error","url":"https://x.supabase.co/auth/v1/otp"}',
    );

    expect(friendlyAuthMessage(raw, { policy: "fixed", fallback: FALLBACK })).toBe(
      FALLBACK,
    );
  });

  it("returns the fallback even when the message looks human", () => {
    const raw = new Error("Token has expired or is invalid");

    expect(friendlyAuthMessage(raw, { policy: "fixed", fallback: FALLBACK })).toBe(
      FALLBACK,
    );
  });
});

describe("friendlyAuthMessage — allowlist policy", () => {
  const opts = { policy: "allowlist" as const, fallback: "That code didn't work." };

  it("passes through Supabase's expired/invalid token wording", () => {
    expect(
      friendlyAuthMessage(new Error("Token has expired or is invalid"), opts),
    ).toBe("Token has expired or is invalid");
  });

  it("falls back on a JSON body", () => {
    expect(
      friendlyAuthMessage(new Error('{"code":401,"msg":"bad"}'), opts),
    ).toBe(opts.fallback);
  });

  it("falls back on an unrecognized message", () => {
    expect(
      friendlyAuthMessage(new Error("upstream connect error 111"), opts),
    ).toBe(opts.fallback);
  });

  it("falls back on non-Error throwables", () => {
    expect(friendlyAuthMessage("boom", opts)).toBe(opts.fallback);
    expect(friendlyAuthMessage(null, opts)).toBe(opts.fallback);
  });
});
