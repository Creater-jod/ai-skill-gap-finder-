import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/openrouter";
import { ResumeExtractionSchema, ResumeExtraction } from "@/types";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "@/lib/prompts/extraction-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'resumeText' field." },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short to analyze (minimum 50 characters)." },
        { status: 400 }
      );
    }

    // Truncate very long resumes to prevent exceeding context bounds
    const truncatedText = resumeText.slice(0, 15000);

    const extraction = await callLLM<ResumeExtraction>(
      {
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        userPrompt: buildExtractionUserPrompt(truncatedText),
        temperature: 0.2, // Low temperature for deterministic, factual extraction
      },
      ResumeExtractionSchema
    );

    return NextResponse.json(extraction);
  } catch (err) {
    console.error("Extract route error:", err);
    return NextResponse.json(
      {
        error: "Failed to extract data from resume.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
