// React Native's fetch has no built-in timeout — a hung socket would spin a
// query forever (the dreaded permanent "Consulting the records…"). This aborts
// the request after `timeoutMs` so React Query can surface the error and retry.
const DEFAULT_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
