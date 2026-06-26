/**
 * API Route: GET /api/topics — list all topics
 * API Route: POST /api/topics — create a new topic
 */

import { NextRequest, NextResponse } from "next/server";
import { createTopic, listTopics } from "@/lib/db-ops";
import { quickScan } from "@/lib/pipeline";
import { expandKeywords } from "@/lib/signals/collector";

export async function GET() {
  try {
    const topics = await listTopics();
    return NextResponse.json(topics);
  } catch (err) {
    console.error("[GET /api/topics]", err);
    return NextResponse.json(
      { error: "Failed to list topics" },
      { status: 500 }
    );
  }
}

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
