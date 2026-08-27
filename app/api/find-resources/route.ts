import { NextRequest, NextResponse } from "next/server";
import { findResources } from "@/lib/resource-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillGaps } = body;

    if (!skillGaps || !Array.isArray(skillGaps) || skillGaps.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'skillGaps' array. Expected: [{ skill: string, severity: 'missing' | 'partial' }]" },
        { status: 400 }
      );
    }

    // Validate each gap
    for (const gap of skillGaps) {
      if (!gap.skill || !gap.severity) {
        return NextResponse.json(
          { error: "Each skill gap must have 'skill' and 'severity' fields." },
          { status: 400 }
        );
      }
      if (!["missing", "partial"].includes(gap.severity)) {
        return NextResponse.json(
          { error: "Severity must be 'missing' or 'partial'." },
          { status: 400 }
        );
      }
    }

    // Create a readable stream for streaming NDJSON results
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const batchSize = 3;
          for (let i = 0; i < skillGaps.length; i += batchSize) {
            const batch = skillGaps.slice(i, i + batchSize);
            const resources = await findResources(batch);

            for (const resource of resources) {
              const line = JSON.stringify(resource) + "\n";
              controller.enqueue(encoder.encode(line));
            }
          }

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          const errorMsg =
            JSON.stringify({
              error: "Resource search failed",
              details: (err as Error).message,
            }) + "\n";
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Find resources route error:", err);
    return NextResponse.json(
      {
        error: "Failed to find resources.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
