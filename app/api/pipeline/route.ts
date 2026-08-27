import { NextRequest, NextResponse } from "next/server";
import { parsePDF, isPDFError } from "@/lib/pdf-parser";
import { callLLM, callLLMRaw } from "@/lib/openrouter";
import { extractFullResume } from "@/lib/resume-extractor";
import {
  ResumeExtractionSchema,
  ResumeExtraction,
  GapAnalysisSchema,
  GapAnalysis,
  RoleProfile,
  ProjectSuggestionSchema,
  PipelineResult,
  AgenticResource,
} from "@/types";
import {
  GAP_ANALYSIS_SYSTEM_PROMPT,
  buildGapAnalysisUserPrompt,
} from "@/lib/prompts/gap-analysis-prompt";
import {
  PROJECT_GENERATOR_SYSTEM_PROMPT,
  buildProjectGeneratorUserPrompt,
} from "@/lib/prompts/project-generator-prompt";
import { verifyGitHub } from "@/lib/github-verifier";
import { findResources } from "@/lib/resource-agent";
import { pipelineCache } from "@/lib/cache";
import { z } from "zod";

const ProjectsOutputSchema = z.object({
  projects: z.array(ProjectSuggestionSchema),
});

export async function POST(request: NextRequest) {
  try {
    let resumeText = "";
    let targetRole = "";
    let githubUsername = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      targetRole = (formData.get("targetRole") as string) || "";
      githubUsername = (formData.get("githubUsername") as string) || "";
      const rawText = formData.get("resumeText") as string | null;

      if (file && file.size > 0) {
        console.log("[Pipeline] Step 1: Parsing uploaded PDF...");
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfResult = await parsePDF(buffer);

        if (isPDFError(pdfResult)) {
          return NextResponse.json(
            { error: pdfResult.error, code: pdfResult.code, step: "pdf_parse" },
            { status: 422 }
          );
        }
        resumeText = pdfResult.text;
      } else if (rawText) {
        resumeText = rawText;
      }
    } else {
      const json = await request.json();
      resumeText = json.resumeText || "";
      targetRole = json.targetRole || "";
      githubUsername = json.githubUsername || "";
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "No valid resume text or PDF provided (minimum 50 characters required)." },
        { status: 400 }
      );
    }

    if (!targetRole || targetRole.trim().length === 0) {
      targetRole = "Backend Engineer";
    }

    // Check pipeline cache
    const cacheKey = {
      text: resumeText,
      targetRole: targetRole.toLowerCase(),
      githubUsername: githubUsername.toLowerCase(),
    };

    const cached = pipelineCache.get(cacheKey) as PipelineResult | null;
    if (cached) {
      console.log("[Pipeline] Returning cached pipeline result");
      return NextResponse.json(cached);
    }

    // ============================================================
    // STEP 2: Exhaustive Hybrid Extraction (Regex + DeepSeek LLM)
    // ============================================================
    console.log("[Pipeline] Step 2: Extracting comprehensive structured resume data...");
    const extraction = await extractFullResume(resumeText);

    // ============================================================
    // STEP 3: Parallel — GitHub verification + Role retrieval
    // ============================================================
    console.log("[Pipeline] Step 3: GitHub verification & Role retrieval...");
    const claimedSkillNames = extraction.skills.map((s) => s.name);

    // Auto-detect GitHub username from resume if not provided manually
    const effectiveGithubUsername = (
      githubUsername.trim() ||
      extraction.contactInfo?.githubUsername ||
      ""
    ).replace(/^@/, "").trim();

    const [githubVerification, roleProfile] = await Promise.all([
      effectiveGithubUsername.length > 0
        ? verifyGitHub(effectiveGithubUsername, claimedSkillNames)
        : Promise.resolve(undefined),
      getRoleProfile(targetRole),
    ]);

    // ============================================================
    // STEP 4: Gap Analysis via LLM (Prompt 2)
    // ============================================================
    console.log("[Pipeline] Step 4: Analyzing skill gaps...");
    const gapAnalysis = await callLLM<GapAnalysis>(
      {
        systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
        userPrompt: buildGapAnalysisUserPrompt(
          extraction,
          roleProfile,
          githubVerification
        ),
        temperature: 0.3,
      },
      GapAnalysisSchema
    );

    // ============================================================
    // STEP 5: Project Generator via LLM (Prompt 3)
    // ============================================================
    console.log("[Pipeline] Step 5: Generating targeted portfolio projects...");
    const missingSkills = gapAnalysis.tiers.missing.map((s) => ({
      skill: s.skill,
      weight: s.weight,
    }));

    let projectSuggestions: z.infer<typeof ProjectSuggestionSchema>[] = [];
    if (missingSkills.length > 0) {
      try {
        const raw = await callLLMRaw({
          systemPrompt: PROJECT_GENERATOR_SYSTEM_PROMPT,
          userPrompt: buildProjectGeneratorUserPrompt(missingSkills, roleProfile),
          temperature: 0.5,
        });
        const parsed = ProjectsOutputSchema.safeParse(raw);
        projectSuggestions = parsed.success ? parsed.data.projects : [];
      } catch (e) {
        console.warn("Project generator non-fatal warning:", (e as Error).message);
      }
    }

    // ============================================================
    // STEP 6: Agentic Resource Finder (Vercel AI SDK + Tavily)
    // ============================================================
    console.log("[Pipeline] Step 6: Fetching verified learning resources...");
    const skillGapsForResources = [
      ...gapAnalysis.tiers.missing.map((s) => ({
        skill: s.skill,
        severity: "missing" as const,
      })),
      ...gapAnalysis.tiers.partial.map((s) => ({
        skill: s.skill,
        severity: "partial" as const,
      })),
    ];

    let resources: AgenticResource[] = [];
    try {
      resources = await findResources(skillGapsForResources);
    } catch (e) {
      console.warn("Resource finder non-fatal warning:", (e as Error).message);
    }

    // ============================================================
    // STEP 7: Assemble final result & cache
    // ============================================================
    console.log("[Pipeline] Pipeline execution finished successfully!");
    const result: PipelineResult = {
      resumeExtraction: extraction,
      roleProfile,
      githubVerification,
      gapAnalysis,
      projectSuggestions,
      resources,
    };

    pipelineCache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Pipeline] Pipeline Execution Error:", err);
    return NextResponse.json(
      {
        error: "Pipeline execution failed.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Role profile retriever hook.
 */
async function getRoleProfile(targetRole: string): Promise<RoleProfile> {
  const {
    MOCK_BACKEND_ENGINEER,
    MOCK_SECURITY_ENGINEER,
    MOCK_BLOCKCHAIN_DEVELOPER,
  } = await import("@/lib/mock-data/mock-role-profile");

  const lower = targetRole.toLowerCase();
  if (
    lower.includes("security") ||
    lower.includes("pentest") ||
    lower.includes("cyber") ||
    lower.includes("appsec")
  ) {
    return { ...MOCK_SECURITY_ENGINEER, roleName: targetRole };
  }

  if (
    lower.includes("blockchain") ||
    lower.includes("solidity") ||
    lower.includes("web3") ||
    lower.includes("smart contract") ||
    lower.includes("crypto")
  ) {
    return { ...MOCK_BLOCKCHAIN_DEVELOPER, roleName: targetRole };
  }

  return { ...MOCK_BACKEND_ENGINEER, roleName: targetRole };
}
