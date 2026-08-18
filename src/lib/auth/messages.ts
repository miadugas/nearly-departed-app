// Per-operation policy keeps fixed-copy guarantees from being weakened by a
// shared permissive error formatter.
export type FriendlyAuthOptions = {
  policy: "fixed" | "allowlist";
  fallback: string;
};

// Fixed policy prevents transport/server details from becoming user-facing
// copy for operations whose errors are not safe to expose.
// Allowlist policy permits only short, human token failures through.
export function friendlyAuthMessage(
  error: unknown,
  options: FriendlyAuthOptions,
): string {
  if (options.policy === "fixed") return options.fallback;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : null;
  if (!message) return options.fallback;

  const normalized = message.trim();
  const isKnownTokenFailure =
    /\b(?:invalid|expired)\b.*\b(?:token|code)\b|\b(?:token|code)\b.*\b(?:invalid|expired)\b/i.test(
      normalized,
    );
  if (
    !normalized ||
    normalized.length > 80 ||
    /[{}]/.test(normalized) ||
    !isKnownTokenFailure
  ) {
    return options.fallback;
  }

  return normalized;
}
