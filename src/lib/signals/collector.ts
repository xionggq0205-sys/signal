/**
 * Unified Signal Collector — orchestrates all 5 signal sources.
 *
 * Pipeline:
 * 1. User input → Expand Keywords (扩词)
 * 2. For each keyword: query all enabled sources in parallel
 * 3. Deduplicate signals by URL + content similarity
 * 4. Return unified RawSignal[]
 */

import type { RawSignal, ExpandedKeywords } from "../types";
import { expandKeywords } from "./keywords";
import { searchReddit } from "./reddit";
import { searchHN } from "./hackernews";
import { searchProductHunt } from "./producthunt";
import { getGoogleTrends } from "./googletrends";
import { searchFiverr, searchUpwork, searchGumroad } from "./payment";

interface CollectOptions {
  /** Primary keywords to search (direct + adjacent from 扩词) */
  keywords: string[];
  /** Which sources to query */
  sources?: {
    reddit?: boolean;
    hackernews?: boolean;
    producthunt?: boolean;
    googletrends?: boolean;
    fiverr?: boolean;
    upwork?: boolean;
    gumroad?: boolean;
  };
  maxPerSource?: number;
}

const DEFAULT_SOURCES = {
  reddit: true,
  hackernews: true,
  producthunt: true,
  googletrends: true,
  fiverr: true,
  upwork: true,
  gumroad: true,
};

/**
 * Main entry point: collect signals from all sources for a user query.
 */
export async function collectSignals(
  rawQuery: string,
  options?: CollectOptions
): Promise<RawSignal[]> {
  // Step 0: Expand keywords
  const expanded = expandKeywords(rawQuery);

  // Use provided keywords or the direct + adjacent expansions
  const searchKeywords = options?.keywords ?? [
    ...expanded.direct.slice(0, 4),
    ...expanded.adjacent.slice(0, 3),
  ];

  const sources = { ...DEFAULT_SOURCES, ...options?.sources };
  const maxPerSource = options?.maxPerSource ?? 10;

  // Step 1: Query all enabled sources in parallel, for each keyword
  const allSignals: RawSignal[] = [];

  for (const keyword of searchKeywords) {
    const sourcePromises: Promise<RawSignal[]>[] = [];

    if (sources.reddit) sourcePromises.push(searchReddit(keyword, maxPerSource));
    if (sources.hackernews) sourcePromises.push(searchHN(keyword, maxPerSource));
    if (sources.producthunt) sourcePromises.push(searchProductHunt(keyword, maxPerSource));
    if (sources.googletrends) sourcePromises.push(getGoogleTrends(keyword));
    if (sources.fiverr) sourcePromises.push(searchFiverr(keyword, maxPerSource));
    if (sources.upwork) sourcePromises.push(searchUpwork(keyword, maxPerSource));
    if (sources.gumroad) sourcePromises.push(searchGumroad(keyword, maxPerSource));

    const results = await Promise.all(sourcePromises);
    allSignals.push(...results.flat());
  }

  // Step 2: Deduplicate by URL
  const deduped = deduplicateSignals(allSignals);

  // Step 3: Sort by engagement (highest first)
  deduped.sort((a, b) => b.engagement - a.engagement);

  return deduped;
}

/**
 * Deduplicate signals by matching URLs and titles.
 */
function deduplicateSignals(signals: RawSignal[]): RawSignal[] {
  const seen = new Set<string>();
  return signals.filter((s) => {
    const key = s.url ?? `${s.source}:${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get current search volume for a keyword via Google Trends + combined signals.
 */
export async function getSearchVolumeSignal(
  keyword: string
): Promise<{ volume: number; trend: "rising" | "stable" | "declining" }> {
  const trends = await getGoogleTrends(keyword);
  const trendSignal = trends[0];
  const volume = trendSignal?.engagement ?? 0;

  return {
    volume,
    trend: volume > 50 ? "rising" : volume > 20 ? "stable" : "declining",
  };
}

export { expandKeywords };
