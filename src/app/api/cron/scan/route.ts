/**
 * Cron API: GET /api/cron/scan
 * Trigger scheduled 6-hourly scan of all active topics.
 * Called by Vercel Cron Jobs or external scheduler.
 */

import { NextResponse } from "next/server";
import { scheduledScan } from "@/lib/scheduler";

export async function GET() {
  try {
    const results = await scheduledScan();
    return NextResponse.json({
      success: true,
      topicsScanned: results.length,
      results: results.map((r) => ({
        topicId: r.topicId,
        score: r.score.composite,
        decision: r.decision.decision,
        signals: r.signalsSaved,
      })),
    });
  } catch (err) {
    console.error("[Cron/scan]", err);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
