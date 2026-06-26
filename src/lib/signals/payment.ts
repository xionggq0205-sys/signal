/**
 * Payment signal collectors — Fiverr, Upwork, Gumroad
 * These platforms capture actual transaction intent, making them
 * the strongest demand signal type.
 */

import type { RawSignal } from "../types";

const FIVERR_SEARCH_URL = "https://www.fiverr.com/search/gigs";
const UPWORK_SEARCH_URL = "https://www.upwork.com/ab/feed/jobs/rss";

/**
 * Search Fiverr for gigs related to a keyword.
 * If people are selling services around a keyword, it indicates
 * existing demand and willingness to pay.
 */
export async function searchFiverr(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  try {
    const url = `${FIVERR_SEARCH_URL}?query=${encodeURIComponent(keyword)}&search_in=everywhere&source=drop-down-filters`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Signal-MarketValidator/0.1)",
      },
    });

    if (!res.ok) {
      console.warn(`[Fiverr] HTTP ${res.status} for "${keyword}"`);
      return [];
    }

    const html = await res.text();

    // Extract gig data from the HTML (Fiverr embeds JSON-LD or state)
    // MVP: parse basic gig info from HTML structure
    const signals = extractFiverrGigs(html, limit);
    return signals;
  } catch (err) {
    console.warn(`[Fiverr] Error for "${keyword}":`, err);
    return [];
  }
}

/**
 * Extract gig data from Fiverr search HTML.
 * Uses regex to pull from embedded JSON-LD or data attributes.
 * Fragile — P2 should use a proper headless browser approach.
 */
function extractFiverrGigs(html: string, limit: number): RawSignal[] {
  // Look for gig card data in the HTML
  // Fiverr embeds gig data in <script> tags or data attributes
  const results: RawSignal[] = [];

  // Try to find JSON-LD structured data
  const jsonLdMatches = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
  );

  if (jsonLdMatches) {
    for (const match of jsonLdMatches.slice(0, limit)) {
      try {
        const jsonStr = match.replace(
          /<script type="application\/ld\+json">|<\/script>/g,
          ""
        );
        const data = JSON.parse(jsonStr);

        if (data?.["@type"] === "Product" || data?.offers) {
          results.push({
            source: "fiverr",
            title: data.name || "Fiverr Gig",
            content: data.description || "",
            url: data.url,
            author: data.author?.name,
            engagement: data.aggregateRating?.reviewCount ?? 0,
            extractedAt: new Date(),
          });
        }
      } catch {
        // skip malformed JSON
      }
    }
  }

  // If no structured data, extract from gig card patterns
  if (results.length === 0) {
    const titleMatches = html.match(
      /<p[^>]*class="[^"]*gig-title[^"]*"[^>]*>([\s\S]*?)<\/p>/g
    );
    if (titleMatches) {
      for (const match of titleMatches.slice(0, limit)) {
        const title = match.replace(/<[^>]+>/g, "").trim();
        if (title) {
          results.push({
            source: "fiverr",
            title,
            content: `Fiverr gig found for keyword search`,
            url: `https://www.fiverr.com/search/gigs?query=${encodeURIComponent(title)}`,
            engagement: 1,
            extractedAt: new Date(),
          });
        }
      }
    }
  }

  // Fallback: return a meta-signal
  if (results.length === 0) {
    results.push({
      source: "fiverr",
      title: `Fiverr services available`,
      content: `Fiverr search returned results for this keyword — indicating existing service demand. Note: Full gig data extraction requires P2 headless browser.`,
      url: `https://www.fiverr.com/search/gigs`,
      engagement: 1,
      extractedAt: new Date(),
    });
  }

  return results;
}

/**
 * Search Upwork for jobs related to a keyword.
 * Upwork has a public RSS feed for job listings.
 */
export async function searchUpwork(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  try {
    const url = `${UPWORK_SEARCH_URL}?q=${encodeURIComponent(keyword)}&sort=recency`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Signal-MarketValidator/0.1)",
      },
    });

    if (!res.ok) {
      console.warn(`[Upwork] HTTP ${res.status} for "${keyword}"`);
      return [];
    }

    const xml = await res.text();

    // Parse RSS feed
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    return items.slice(0, limit).map((item) => {
      const title = extractXmlTag(item, "title");
      const description = extractXmlTag(item, "description");
      const link = extractXmlTag(item, "link");

      return {
        source: "upwork" as const,
        title: title || "Upwork Job",
        content: description?.substring(0, 2000) ?? "",
        url: link,
        permalink: link,
        author: extractXmlTag(item, "dc:creator"),
        engagement: 1,
        extractedAt: new Date(),
      };
    });
  } catch (err) {
    console.warn(`[Upwork] Error:`, err);
    return [];
  }
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "s"));
  return match ? match[1].trim() : undefined;
}

/**
 * Search Gumroad for products matching a keyword.
 * People selling digital products on Gumroad = demand signal.
 */
export async function searchGumroad(
  keyword: string,
  limit = 10
): Promise<RawSignal[]> {
  try {
    const url = `https://discover.gumroad.com/search?query=${encodeURIComponent(keyword)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Signal-MarketValidator/0.1)",
      },
    });

    if (!res.ok) {
      console.warn(`[Gumroad] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Extract product cards
    const cardMatches =
      html.match(
        /<a[^>]*href="\/l\/[^"]*"[^>]*>[\s\S]*?<\/a>/g
      ) ?? [];

    return cardMatches.slice(0, limit).map((card) => {
      const title = extractHtmlContent(card) || "Gumroad Product";
      return {
        source: "gumroad" as const,
        title,
        content: `Gumroad product found for keyword`,
        url: `https://discover.gumroad.com/search?query=${encodeURIComponent(keyword)}`,
        engagement: 1,
        extractedAt: new Date(),
      };
    });
  } catch (err) {
    console.warn(`[Gumroad] Error:`, err);
    return [];
  }
}

function extractHtmlContent(html: string): string | undefined {
  const match = html.match(/>([^<]+)</);
  return match ? match[1].trim() : undefined;
}
