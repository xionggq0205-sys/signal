/**
 * API Route: GET /api/topics/[id]/score
 * Get score history (for trend chart).
 */

import { NextRequest, NextResponse } from "next/server";
import { getScoreSnapshots, getLatestScore } from "@/lib/db-ops";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [snapshots, latest] = await Promise.all([
      getScoreSnapshots(id, 30),
      getLatestScore(id),
    ]);

    return NextResponse.json({
      latest: latest
        ? {
            ...latest,
            goReasons: latest.goReasons
              ? JSON.parse(latest.goReasons as string)
              : [],
            noGoReasons: latest.noGoReasons
              ? JSON.parse(latest.noGoReasons as string)
              : [],
          }
        : null,
      history: snapshots
        .reverse() // chronological order for chart
        .map((s) => ({
          date: s.snappedAt.toISOString(),
          composite: s.compositeScore,
          frequency: s.frequencyScore,
          intensity: s.intensityScore,
          specificity: s.specificityScore,
          monetizability: s.monetizabilityScore,
        })),
    });
  } catch (err) {
    console.error("[GET /api/topics/[id]/score]", err);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}
