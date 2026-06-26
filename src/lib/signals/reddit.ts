/**
 * Reddit signal collector
 * Uses Reddit's public JSON API (no auth needed for search)
 */

import type { RawSignal } from "../types";

const REDDIT_SEARCH_URL = "https://www.reddit.com/search.json";

interface RedditChild {
  data: {
    title: string;
    selftext: string;
    permalink: string;
    author: string;
    ups: number;
    num_comments: number;
    created_utc: number;
    subreddit: string;
  };
}

/**
 * Search Reddit for demand signals matching a keyword.
 * Uses public Reddit JSON API — rate-limited to ~10 req/min without auth.
 */
export async function searchReddit(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  const url = `${REDDIT_SEARCH_URL}?q=${encodeURIComponent(keyword)}&sort=relevance&limit=${limit}&t=year`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SignalBot/0.1)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 403) return []; // silently skip, IP blocked on cloud servers
      console.warn(`[Reddit] HTTP ${res.status} for keyword: ${keyword}`);
      return [];
    }

    // Validate it's actually JSON before parsing — Reddit returns HTML when rate-limited
    const text = await res.text();
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      return []; // HTML response = rate limited, silently skip
    }

    const json = JSON.parse(text);
    const children: RedditChild[] = json?.data?.children ?? [];

    return children.map((c) => ({
      source: "reddit" as const,
      title: c.data.title,
      content: c.data.selftext?.substring(0, 2000) ?? "",
      permalink: `https://reddit.com${c.data.permalink}`,
      url: `https://reddit.com${c.data.permalink}`,
      author: c.data.author,
      engagement: c.data.ups + c.data.num_comments,
      extractedAt: new Date(),
    }));
  } catch (err) {
    console.warn(`[Reddit] Error searching "${keyword}":`, err);
    return [];
  }
}
