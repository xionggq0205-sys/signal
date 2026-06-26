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

/**
 * Generate realistic mock signals for demo/development.
 * Used when real API sources return zero results (no keys configured).
 */
export function generateMockSignals(query: string): RawSignal[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const templates = [
    {
      source: "reddit" as const,
      type: "pain_point",
      title: `Why is ${query} still such a pain in 2026?`,
      template: `I have been looking for a good ${query} solution for months. Everything out there is either too complicated or doesn't work properly. I would pay $15-20/month for something that actually solves this.`,
      engagement: 180 + Math.floor(Math.random() * 120),
      intensity: 0.85,
      specificity: 0.7,
      wtp: 0.8,
    },
    {
      source: "hackernews" as const,
      type: "feature_request",
      title: `Show HN: I built a ${query} tool that actually works`,
      template: `Frustrated with existing solutions, I built my own ${query} tool over a weekend. It focuses on doing one thing really well. Looking for beta testers and feedback.`,
      engagement: 95 + Math.floor(Math.random() * 80),
      intensity: 0.45,
      specificity: 0.9,
      wtp: 0.2,
    },
    {
      source: "producthunt" as const,
      type: "comparison",
      title: `${capitalize(query)} — The simplest ${query} alternative`,
      template: `A dead-simple ${query} tool. No complex setup, no learning curve. Just works. Alternative to the bloated incumbents for people who want things simple.`,
      engagement: 210 + Math.floor(Math.random() * 150),
      intensity: 0.3,
      specificity: 0.5,
      wtp: 0.4,
    },
    {
      source: "googletrends" as const,
      type: "question",
      title: `Search interest: "${query}" (avg: ${40 + Math.floor(Math.random() * 40)})`,
      template: `Google Trends 12-month search interest for "${query}": ${40 + Math.floor(Math.random() * 40)} average relative interest. Growing 12% year-over-year.`,
      engagement: 40 + Math.floor(Math.random() * 40),
      intensity: 0.2,
      specificity: 0.3,
      wtp: 0.1,
    },
    {
      source: "fiverr" as const,
      type: "payment_signal",
      title: `I will build/do ${query} for you — 200+ orders completed`,
      template: `Professional ${query} service. Fast turnaround, high quality. ${200 + Math.floor(Math.random() * 300)} orders completed with 4.9 star rating.`,
      engagement: 45 + Math.floor(Math.random() * 30),
      intensity: 0.1,
      specificity: 0.8,
      wtp: 0.9,
    },
    {
      source: "reddit" as const,
      type: "complaint",
      title: `The current ${query} options are unacceptable for professional use`,
      template: `Trying to use ${query} tools for professional work. Everything breaks, formatting is wrong, and customer support is non-existent. Is anyone working on a serious alternative?`,
      engagement: 190 + Math.floor(Math.random() * 100),
      intensity: 0.75,
      specificity: 0.8,
      wtp: 0.6,
    },
    {
      source: "upwork" as const,
      type: "payment_signal",
      title: `Need ${query} expert — budget $1,500-3,000`,
      template: `Looking for an experienced ${query} developer for an ongoing project. Fixed-price or hourly. Must have portfolio.`,
      engagement: 15 + Math.floor(Math.random() * 10),
      intensity: 0.15,
      specificity: 0.7,
      wtp: 0.95,
    },
    {
      source: "hackernews" as const,
      type: "question",
      title: `Ask HN: What ${query} tools do you use in production?`,
      template: `Evaluating ${query} solutions for our team. Currently comparing self-hosted vs SaaS options. What's working well for you in production?`,
      engagement: 75 + Math.floor(Math.random() * 60),
      intensity: 0.25,
      specificity: 0.6,
      wtp: 0.3,
    },
  ];

  return templates.map((t, i) => ({
    source: t.source,
    title: t.title,
    content: t.template,
    url: `https://${t.source}.com/search?q=${encodeURIComponent(query)}`,
    permalink: `https://${t.source}.com/search?q=${encodeURIComponent(query)}#${i}`,
    author: [
      "power_user_99",
      "dev_builder",
      "startup_founder",
      "tech_lead",
      "product_manager",
      "freelancer_x",
    ][i % 6],
    engagement: t.engagement,
    extractedAt: new Date(now - (templates.length - i) * day),
  }));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
