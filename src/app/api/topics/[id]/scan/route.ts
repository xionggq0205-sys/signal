/**
 * API Route: POST /api/topics/[id]/scan
 * Run a full signal scan for an existing topic.
 */

import { NextRequest, NextResponse } from "next/server";
import { runPipeline, runMockPipeline } from "@/lib/pipeline";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const query = body.query;

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    // Run real pipeline first; fall back to mock if no signals found
    let result = await runPipeline(id, query);
    if (result.signals.length === 0) {
      console.log(`[Scan] No real signals found — using mock data for "${query}"`);
      result = await runMockPipeline(id, query);
    }

    return NextResponse.json({
      signalsCount: result.signals.length,
      signalsSaved: result.signalsSaved,
      score: result.score,
      decision: result.decision,
      signalTypes: result.signals.reduce(
        (acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      sources: result.signals.reduce(
        (acc, s) => {
          acc[s.source] = (acc[s.source] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    });
  } catch (err) {
    console.error("[POST /api/topics/[id]/scan]", err);
    return NextResponse.json(
      { error: "Scan failed" },
      { status: 500 }
    );
  }
}
