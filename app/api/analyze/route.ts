import { NextRequest, NextResponse } from "next/server";
import { callLLM } from "@/lib/openrouter";
import {
  GapAnalysisSchema,
  GapAnalysis,
  ResumeExtractionSchema,
  RoleProfileSchema,
  GitHubVerificationSchema,
} from "@/types";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
} from "@/lib/prompts/gap-analysis-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraction, roleProfile, githubVerification, company } = body;

    // Validate inputs
    if (!extraction || !roleProfile) {
      return NextResponse.json(
        { error: "Missing required fields: 'extraction' and 'roleProfile'." },
        { status: 400 }
      );
    }

    // Validate extraction schema
    const extractionResult = ResumeExtractionSchema.safeParse(extraction);
    if (!extractionResult.success) {
      return NextResponse.json(
        { error: "Invalid extraction data.", details: extractionResult.error.issues },
        { status: 400 }
      );
    }

    // Validate role profile schema
    const roleResult = RoleProfileSchema.safeParse(roleProfile);
    if (!roleResult.success) {
      return NextResponse.json(
        { error: "Invalid role profile data.", details: roleResult.error.issues },
        { status: 400 }
      );
    }

    // Optional: validate GitHub data if provided
    let validatedGithub = undefined;
    if (githubVerification) {
      const ghResult = GitHubVerificationSchema.safeParse(githubVerification);
      if (ghResult.success) {
        validatedGithub = ghResult.data;
      }
    }

    const analysis = await callLLM<GapAnalysis>(
      {
        systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
        userPrompt: buildGapAnalysisUserPrompt(
          extractionResult.data,
          roleResult.data,
          validatedGithub,
          company
        ),
        temperature: 0.3,
      },
      GapAnalysisSchema
    );

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      {
        error: "Failed to analyze skill gaps.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
