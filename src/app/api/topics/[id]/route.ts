/**
 * API Route: GET /api/topics/[id]
 * Get topic details + latest signals + latest score.
 */

import { NextRequest, NextResponse } from "next/server";
import { getTopic, getSignals, getLatestScore } from "@/lib/db-ops";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [topic, signals, latestScore] = await Promise.all([
      getTopic(id),
      getSignals(id),
      getLatestScore(id),
    ]);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...topic,
      keywords: JSON.parse(topic.keywords as string),
      signals: signals.map((s) => ({
        ...s,
        extractedAt: s.extractedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      latestScore: latestScore
        ? {
            ...latestScore,
            goReasons: latestScore.goReasons
              ? JSON.parse(latestScore.goReasons as string)
              : [],
            noGoReasons: latestScore.noGoReasons
              ? JSON.parse(latestScore.noGoReasons as string)
              : [],
          }
        : null,
    });
  } catch (err) {
    console.error("[GET /api/topics/[id]]", err);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}
