/**
 * Four-Dimensional Demand Scoring Engine
 *
 * Composite Demand Score = Weighted Average of 4 dimensions:
 * - Frequency (25%): How often this demand appears + growth trend
 * - Intensity (30%): How strongly users feel about the pain
 * - Specificity (20%): How detailed/concrete the demand descriptions are
 * - Monetizability (25%): Willingness-to-pay signals
 *
 * Weight rationale: Intensity > Monetizability > Frequency > Specificity
 * — because a few highly-intense, willing-to-pay users matter more
 *   than many vaguely-interested users.
 */

import type { ClassifiedSignal, DemandScore, GoNoGoDecision } from "../types";

/**
 * Calculate the composite demand score from classified signals.
 */
export function calculateDemandScore(
  signals: ClassifiedSignal[]
): DemandScore {
  if (signals.length === 0) {
    return {
      composite: 0,
      frequency: 0,
      intensity: 0,
      specificity: 0,
      monetizability: 0,
      totalSignals: 0,
      activeSignals: 0,
      growthRate: 0,
    };
  }

  const total = signals.length;

  // Active signals: within last 30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeSignals = signals.filter(
    (s) => s.extractedAt.getTime() > thirtyDaysAgo
  ).length;

  // ─── Dimension 1: Frequency Score (0-25) ───────────────
  // Based on total signal count + growth rate
  const signalCountScore = Math.min(total / 50, 1) * 15; // max at 50+ signals
  const growthRate = total > 0 ? activeSignals / total : 0;
  const growthScore = growthRate * 10;
  const frequencyScore = Math.min(signalCountScore + growthScore, 25);

  // ─── Dimension 2: Intensity Score (0-30) ───────────────
  // Average emotional intensity × reach (signals with high intensity %)
  const avgIntensity =
    signals.reduce((sum, s) => sum + s.intensity, 0) / total;
  const highIntensityRatio =
    signals.filter((s) => s.intensity > 0.5).length / total;
  const intensityScore =
    Math.min(avgIntensity * 20 + highIntensityRatio * 10, 30);

  // ─── Dimension 3: Specificity Score (0-20) ─────────────
  // How detailed/concrete the demand descriptions are
  const avgSpecificity =
    signals.reduce((sum, s) => sum + s.specificity, 0) / total;
  const specificityScore = Math.min(avgSpecificity * 20, 20);

  // ─── Dimension 4: Monetizability Score (0-25) ──────────
  // WTP signals + payment signal ratio
  const avgWtp =
    signals.reduce((sum, s) => sum + s.wtpSignal, 0) / total;
  const paymentRatio =
    signals.filter((s) => s.type === "payment_signal").length / total;
  const monetizabilityScore = Math.min(
    avgWtp * 15 + paymentRatio * 10,
    25
  );

  // ─── Composite Score ───────────────────────────────────
  const composite = parseFloat(
    (
      frequencyScore +
      intensityScore +
      specificityScore +
      monetizabilityScore
    ).toFixed(1)
  );

  return {
    composite,
    frequency: parseFloat(frequencyScore.toFixed(1)),
    intensity: parseFloat(intensityScore.toFixed(1)),
    specificity: parseFloat(specificityScore.toFixed(1)),
    monetizability: parseFloat(monetizabilityScore.toFixed(1)),
    totalSignals: total,
    activeSignals,
    growthRate: parseFloat(growthRate.toFixed(2)),
  };
}

// ─── GO / NO-GO Decision Framework ─────────────────────────

const GO_CONDITIONS = [
  {
    id: "multi_platform_validation",
    label: "Multi-platform validation (3+ sources show same demand)",
    check: (signals: ClassifiedSignal[]) => {
      const sources = new Set(signals.map((s) => s.source));
      return sources.size >= 3;
    },
  },
  {
    id: "high_intensity",
    label: "High pain intensity (avg intensity > 0.6)",
    check: (signals: ClassifiedSignal[]) => {
      const avg =
        signals.reduce((sum, s) => sum + s.intensity, 0) / signals.length;
      return avg > 0.6;
    },
  },
  {
    id: "clear_differentiation",
    label: "Clear differentiation opportunity (no dominant solution)",
    check: (signals: ClassifiedSignal[]) => {
      const complaintRatio =
        signals.filter((s) => s.type === "complaint").length / signals.length;
      const comparisonRatio =
        signals.filter((s) => s.type === "comparison").length / signals.length;
      return complaintRatio > 0.1 || comparisonRatio > 0.15;
    },
  },
  {
    id: "growing_market",
    label: "Growing demand (growth rate > 0.5)",
    check: (signals: ClassifiedSignal[], score: DemandScore) => {
      return score.growthRate > 0.5;
    },
  },
  {
    id: "payment_intent",
    label: "Willingness to pay detected (WTP > 0.3 or payment signals present)",
    check: (signals: ClassifiedSignal[]) => {
      return signals.some((s) => s.type === "payment_signal" && s.wtpSignal > 0.5);
    },
  },
];

