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
import { matchRoleProfile } from "@/lib/role-matcher";
import { validateEvidenceQuotes } from "@/lib/hallucination-killer";
import { pipelineCache } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Up to 60s execution duration on Vercel

const ProjectsOutputSchema = z.object({
  projects: z.array(ProjectSuggestionSchema),
});

export async function POST(request: NextRequest) {
  try {
    let resumeText = "";
    let targetRole = "";
    let company = "";
    let githubUsername = "";
    let experienceLevel = "Early Career (1-3 yrs)";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      targetRole = (formData.get("targetRole") as string) || "";
      company = (formData.get("company") as string) || "";
      githubUsername = (formData.get("githubUsername") as string) || "";
      experienceLevel = (formData.get("experienceLevel") as string) || "Early Career (1-3 yrs)";
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
      company = json.company || "";
      githubUsername = json.githubUsername || "";
      experienceLevel = json.experienceLevel || "Early Career (1-3 yrs)";
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
      company: company.toLowerCase(),
      githubUsername: githubUsername.toLowerCase(),
      experienceLevel: experienceLevel.toLowerCase(),
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
    // STEP 3: Parallel — GitHub verification + Role retrieval + FAANG Matcher
    // ============================================================
    console.log("[Pipeline] Step 3: GitHub verification, Role retrieval & FAANG RAG matching...");
    const claimedSkillNames = extraction.skills.map((s) => s.name);

    // Auto-detect GitHub username from resume if not provided manually
    const effectiveGithubUsername = (
      githubUsername.trim() ||
      extraction.contactInfo?.githubUsername ||
      ""
    ).replace(/^@/, "").trim();

    const [githubVerification, roleProfile, faangMatch] = await Promise.all([
      effectiveGithubUsername.length > 0
        ? verifyGitHub(effectiveGithubUsername, claimedSkillNames)
        : Promise.resolve(undefined),
      matchRoleProfile(targetRole, company),
      company && company.trim().length > 0
        ? import("@/lib/faang/faang-matcher").then((m) =>
            m.matchFaangPosition(resumeText, company, targetRole, experienceLevel)
          )
        : Promise.resolve(null),
    ]);

    // ============================================================
    // STEP 4: Gap Analysis via LLM (Prompt 2) + Hallucination Killer (Layer 6)
    // ============================================================
    console.log("[Pipeline] Step 4: Analyzing skill gaps...");
    const rawGapAnalysis = await callLLM<GapAnalysis>(
      {
        systemPrompt: GAP_ANALYSIS_SYSTEM_PROMPT,
        userPrompt: buildGapAnalysisUserPrompt(
          extraction,
          roleProfile,
          githubVerification,
          company,
          experienceLevel
        ),
        temperature: 0.3,
      },
      GapAnalysisSchema
    );

    // Deterministic post-processing: Kill / flag evidence quote hallucinations
    const { gapAnalysis, killedCount } = validateEvidenceQuotes(
      rawGapAnalysis,
      resumeText
    );
    console.log(
      `[Pipeline] Layer 6 Hallucination Killer complete: verified evidence quotes (${killedCount} ungrounded claims flagged).`
    );

    // ============================================================
    // STEP 5: Project Generator via LLM (Prompt 3) & Curated FAANG Builds
    // ============================================================
    console.log("[Pipeline] Step 5: Generating targeted portfolio projects...");
    let projectSuggestions: z.infer<typeof ProjectSuggestionSchema>[] = [];

    // If FAANG curated gaps exist, seed high-fidelity remediation projects
    if (faangMatch && faangMatch.top_gaps.length > 0) {
      const curatedProjects = faangMatch.top_gaps.map((g) => ({
        skillGap: g.title,
        projectTitle: g.remediation.project,
        description: `Targeted remediation benchmark for ${faangMatch.company} ${faangMatch.role}: ${g.reason}`,
        techStack: [g.category, g.title],
        estimatedHours: g.importance === "Critical" ? 24 : 16,
        learningOutcomes: [
          g.remediation.action_step,
          ...g.remediation.courses.slice(0, 2),
        ],
        difficulty: g.importance === "Critical" ? ("advanced" as const) : ("intermediate" as const),
      }));
      projectSuggestions.push(...curatedProjects);
    }

    const missingSkills = gapAnalysis.tiers.missing.map((s) => ({
      skill: s.skill,
      weight: s.weight,
    }));

    if (projectSuggestions.length === 0 && missingSkills.length > 0) {
      try {
        const raw = await callLLMRaw({
          systemPrompt: PROJECT_GENERATOR_SYSTEM_PROMPT,
          userPrompt: buildProjectGeneratorUserPrompt(missingSkills, roleProfile),
          temperature: 0.5,
        });
        const parsed = ProjectsOutputSchema.safeParse(raw);
        if (parsed.success) {
          projectSuggestions = parsed.data.projects;
        }
      } catch (e) {
        console.warn("Project generator non-fatal warning:", (e as Error).message);
      }
    }

    // ============================================================
    // STEP 6: Agentic Resource Finder (Vercel AI SDK + Tavily) & Curated FAANG
    // ============================================================
    console.log("[Pipeline] Step 6: Fetching verified learning resources...");
    let resources: AgenticResource[] = [];

    if (faangMatch && faangMatch.top_gaps.length > 0) {
      resources = faangMatch.top_gaps.map((g) => ({
        skill: g.title,
        severity: g.importance === "Critical" ? ("missing" as const) : ("partial" as const),
        resources: g.remediation.courses.map((c) => ({
          title: c,
          url: `https://www.google.com/search?q=${encodeURIComponent(c)}`,
          description: `Curated standard course for ${faangMatch.company} — ${g.title}`,
          type: "course" as const,
          verified: true,
          source: "ai_suggested" as const,
        })),
      }));
    }

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

    if (resources.length === 0 && skillGapsForResources.length > 0) {
      try {
        resources = await findResources(skillGapsForResources);
      } catch (e) {
        console.warn("Resource finder non-fatal warning:", (e as Error).message);
      }
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
      faangMatch: faangMatch || undefined,
      experienceLevel,
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
