// Wikipedia REST summary — lazy bio + image fallback for a person. CORS-open, no key.

import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { WIKIMEDIA_HEADERS } from "@/lib/wikimedia";

export type Summary = { extract: string; thumbnail: string | null };

export async function fetchSummary(article: string): Promise<Summary> {
  const title = decodeURIComponent(article.split("/wiki/").pop() ?? "");
  const res = await fetchWithTimeout(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    { headers: WIKIMEDIA_HEADERS },
  );
  if (!res.ok) throw new Error(`Wikipedia request failed (${res.status})`);
  const s = await res.json();
  return { extract: s.extract ?? "", thumbnail: s.thumbnail?.source ?? null };
}
