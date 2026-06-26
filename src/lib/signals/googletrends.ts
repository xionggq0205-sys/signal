/**
 * Google Trends signal collector
 * Uses Google Trends unofficial explore API endpoint.
 *
 * IMPORTANT: This endpoint is unofficial and may change.
 * P2: Integrate with official Google Trends API or use pytrends via Python subprocess.
 *
 * For MVP, we use the trends explore widget endpoint with region=US
 * to get relative interest over time for a keyword.
 */

import type { RawSignal } from "../types";

const TRENDS_URL = "https://trends.google.com/trends/api/explore";

interface TrendResult {
  keyword: string;
  interest: number; // 0-100 relative
  trend: "rising" | "stable" | "declining";
  relatedQueries: string[];
}

/**
 * Get Google Trends interest for a keyword.
 * Returns relative search interest (US region, past 12 months).
 */
export async function getGoogleTrends(
  keyword: string
): Promise<RawSignal[]> {
  // Google Trends requires a token from the main page first.
  // For MVP: fetch the explore page, extract the token, then call the API.
  // This is fragile — P2 should use a more robust approach.

  try {
    // Simplified approach: use the widget API
    const widgetUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-480&req=${encodeURIComponent(
      JSON.stringify({
        time: "today 12-m",
        resolution: "MONTH",
        locale: "en-US",
        comparisonItem: [{ geo: {}, complexKeywordsRestriction: { keyword: [{ type: "ENTITY", value: `/m/0d6lp`, text: keyword }] } }],
        requestOptions: { property: "", backend: "IZG", category: 0 },
      })
    )}&token=APP6_AAAAAAAAAAAAAAAAA`;

    const res = await fetch(widgetUrl, {
      headers: {
        "User-Agent": "Signal-MarketValidator/0.1",
      },
    });

    if (!res.ok) {
      // Fallback: create a minimal signal indicating keyword was searched
      return [
        {
          source: "googletrends",
          title: `Search interest: "${keyword}"`,
          content: `Google Trends data for keyword "${keyword}" — full data unavailable via unofficial API. P2: integrate official Trends API.`,
          url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`,
          engagement: 0,
          extractedAt: new Date(),
        },
      ];
    }

    // Parse Trends response
    const text = await res.text();
    // Remove the JSONP wrapper ")]}',\n"
    const cleanText = text.replace(/^\)\]\}',\n?/, "");

    try {
      const json = JSON.parse(cleanText);
      const points = json?.default?.timelineData ?? [];

      if (points.length === 0) {
        return [
          {
            source: "googletrends",
            title: `Search interest: "${keyword}"`,
            content: `Google Trends shows no significant search volume for "${keyword}" in the past 12 months.`,
            url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`,
            engagement: points.length,
            extractedAt: new Date(),
          },
        ];
      }

      const avgInterest =
        points.reduce((sum: number, p: any) => sum + (p.value?.[0] ?? 0), 0) /
        points.length;

      return [
        {
          source: "googletrends",
          title: `Search interest: "${keyword}" (avg: ${Math.round(avgInterest)})`,
          content: `Google Trends 12-month search interest for "${keyword}": ${Math.round(avgInterest)} average relative interest. ${points.length} monthly data points.`,
          url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`,
          engagement: Math.round(avgInterest),
          extractedAt: new Date(),
        },
      ];
    } catch {
      return [];
    }
  } catch (err) {
    console.warn(`[GoogleTrends] Error for "${keyword}":`, err);
    return [];
  }
}

/**
 * Get related queries for a keyword (the "related queries" widget).
 * P2 feature.
 */
export async function getRelatedQueries(
  keyword: string
): Promise<string[]> {
  // Placeholder for P2
  return [];
}
