/**
 * Scheduled Job Runner (Cron-based)
 *
 * P1: Basic cron scheduler for periodic signal re-collection.
 * P2: Email alerts, weekly digests, more sophisticated scheduling.
 *
 * This module is designed to run as a Next.js API route triggered
 * by an external cron service (or Vercel Cron Jobs).
 */

import { prisma } from "./db";
import { runPipeline } from "./pipeline";
import type { PipelineResult } from "./pipeline";

/**
 * Run scheduled scan for all active topics.
 * Triggered by GET /api/cron/scan (called by Vercel Cron or external scheduler).
 */
export async function scheduledScan(): Promise<PipelineResult[]> {
  const activeTopics = await prisma.topic.findMany({
    where: { status: "active" },
  });

  console.log(
    `[Scheduler] Running scheduled scan for ${activeTopics.length} topics`
  );

  const results: PipelineResult[] = [];

  for (const topic of activeTopics) {
    try {
      console.log(`[Scheduler] Scanning topic: ${topic.id} (${topic.title})`);
      // Use title for search — shorter keywords yield more signals than long descriptions
      const result = await runPipeline(topic.id, topic.title);
      results.push(result);
      console.log(
        `[Scheduler] Topic ${topic.id}: score ${result.score.composite}, decision ${result.decision.decision}`
      );
    } catch (err) {
      console.error(
        `[Scheduler] Error scanning topic ${topic.id}:`,
        err
      );
    }
  }

  return results;
}

/**
 * Generate a daily digest of alert-worthy changes.
 */
export async function generateDailyDigest(): Promise<
  { topicId: string; title: string; score: number; changes: string[] }[]
> {
  const activeTopics = await prisma.topic.findMany({
    where: { status: "active" },
    include: {
      scoreSnapshots: {
        orderBy: { snappedAt: "desc" },
        take: 2,
      },
    },
  });

  const digests: {
    topicId: string;
    title: string;
    score: number;
    changes: string[];
  }[] = [];

  for (const topic of activeTopics) {
    const changes: string[] = [];
    const [latest, previous] = topic.scoreSnapshots;

    if (latest && previous) {
      const scoreDelta = latest.compositeScore - previous.compositeScore;
      if (Math.abs(scoreDelta) > 5) {
        changes.push(
          `Score ${scoreDelta > 0 ? "rose" : "dropped"} by ${Math.abs(scoreDelta).toFixed(1)} points (${
            previous.compositeScore
          } → ${latest.compositeScore})`
        );
      }

      const signalDelta = latest.totalSignals - previous.totalSignals;
      if (signalDelta > 5) {
        changes.push(
          `${signalDelta} new signals detected since last scan`
        );
      }
    }

    if (changes.length > 0 || latest) {
      digests.push({
        topicId: topic.id,
        title: topic.title,
        score: latest?.compositeScore ?? 0,
        changes,
      });
    }
  }

  return digests;
}

/**
 * Clean up old signals (older than 90 days) to keep DB size manageable.
 */
export async function cleanupOldSignals(): Promise<number> {
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  );

  const result = await prisma.signal.deleteMany({
    where: {
      extractedAt: { lt: ninetyDaysAgo },
    },
  });

  console.log(`[Cleanup] Deleted ${result.count} signals older than 90 days`);
  return result.count;
}
