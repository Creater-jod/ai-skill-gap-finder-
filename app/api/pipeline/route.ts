import { NextRequest, NextResponse } from "next/server";
import { parsePDF, isPDFError } from "@/lib/pdf-parser";
import { callLLM } from "@/lib/openrouter";
import { extractMetadataRegex } from "@/lib/resume-extractor";
import { analyzeDocumentLayout } from "@/lib/smart-resume/section-detector";
import {
  ResumeExtractionSchema,
  ResumeExtraction,
  GapAnalysisSchema,
  GapAnalysis,
  ProjectSuggestionSchema,
  ProjectSuggestion,
  VerificationQuestionSchema,
  VerificationQuestion,
  PipelineResult,
  AgenticResource,
  ContactInfo,
} from "@/types";
import {
  UNIFIED_PIPELINE_SYSTEM_PROMPT,
  buildUnifiedPipelineUserPrompt,
} from "@/lib/prompts/unified-pipeline-prompt";
import { verifyGitHub } from "@/lib/github-verifier";
import { findResources } from "@/lib/resource-agent";
import { matchRoleProfile } from "@/lib/role-matcher";
import { validateEvidenceQuotes } from "@/lib/hallucination-killer";
import { pipelineCache } from "@/lib/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution duration on Vercel

const UnifiedOutputSchema = z.object({
  extraction: ResumeExtractionSchema,
  gapAnalysis: GapAnalysisSchema,
  projectSuggestions: z.array(ProjectSuggestionSchema).default([]),
  verificationQuestions: z.array(VerificationQuestionSchema).default([]),
});

type UnifiedOutput = z.infer<typeof UnifiedOutputSchema>;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
    // STEP 1: Fast Layout Indexing & Deterministic Extraction (<1ms)
    // ============================================================
    const layout = analyzeDocumentLayout(resumeText);
    const regexMetadata = extractMetadataRegex(resumeText);

    const effectiveGithubUsername = (
      githubUsername.trim() ||
      regexMetadata.githubUsername ||
      (regexMetadata.githubUrl ? regexMetadata.githubUrl.split("/").pop() : "") ||
      ""
    ).replace(/^@/, "").trim();

    // ============================================================
    // STEP 2: Parallel Pre-Fetch (Role Benchmark + GitHub + FAANG Match)
    // ============================================================
    console.log("[Pipeline] Step 2: Parallel pre-fetching Role Profile, GitHub, and FAANG Match...");
    const [roleProfile, githubVerification, faangMatch] = await Promise.all([
      matchRoleProfile(targetRole, company),
      effectiveGithubUsername.length > 0
        ? verifyGitHub(effectiveGithubUsername, [targetRole, "Python", "TypeScript", "JavaScript", "Docker", "SQL", "Git"])
        : Promise.resolve(undefined),
      company && company.trim().length > 0
        ? import("@/lib/faang/faang-matcher").then((m) =>
            m.matchFaangPosition(resumeText, company, targetRole, experienceLevel)
          )
        : Promise.resolve(null),
    ]);

    // ============================================================
    // STEP 3: Unified Single-Pass AI Diagnostic Inference (~3-5s)
    // Runs extraction, tiered gap analysis, and remediation projects in 1 LLM call!
    // ============================================================
    console.log("[Pipeline] Step 3: Executing high-speed unified AI Diagnostic Inference...");
    const userPrompt = buildUnifiedPipelineUserPrompt(
      layout.indexedFullText,
      roleProfile,
      githubVerification,
      company,
      experienceLevel
    );

    const unifiedResult = await callLLM<UnifiedOutput>(
      {
        systemPrompt: UNIFIED_PIPELINE_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.2,
      },
      UnifiedOutputSchema
    );

    // ============================================================
    // STEP 4: Merge Contact Info & Clean Extraction
    // ============================================================
    const mergedContact: ContactInfo = {
      ...unifiedResult.extraction?.contactInfo,
      email: unifiedResult.extraction?.contactInfo?.email || regexMetadata.email,
      githubUrl: unifiedResult.extraction?.contactInfo?.githubUrl || regexMetadata.githubUrl,
      githubUsername:
        unifiedResult.extraction?.contactInfo?.githubUsername ||
        effectiveGithubUsername ||
        regexMetadata.githubUsername,
      linkedinUrl: unifiedResult.extraction?.contactInfo?.linkedinUrl || regexMetadata.linkedinUrl,
      phone: unifiedResult.extraction?.contactInfo?.phone || regexMetadata.phone,
      portfolioUrl: unifiedResult.extraction?.contactInfo?.portfolioUrl || regexMetadata.portfolioUrl,
    };

    function ensureArray<T>(val: T[] | T | null | undefined): T[] {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return [val];
    }

    const finalExtraction: ResumeExtraction = {
      ...unifiedResult.extraction,
      skills: ensureArray(unifiedResult.extraction?.skills),
      experience: ensureArray(unifiedResult.extraction?.experience),
      projects: ensureArray(unifiedResult.extraction?.projects),
      education: ensureArray(unifiedResult.extraction?.education),
      certifications: ensureArray(unifiedResult.extraction?.certifications),
      awards: ensureArray(unifiedResult.extraction?.awards),
      contactInfo: mergedContact,
    };

    // ============================================================
    // STEP 5: Layer 6 Anti-Hallucination Evidence Verification
    // ============================================================
    const { gapAnalysis, killedCount } = validateEvidenceQuotes(
      unifiedResult.gapAnalysis,
      resumeText
    );
    console.log(`[Pipeline] Layer 6 Complete: Verified evidence quotes (${killedCount} ungrounded claims adjusted).`);

    // ============================================================
    // STEP 6: Merge Project Suggestions (AI Generated + FAANG Benchmarks)
    // ============================================================
    let projectSuggestions: ProjectSuggestion[] = ensureArray(unifiedResult.projectSuggestions);

    if (faangMatch && faangMatch.top_gaps.length > 0) {
      const curatedProjects: ProjectSuggestion[] = faangMatch.top_gaps.map((g) => ({
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
      projectSuggestions = [...curatedProjects, ...projectSuggestions];
    }

    // ============================================================
    // STEP 7: Verified Learning Resources
    // ============================================================
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
      ...gapAnalysis.tiers.missing.slice(0, 3).map((s) => ({
        skill: s.skill,
        severity: "missing" as const,
      })),
      ...gapAnalysis.tiers.partial.slice(0, 2).map((s) => ({
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
    // STEP 8: Assemble Result & Cache
    // ============================================================
    const elapsed = Date.now() - startTime;
    console.log(`[Pipeline] Completed successfully in ${elapsed}ms!`);

    const result: PipelineResult = {
      resumeExtraction: finalExtraction,
      roleProfile,
      githubVerification,
      gapAnalysis,
      projectSuggestions,
      resources,
      verificationQuestions: ensureArray(unifiedResult.verificationQuestions),
      faangMatch: faangMatch || undefined,
      experienceLevel,
    };

    pipelineCache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    const elapsed = Date.now() - startTime;
    console.error(`[Pipeline] Failed after ${elapsed}ms:`, err);
    return NextResponse.json(
      {
        error: "Pipeline execution failed.",
        details: (err as Error).message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}