const NOGO_CONDITIONS = [
  {
    id: "too_little_signal",
    label: "Fewer than 3 strong pain points found",
    check: (signals: ClassifiedSignal[]) => {
      const painPoints = signals.filter(
        (s) => s.type === "pain_point" && s.intensity > 0.5
      );
      return painPoints.length < 3;
    },
  },
  {
    id: "free_competitor",
    label: "Dominant free competitor exists with high satisfaction",
    check: (signals: ClassifiedSignal[]) => {
      // Check for positive mentions of free alternatives vs. complaint ratio
      const complaints = signals.filter(
        (s) => s.type === "complaint"
      ).length;
      return complaints === 0 && signals.length > 5;
    },
  },
  {
    id: "declining_interest",
    label: "Declining search interest (growth rate < 0)",
    check: (signals: ClassifiedSignal[], score: DemandScore) => {
      return score.growthRate < 0;
    },
  },
  {
    id: "no_acquisition_channel",
    label: "No clear customer acquisition channel identified",
    check: (signals: ClassifiedSignal[], score: DemandScore) => {
      return score.totalSignals < 5; // proxy: very few signals = no channel
    },
  },
];

/**
 * Generate GO/NO-GO decision based on signals and demand score.
 */
export function makeGoNoGoDecision(
  signals: ClassifiedSignal[],
  score: DemandScore
): GoNoGoDecision {
  if (signals.length === 0) {
    return {
      decision: "uncertain",
      goReasons: [],
      noGoReasons: ["No signals collected yet — run a scan first"],
      recommendation:
        "Start by collecting signals from Reddit and Hacker News to gather initial data.",
    };
  }

  const goReasons: string[] = [];
  const noGoReasons: string[] = [];

  for (const condition of GO_CONDITIONS) {
    if (condition.check(signals, score)) {
      goReasons.push(condition.label);
    }
  }

  for (const condition of NOGO_CONDITIONS) {
    if (condition.check(signals, score)) {
      noGoReasons.push(condition.label);
    }
  }

  let decision: "go" | "no_go" | "uncertain";
  let recommendation: string;

  if (goReasons.length >= 3 && noGoReasons.length < 2) {
    decision = "go";
    recommendation = generateGoRecommendation(goReasons, score);
  } else if (noGoReasons.length >= 2 && goReasons.length < 2) {
    decision = "no_go";
    recommendation = generateNoGoRecommendation(noGoReasons, score);
  } else {
    decision = "uncertain";
    recommendation = generateUncertainRecommendation(
      goReasons,
      noGoReasons,
      score
    );
  }

  return { decision, goReasons, noGoReasons, recommendation };
}

function generateGoRecommendation(
  goReasons: string[],
  score: DemandScore
): string {
  return `Strong demand signal detected (composite score: ${score.composite}/100). 
${goReasons.length} GO conditions met — this idea has genuine market pull. 
Recommended next: Build a minimal landing page with a waitlist to validate further, 
then scope your MVP around the most intense pain points found. 
Estimated MVP scope: ${Math.min(score.totalSignals, 5)} core features.`;
}

function generateNoGoRecommendation(
  noGoReasons: string[],
  score: DemandScore
): string {
  return `Weak demand signal (composite score: ${score.composite}/100). 
${noGoReasons.length} NO-GO conditions triggered. 
Recommendation: Pivot or shelve. If you still believe in the idea, 
try searching with different keywords or a narrower problem definition.`;
}

function generateUncertainRecommendation(
  goReasons: string[],
  noGoReasons: string[],
  score: DemandScore
): string {
  return `Mixed signals (composite score: ${score.composite}/100). 
GO conditions met: ${goReasons.length}. NO-GO triggered: ${noGoReasons.length}. 
Recommendation: Gather more data over 2-4 weeks of monitoring, 
or run a concierge test with 3-5 target users to get qualitative feedback.`;
}
