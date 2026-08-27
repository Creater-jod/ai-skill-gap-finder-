import { NextRequest, NextResponse } from "next/server";
import { extractFullResume } from "@/lib/resume-extractor";

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

    if (resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short to analyze (minimum 50 characters)." },
        { status: 400 }
      );
    }

    const extraction = await extractFullResume(resumeText);

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
