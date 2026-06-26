/**
 * API Route: POST /api/topics
 * Create a new topic and run initial quick scan.
 */

import { NextRequest, NextResponse } from "next/server";
import { createTopic } from "@/lib/db-ops";
import { quickScan } from "@/lib/pipeline";
import { expandKeywords } from "@/lib/signals/collector";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

    // Expand keywords
    const expanded = expandKeywords(description);

    // Create topic (MVP: use a default user ID)
    const USER_ID = "default-user";
    const topic = await createTopic(
      USER_ID,
      title,
      description,
      expanded.direct.slice(0, 8)
    );

    // Run quick scan in background (don't block response)
    const scanPromise = quickScan(topic.id, description).catch((err) => {
      console.error("[QuickScan] Background scan failed:", err);
    });

    // Return immediately with topic info + expanded keywords
    const response = NextResponse.json({
      id: topic.id,
      title: topic.title,
      keywords: expanded,
      status: "scanning",
    });

    // Await the scan in the background after response is sent
    scanPromise.then(() => {
      console.log(`[QuickScan] Completed for topic: ${topic.id}`);
    });

    return response;
  } catch (err) {
    console.error("[POST /api/topics]", err);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
