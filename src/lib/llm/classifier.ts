/**
 * LLM Signal Classification Pipeline
 *
 * Uses rule-based + keyword heuristics for MVP.
 * P2: Integrate Claude/GPT API for zero-shot classification.
 *
 * Classification categories:
 * - pain_point: User is clearly frustrated ("annoying", "frustrating", "broken")
 * - feature_request: User wants specific functionality ("wish it had", "needs a")
 * - complaint: General negative sentiment without specific ask
 * - comparison: User compares alternatives ("vs", "alternative to")
 * - payment_signal: User expresses willingness to pay ("take my money", "would pay")
 * - question: User asks about a solution ("anyone know", "how to")
 */

import type { RawSignal, ClassifiedSignal, SignalType } from "../types";

// ─── Rule-based keywords ────────────────────────────────────

const PATTERNS: Record<SignalType, string[]> = {
  pain_point: [
    "frustrating", "annoying", "hate", "terrible", "awful",
    "broken", "doesn't work", "keeps crashing", "so bad",
    "waste of time", "drives me crazy", "nightmare",
    "can't stand", "sucks", "useless", "horrible",
    "difficult to", "hard to", "complicated", "clunky",
  ],
  feature_request: [
    "wish it had", "needs a", "should have", "would love",
    "missing feature", "why doesn't it", "if only",
    "add support for", "please add", "wish there was",
    "would be nice if", "it lacks", "need the ability to",
    "want to be able to", "hoping for", "looking forward to",
  ],
  complaint: [
    "too expensive", "overpriced", "not worth", "disappointed",
    "waste of money", "regret", "doesn't live up to",
    "used to be good", "getting worse", "going downhill",
    "poor support", "buggy", "unreliable", "slow",
    "tried it but", "switched away", "moved to",
  ],
  comparison: [
    "vs", "versus", "alternative to", "better than",
    "compared to", "similar to", "instead of",
    "replacement for", "looking for alternative",
    "switched from", "moving away from", "like X but",
    "different from", "unlike",
  ],
  payment_signal: [
    "take my money", "shut up and take", "would pay",
    "willing to pay", "worth paying", "i'd buy",
    "premium", "subscription", "pricing", "how much",
    "where to buy", "where can i get", "sign me up",
    "give me", "i need this", "instant buy",
    "day one purchase", "waiting for", "when is it available",
  ],
  question: [
    "anyone know", "how to", "where to find", "recommend",
    "suggestions?", "what do you use", "any recommendations",
    "looking for", "seeking", "help with", "need help",
    "what's the best", "which is better", "is there a",
    "has anyone tried", "does anyone have experience",
  ],
};

// ─── Classification ─────────────────────────────────────────

/**
 * Classify a single raw signal using rule-based pattern matching.
 * Returns a ClassifiedSignal with type, intensity, specificity, WTP scores.
 */
export function classifySignal(signal: RawSignal): ClassifiedSignal {
  const text = `${signal.title} ${signal.content}`.toLowerCase();

  // Score each category
  const scores = Object.entries(PATTERNS).map(([type, patterns]) => {
    let score = 0;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    return { type: type as SignalType, score };
  });

  // Pick the highest-scoring type
  scores.sort((a, b) => b.score - a.score);
  const primaryType = scores[0]?.score > 0 ? scores[0].type : "question";

  // Calculate intensity (0-1): based on keyword density and sentiment strength
  const intensity = calculateIntensity(text, primaryType);

  // Calculate specificity (0-1): based on detail level (length, examples, specifics)
  const specificity = calculateSpecificity(signal);

  // Calculate WTP signal (0-1): based on payment keywords
  const wtpSignal = scores.find((s) => s.type === "payment_signal")?.score ?? 0;
  const wtpNormalized = Math.min(wtpSignal / 5, 1); // cap at 1.0

  return {
    ...signal,
    type: primaryType,
    intensity,
    specificity,
    wtpSignal: wtpNormalized,
    classificationReason: generateReason(primaryType, scores),
  };
}

/**
 * Batch classify multiple signals.
 */
export function classifySignals(signals: RawSignal[]): ClassifiedSignal[] {
  return signals.map(classifySignal);
}

// ─── Scoring helpers ────────────────────────────────────────

function calculateIntensity(text: string, type: SignalType): number {
  // Strong emotion words boost intensity
  const strongEmotion = [
    "hate", "terrible", "awful", "nightmare", "drives me crazy",
    "furious", "desperate", "can't stand",
  ];
  const mediumEmotion = [
    "frustrating", "annoying", "disappointed", "broken", "useless",
  ];
  const mildEmotion = ["not great", "could be better", "meh", "ok but"];

  let score = 0;
  for (const word of strongEmotion) {
    if (text.includes(word)) score += 0.3;
  }
  for (const word of mediumEmotion) {
    if (text.includes(word)) score += 0.15;
  }
  for (const word of mildEmotion) {
    if (text.includes(word)) score += 0.05;
  }

  // Exclamation marks and caps indicate intensity
  const exclCount = (text.match(/!/g) ?? []).length;
  score += Math.min(exclCount * 0.05, 0.15);

  // ALL CAPS words indicate intensity
  const capsWords = text.match(/\b[A-Z]{3,}\b/g) ?? [];
  score += Math.min(capsWords.length * 0.05, 0.1);

  return Math.min(score, 1);
}

function calculateSpecificity(signal: RawSignal): number {
  const text = `${signal.title} ${signal.content}`;
  let score = 0;

  // Longer descriptions tend to be more specific
  if (text.length > 500) score += 0.3;
  else if (text.length > 200) score += 0.2;
  else if (text.length > 100) score += 0.1;

  // Specific details boost score
  const specificMarkers = [
    /\$\d+/, // dollar amounts
    /\d+\s*(users?|customers?|people)/i, // user counts
    /\d+\s*(months?|weeks?|days?|years?)/i, // time frames
    /step\s*\d/i, // step-by-step
    /because/i, // reasoning
    /example/i, // examples
    /specifically/i,
  ];

  for (const marker of specificMarkers) {
    if (marker.test(text)) score += 0.1;
  }

  return Math.min(score, 1);
}

function generateReason(
  type: SignalType,
  scores: { type: SignalType; score: number }[]
): string {
  const top3 = scores
    .filter((s) => s.score > 0)
    .slice(0, 3)
    .map((s) => `${s.type}(${s.score})`)
    .join(", ");

  const labels: Record<SignalType, string> = {
    pain_point: "User expresses strong frustration or pain",
    feature_request: "User requests specific functionality",
    complaint: "User expresses general dissatisfaction",
    comparison: "User compares or seeks alternatives",
    payment_signal: "User shows willingness to pay",
    question: "User asks about solutions or recommendations",
  };

  return `${labels[type]}. Signal scores: ${top3}`;
}
