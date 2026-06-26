/**
 * Main Signal Pipeline: Collect → Classify → Score → Persist
 *
 * This is the core workflow that ties together:
 * 1. Signal Collection (5 sources + 扩词)
 * 2. LLM Classification
 * 3. Demand Scoring
 * 4. GO/NO-GO Decision
 * 5. Persistence to SQLite via Prisma
 */

import { collectSignals, expandKeywords, generateMockSignals } from "./signals/collector";
import { classifySignals } from "./llm/classifier";
import { calculateDemandScore, makeGoNoGoDecision } from "./scoring/engine";
import { saveSignals, saveScoreSnapshot, createAlert, getTopic } from "./db-ops";
import type { DemandScore, GoNoGoDecision, ClassifiedSignal } from "./types";

export interface PipelineResult {
  topicId: string;
  signals: ClassifiedSignal[];
  score: DemandScore;
  decision: GoNoGoDecision;
  signalsSaved: number;
}

/**
 * Run the full Signal pipeline for a topic.
 *
 * @param topicId - Existing topic ID
 * @param query - The user's original product idea description
 * @returns PipelineResult with collected signals, score, and decision
 */
export async function runPipeline(
  topicId: string,
  query: string
): Promise<PipelineResult> {
  // Step 0: Get topic for keyword context
  const topic = await getTopic(topicId);
  if (!topic) throw new Error(`Topic not found: ${topicId}`);

  // Step 1: Collect signals from 5 sources
  console.log(`[Pipeline] Collecting signals for: "${query}"`);
  const rawSignals = await collectSignals(query);
  console.log(`[Pipeline] Collected ${rawSignals.length} raw signals`);

  // Step 2: Classify each signal
  const classifiedSignals = classifySignals(rawSignals);
  console.log(
    `[Pipeline] Classified: ${classifiedSignals.length} signals`
  );

  // Step 3: Calculate demand score
  const score = calculateDemandScore(classifiedSignals);
  console.log(`[Pipeline] Composite Score: ${score.composite}/100`);

  // Step 4: GO/NO-GO Decision
  const decision = makeGoNoGoDecision(classifiedSignals, score);
  console.log(`[Pipeline] Decision: ${decision.decision.toUpperCase()}`);

  // Step 5: Persist signals to database
  const signalsSaved = await saveSignals(topicId, classifiedSignals);
  console.log(`[Pipeline] Saved ${signalsSaved} signals`);

  // Step 6: Save score snapshot
  await saveScoreSnapshot(topicId, score, decision);

  // Step 7: Create alerts for high-intensity findings
  if (decision.decision === "go") {
    await createAlert(
      topicId,
      "go_decision",
      `GO decision reached with composite score ${score.composite}/100. ${decision.goReasons.length} conditions met.`
    );
  }

  const highIntensitySignals = classifiedSignals.filter(
    (s) => s.intensity > 0.7
  );
  for (const s of highIntensitySignals.slice(0, 3)) {
    await createAlert(
      topicId,
      "high_intensity_signal",
      `High-intensity ${s.type} signal found on ${s.source}: "${s.title.substring(0, 100)}"`
    );
  }

  return {
    topicId,
    signals: classifiedSignals,
    score,
    decision,
    signalsSaved,
  };
}

/**
 * Quick scan: run pipeline for a subset of sources (faster, for initial preview).
 * Uses only Reddit + HN + Google Trends for speed.
 * Falls back to mock data if no real signals found.
 */
export async function quickScan(
  topicId: string,
  query: string
): Promise<PipelineResult> {
  console.log(`[QuickScan] Fast-scanning: "${query}"`);
  let rawSignals = await collectSignals(query, {
    keywords: expandKeywords(query).direct.slice(0, 3),
    sources: {
      reddit: true,
      hackernews: true,
      producthunt: true,
      googletrends: true,
      fiverr: false,
      upwork: false,
      gumroad: false,
    },
    maxPerSource: 5,
  });

  if (rawSignals.length === 0) {
    console.log(`[QuickScan] No real signals — using mock data`);
    rawSignals = generateMockSignals(query);
  }

  const classifiedSignals = classifySignals(rawSignals);
  const score = calculateDemandScore(classifiedSignals);
  const decision = makeGoNoGoDecision(classifiedSignals, score);

  await saveSignals(topicId, classifiedSignals);
  await saveScoreSnapshot(topicId, score, decision);

  return {
    topicId,
    signals: classifiedSignals,
    score,
    decision,
    signalsSaved: classifiedSignals.length,
  };
}

/**
 * Run pipeline with mock signals (development/demo mode).
 * Used when API keys are not configured.
 */
export async function runMockPipeline(
  topicId: string,
  query: string
): Promise<PipelineResult> {
  console.log(`[MockPipeline] Generating mock signals for: "${query}"`);
  const rawSignals = generateMockSignals(query);
  const classifiedSignals = classifySignals(rawSignals);
  const score = calculateDemandScore(classifiedSignals);
  const decision = makeGoNoGoDecision(classifiedSignals, score);

  await saveSignals(topicId, classifiedSignals);
  await saveScoreSnapshot(topicId, score, decision);

  return {
    topicId,
    signals: classifiedSignals,
    score,
    decision,
    signalsSaved: classifiedSignals.length,
  };
}
