/**
 * API Route: GET /api/topics/[id]/signals
 * Get signals for a topic with optional filters.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSignals } from "@/lib/db-ops";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const source = req.nextUrl.searchParams.get("source") ?? undefined;
  const type = req.nextUrl.searchParams.get("type") ?? undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  try {
    const signals = await getSignals(id, { source, type, limit });

    return NextResponse.json(
      signals.map((s) => ({
        ...s,
        extractedAt: s.extractedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("[GET /api/topics/[id]/signals]", err);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
