import { NextRequest, NextResponse } from "next/server";
import { callLLMRaw } from "@/lib/openrouter";
import { ProjectSuggestionSchema } from "@/types";
import { z } from "zod";
import {
  PROJECT_GENERATOR_SYSTEM_PROMPT,
  buildProjectGeneratorUserPrompt,
} from "@/lib/prompts/project-generator-prompt";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Schema for the LLM output wrapper
const ProjectsOutputSchema = z.object({
  projects: z.array(ProjectSuggestionSchema),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { missingSkills, roleProfile } = body;

    if (!missingSkills || !Array.isArray(missingSkills) || missingSkills.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'missingSkills' array." },
        { status: 400 }
      );
    }

    if (!roleProfile) {
      return NextResponse.json(
        { error: "Missing 'roleProfile' field." },
        { status: 400 }
      );
    }

    const raw = await callLLMRaw({
      systemPrompt: PROJECT_GENERATOR_SYSTEM_PROMPT,
      userPrompt: buildProjectGeneratorUserPrompt(missingSkills, roleProfile),
      temperature: 0.5,
    });

    // Validate
    const result = ProjectsOutputSchema.safeParse(raw);
    if (!result.success) {
      console.error("Project generator validation failed:", result.error.issues);
      return NextResponse.json(
        { error: "LLM returned invalid project data.", details: result.error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data.projects);
  } catch (err) {
    console.error("Generate projects route error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate project suggestions.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
