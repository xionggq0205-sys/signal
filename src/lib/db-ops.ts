/**
 * Database operations for Signal platform.
 * CRUD wrappers around Prisma for topics, signals, scores, alerts.
 */

import { prisma } from "./db";
import type { RawSignal, ClassifiedSignal, DemandScore, GoNoGoDecision } from "./types";

// ─── Topics ─────────────────────────────────────────────────

export async function createTopic(userId: string, title: string, description: string, keywords: string[]) {
  return prisma.topic.create({
    data: {
      userId,
      title,
      description,
      keywords: JSON.stringify(keywords),
    },
  });
}

export async function getTopic(topicId: string) {
  return prisma.topic.findUnique({
    where: { id: topicId },
    include: { signals: { orderBy: { extractedAt: "desc" }, take: 100 } },
  });
}

export async function getUserTopics(userId: string) {
  return prisma.topic.findMany({
    where: { userId, status: "active" },
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Signals ────────────────────────────────────────────────

export async function saveSignals(topicId: string, signals: ClassifiedSignal[]) {
  // SQLite doesn't support skipDuplicates, so we de-duplicate manually
  const existingUrls = new Set(
    (
      await prisma.signal.findMany({
        where: {
          topicId,
          url: { in: signals.map((s) => s.url).filter(Boolean) as string[] },
        },
        select: { url: true },
      })
    ).map((s) => s.url)
  );

  const newSignals = signals.filter((s) => !s.url || !existingUrls.has(s.url));
  if (newSignals.length === 0) return 0;

  const data = newSignals.map((s) => ({
    topicId,
    source: s.source,
    type: s.type,
    title: s.title,
    content: s.content,
    url: s.url,
    permalink: s.permalink,
    author: s.author,
    engagement: s.engagement,
    intensity: s.intensity,
    specificity: s.specificity,
    wtpSignal: s.wtpSignal,
    extractedAt: s.extractedAt,
  }));

  let count = 0;
  for (const signal of data) {
    try {
      await prisma.signal.create({ data: signal });
      count++;
    } catch {
      // Duplicate key — skip silently
    }
  }

  return count;
}

export async function getSignals(
  topicId: string,
  options?: { source?: string; type?: string; limit?: number }
) {
  return prisma.signal.findMany({
    where: {
      topicId,
      ...(options?.source ? { source: options.source } : {}),
      ...(options?.type ? { type: options.type } : {}),
    },
    orderBy: { extractedAt: "desc" },
    take: options?.limit ?? 100,
  });
}

// ─── Score Snapshots ────────────────────────────────────────

export async function saveScoreSnapshot(
  topicId: string,
  score: DemandScore,
  decision?: GoNoGoDecision
) {
  return prisma.scoreSnapshot.create({
    data: {
      topicId,
      compositeScore: score.composite,
      frequencyScore: score.frequency,
      intensityScore: score.intensity,
      specificityScore: score.specificity,
      monetizabilityScore: score.monetizability,
      totalSignals: score.totalSignals,
      activeSignals: score.activeSignals,
      growthRate: score.growthRate,
      goDecision: decision?.decision,
      goReasons: decision?.goReasons ? JSON.stringify(decision.goReasons) : null,
      noGoReasons: decision?.noGoReasons ? JSON.stringify(decision.noGoReasons) : null,
      snappedAt: new Date(),
    },
  });
}

export async function getScoreSnapshots(topicId: string, limit = 30) {
  return prisma.scoreSnapshot.findMany({
    where: { topicId },
    orderBy: { snappedAt: "desc" },
    take: limit,
  });
}

export async function getLatestScore(topicId: string) {
  return prisma.scoreSnapshot.findFirst({
    where: { topicId },
    orderBy: { snappedAt: "desc" },
  });
}

// ─── Alerts ─────────────────────────────────────────────────

export async function createAlert(
  topicId: string,
  type: string,
  message: string
) {
  return prisma.alert.create({
    data: { topicId, type, message },
  });
}

export async function getUnreadAlerts(topicId: string) {
  return prisma.alert.findMany({
    where: { topicId, read: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function markAlertRead(alertId: string) {
  return prisma.alert.update({
    where: { id: alertId },
    data: { read: true },
  });
}
