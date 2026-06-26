/**
 * Product Hunt signal collector
 * Uses PH public GraphQL endpoint (no auth for basic reads)
 */

import type { RawSignal } from "../types";

const PH_API_URL = "https://api.producthunt.com/v1";

/**
 * Search Product Hunt for products matching a keyword.
 * PH v1 API is deprecated but the public GraphQL endpoint still works for basic reads.
 * P2: Migrate to PH API v2 with OAuth token.
 */
export async function searchProductHunt(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  const url = `${PH_API_URL}/posts?search[url]=${encodeURIComponent(keyword)}&per_page=${limit}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      // PH v1 API is deprecated, silently skip
      if (res.status === 403) return [];
      console.warn(`[ProductHunt] HTTP ${res.status} for keyword: ${keyword}`);
      return [];
    }

    const json = await res.json();
    const posts = json?.posts ?? [];

    return posts.map((p: any) => ({
      source: "producthunt" as const,
      title: p.name,
      content: p.tagline || "",
      url: p.discussion_url || p.redirect_url,
      permalink: p.discussion_url,
      author: p.user?.name,
      engagement: p.votes_count + (p.comments_count ?? 0),
      extractedAt: new Date(),
    }));
  } catch (err) {
    console.warn(`[ProductHunt] Error searching "${keyword}":`, err);
    return [];
  }
}

/**
 * Fetch a Product Hunt post's comments for deeper signal mining.
 * P2 feature.
 */
export async function fetchPHComments(
  postId: number,
  limit = 20
): Promise<RawSignal[]> {
  const url = `${PH_API_URL}/posts/${postId}/comments?per_page=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const json = await res.json();
    const comments = json?.comments ?? [];

    return comments.map((c: any) => ({
      source: "producthunt" as const,
      title: `Comment on post #${postId}`,
      content: c.body || "",
      url: c.url,
      author: c.user?.name,
      engagement: 0,
      extractedAt: new Date(),
    }));
  } catch {
    return [];
  }
}
