/**
 * 关键词语境转换引擎（扩词）
 * 中文思维 → 英文真实表达，5 类扩展
 */

import type { ExpandedKeywords } from "../types";

/**
 * Expand a user's product idea into 5 categories of English search keywords.
 * This solves the "Chinese thinking → English user behavior" gap.
 */
export function expandKeywords(rawInput: string): ExpandedKeywords {
  const input = rawInput.toLowerCase().trim();

  // Build keyword clusters based on common patterns
  const patterns = buildKeywordPatterns(input);

  return {
    direct: patterns.direct.slice(0, 8),
    adjacent: patterns.adjacent.slice(0, 6),
    coOccurring: patterns.coOccurring.slice(0, 6),
    platformContext: patterns.platformContext.slice(0, 6),
    exclude: patterns.exclude.slice(0, 4),
  };
}

interface KeywordPatterns {
  direct: string[];
  adjacent: string[];
  coOccurring: string[];
  platformContext: string[];
  exclude: string[];
}

function buildKeywordPatterns(input: string): KeywordPatterns {
  // Common adjacent pain words
  const painModifiers = [
    "too complicated",
    "keeps crashing",
    "too expensive",
    "slow",
    "buggy",
    "frustrating",
    "annoying",
    "broken",
    "doesn't work",
    "hard to use",
  ];

  const comparisonModifiers = [
    "alternative to",
    "vs",
    "compared to",
    "better than",
    "cheaper than",
    "replacement for",
    "switched from",
    "moved away from",
  ];

  const intentModifiers = [
    "looking for",
    "need a",
    "want to",
    "anyone know",
    "recommend me",
    "best way to",
    "how to",
    "where to find",
    "is there a",
  ];

  const paidModifiers = [
    "willing to pay",
    "take my money",
    "shut up and take",
    "premium",
    "worth paying",
    "subscription",
    "buy",
    "purchase",
  ];

  // Simple word tokenization (MVP approach; P2: LLM-driven expansion)
  const words = input.split(/\s+/).filter((w) => w.length > 2);
  const phrase = input;

  return {
    direct: [
      phrase,
      `best ${phrase}`,
      `${phrase} tool`,
      `${phrase} software`,
      `${phrase} app`,
      `online ${phrase}`,
      `free ${phrase}`,
      `${phrase} service`,
    ],

    adjacent: painModifiers.map((m) => `${phrase} ${m}`),

    coOccurring: [
      ...comparisonModifiers.map((m) => `${m} ${phrase}`),
      `${phrase} open source`,
      `${phrase} saas`,
      `${phrase} chrome extension`,
      `${phrase} api`,
      `${phrase} github`,
    ],

    platformContext: [
      ...intentModifiers.map((m) => `${m} ${phrase}`),
      ...paidModifiers.map((m) => `${phrase} ${m}`),
    ],

    exclude: [
      `${phrase} tutorial`,
      `${phrase} course`,
      `${phrase} definition`,
      `${phrase} meaning`,
    ],
  };
}

/**
 * Generate LLM prompt for advanced keyword expansion.
 * P2 feature — uses Claude/GPT to produce more nuanced Anglo-market keywords.
 */
export function generateExplansionPrompt(input: string): string {
  return `You are a market researcher helping an indie hacker validate a product idea.

The founder's rough idea (possibly in Chinese-thinking English): "${input}"

Generate 5 categories of search keywords that real English-speaking users would type:

1. **Direct keywords** (8 items): Exact things users search for when they want this solution
2. **Adjacent pain keywords** (6 items): Related pain points users complain about that this product could solve  
3. **Co-occurring keywords** (6 items): Things users search alongside this — comparisons, alternatives, "vs", "open source"
4. **Platform-context keywords** (6 items): How users express intent on Reddit/HN/Product Hunt — "looking for", "anyone know", "recommend me"
5. **Exclude keywords** (4 items): Related terms that sound relevant but are actually different intent (tutorials, definitions, courses)

For each keyword, explain briefly WHY a real user would type it.

Output as JSON:
{
  "direct": [{ "keyword": "...", "why": "..." }],
  "adjacent": [{ "keyword": "...", "why": "..." }],
  "coOccurring": [{ "keyword": "...", "why": "..." }],
  "platformContext": [{ "keyword": "...", "why": "..." }],
  "exclude": [{ "keyword": "...", "why": "..." }]
}`;
}
