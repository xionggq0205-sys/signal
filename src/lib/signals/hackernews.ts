/**
 * Hacker News signal collector
 * Uses HN Algolia Search API (free, no auth)
 */

import type { RawSignal } from "../types";

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1";

interface HNHit {
  title: string;
  url?: string;
  objectID: string;
  author: string;
  points: number;
  num_comments: number;
  created_at_i: number;
  comment_text?: string;
  story_title?: string;
}

/**
 * Search Hacker News via Algolia API.
 * Searches stories + comments for the keyword.
 */
export async function searchHN(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  // Search stories
  const storiesUrl = `${HN_SEARCH_URL}/search?query=${encodeURIComponent(keyword)}&tags=story&hitsPerPage=${limit}`;
  // Search comments (where real demand signals often hide)
  const commentsUrl = `${HN_SEARCH_URL}/search?query=${encodeURIComponent(keyword)}&tags=comment&hitsPerPage=${limit}`;

  try {
    const [storiesRes, commentsRes] = await Promise.all([
      fetch(storiesUrl),
      fetch(commentsUrl),
    ]);

    const stories = storiesRes.ok
      ? ((await storiesRes.json())?.hits ?? [])
      : [];
    const comments = commentsRes.ok
      ? ((await commentsRes.json())?.hits ?? [])
      : [];

    const allHits: HNHit[] = [...stories, ...comments];

    return allHits.map((h) => ({
      source: "hackernews" as const,
      title: h.title || h.story_title || "HN Comment",
      content: h.comment_text || h.title || "",
      url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
      permalink: `https://news.ycombinator.com/item?id=${h.objectID}`,
      author: h.author,
      engagement: h.points + h.num_comments,
      extractedAt: new Date(new Date(h.created_at_i * 1000)),
    }));
  } catch (err) {
    console.warn(`[HN] Error searching "${keyword}":`, err);
    return [];
  }
}
