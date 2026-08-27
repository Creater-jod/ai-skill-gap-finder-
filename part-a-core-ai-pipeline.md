# 🅰️ Part A: Core AI Pipeline (Build Independently)

> **What this covers:** Foundation + PDF Parsing + All 3 LLM Prompts (Extraction, Gap Analysis, Project Generator)  
> **Time estimate:** ~2 hours  
> **Join point:** Part B imports types and OpenRouter client from this part  
> **Can test independently:** Yes — use mock role profile data and skip GitHub verification

---

## Step 0: Prerequisites

```bash
# You must have these before starting:
# 1. Node.js 18+ installed
# 2. OpenRouter API key (from openrouter.ai)
# 3. A Next.js project scaffolded (if not, run the scaffold step below)
```

### If Next.js is NOT yet scaffolded:
```bash
cd "c:\Users\NIKIL\Documents\HACKTHON\ai gap finder for resume"
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### Install Part A dependencies:
```bash
cd "c:\Users\NIKIL\Documents\HACKTHON\ai gap finder for resume"
npm install pdf-parse zod openai
npm install -D @types/pdf-parse
```

### Create `.env.local` in the project root:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## Step 1: TypeScript Types & Zod Schemas

> **File:** `src/types/index.ts`  
> **Purpose:** ALL shared types for the entire project. Part B also imports from here.

```typescript
import { z } from "zod";

// ============================================================
// RESUME EXTRACTION (Prompt 1 output)
// ============================================================

export const SkillSchema = z.object({
  name: z.string().describe("Skill name, e.g. 'Python', 'Docker', 'React'"),
  context: z
    .string()
    .optional()
    .describe("Where in the resume this skill was mentioned"),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
});

export const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  duration: z.string(),
  highlights: z.array(z.string()),
});

export const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string().optional(),
});

export const ResumeExtractionSchema = z.object({
  skills: z.array(SkillSchema),
  projects: z.array(ProjectSchema),
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  summary: z.string().optional(),
});

export type ResumeExtraction = z.infer<typeof ResumeExtractionSchema>;

// ============================================================
// ROLE PROFILE (provided by RAG teammate)
// ============================================================

export const RoleSkillSchema = z.object({
  skill: z.string(),
  weight: z.number().min(0).max(1).describe("Importance: 0=nice-to-have, 1=critical"),
  category: z.string().describe("e.g. 'programming', 'devops', 'security', 'soft-skills'"),
});

export const RoleProfileSchema = z.object({
  roleName: z.string(),
  matchConfidence: z.number().min(0).max(1),
  isAIGenerated: z.boolean(),
  requiredSkills: z.array(RoleSkillSchema),
  niceToHaveSkills: z.array(z.string()),
  description: z.string(),
});

export type RoleProfile = z.infer<typeof RoleProfileSchema>;

// ============================================================
// GITHUB VERIFICATION (Part B builds this)
// ============================================================

export const GitHubVerificationSchema = z.object({
  username: z.string(),
  profileExists: z.boolean(),
  repoCount: z.number(),
  totalCommits: z.number(),
  topLanguages: z.record(z.string(), z.number()),
  verified: z.array(z.string()).describe("Skills confirmed by real repos"),
  unverified: z.array(z.string()).describe("Skills claimed but no repo evidence"),
  stale: z.array(z.string()).describe("Skills with repos but no recent activity (>6 months)"),
  unclaimed: z.array(z.string()).describe("Languages in repos NOT claimed on resume"),
});

export type GitHubVerification = z.infer<typeof GitHubVerificationSchema>;

// ============================================================
// GAP ANALYSIS (Prompt 2 output)
// ============================================================

export const TieredSkillSchema = z.object({
  skill: z.string(),
  tier: z.enum(["demonstrated", "partial", "missing", "differentiator"]),
  evidence: z.string().describe("Why this tier was assigned"),
  weight: z.number().min(0).max(1),
});

export const GapAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  tiers: z.object({
    demonstrated: z.array(TieredSkillSchema),
    partial: z.array(TieredSkillSchema),
    missing: z.array(TieredSkillSchema),
    differentiators: z.array(TieredSkillSchema),
  }),
  explanation: z.string(),
  verificationNotes: z.array(z.string()),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ============================================================
// PROJECT SUGGESTIONS (Prompt 3 output)
// ============================================================

export const ProjectSuggestionSchema = z.object({
  skillGap: z.string(),
  projectTitle: z.string(),
  description: z.string(),
  techStack: z.array(z.string()),
  estimatedHours: z.number(),
  learningOutcomes: z.array(z.string()),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export type ProjectSuggestion = z.infer<typeof ProjectSuggestionSchema>;

// ============================================================
// AGENTIC RESOURCES (Part B builds this)
// ============================================================

export const AgenticResourceSchema = z.object({
  skill: z.string(),
  severity: z.enum(["missing", "partial"]),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      description: z.string(),
      type: z.enum(["course", "tutorial", "docs", "video"]),
      verified: z.boolean(),
      source: z.enum(["web_search", "ai_suggested"]),
    })
  ),
});

export type AgenticResource = z.infer<typeof AgenticResourceSchema>;

// ============================================================
// FULL PIPELINE RESULT (Part B assembles this)
// ============================================================

export const PipelineResultSchema = z.object({
  resumeExtraction: ResumeExtractionSchema,
  roleProfile: RoleProfileSchema,
  githubVerification: GitHubVerificationSchema.optional(),
  gapAnalysis: GapAnalysisSchema,
  projectSuggestions: z.array(ProjectSuggestionSchema),
  resources: z.array(AgenticResourceSchema),
});

export type PipelineResult = z.infer<typeof PipelineResultSchema>;
```

---

## Step 2: OpenRouter Client Wrapper

> **File:** `src/lib/openrouter.ts`  
> **Purpose:** Reusable LLM caller with Zod validation and retry logic. Both Part A and Part B use this.

```typescript
import OpenAI from "openai";
import { z, ZodSchema } from "zod";

// OpenRouter is OpenAI-compatible — use the openai SDK with a different base URL
export function getOpenAIClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy-build-key",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Skill Gap Finder",
    },
  });
}

export const MODEL = "deepseek/deepseek-chat-v3-0324:free";
const MAX_RETRIES = 2;

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

/**
 * Call the LLM and parse the response as JSON.
 * No schema validation — returns raw parsed JSON.
 */
export async function callLLMRaw(options: LLMCallOptions): Promise<unknown> {
  const { systemPrompt, userPrompt, temperature = 0.3 } = options;
  const client = getOpenAIClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }

      const parsed = JSON.parse(cleanContent.trim());
      return parsed;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `LLM call attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        (error as Error).message
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `LLM call failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Call the LLM, parse JSON, and validate against a Zod schema.
 * Retries on validation failure.
 */
export async function callLLM<T>(
  options: LLMCallOptions,
  schema: ZodSchema<T>
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callLLMRaw(options);

      const validated = schema.parse(raw);
      return validated;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof z.ZodError) {
        console.error(
          `Schema validation failed (attempt ${attempt + 1}):`,
          error.issues
        );
      } else {
        console.error(
          `LLM call failed (attempt ${attempt + 1}):`,
          (error as Error).message
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `LLM call with validation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}
```

---

## Step 3: PDF Parser Utility

> **File:** `src/lib/pdf-parser.ts`  
> **Purpose:** Extract text from a PDF buffer. Cleans the output for LLM consumption.

```typescript
import { PDFParse } from "pdf-parse";

export interface PDFParseResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export interface PDFParseError {
  error: string;
  code: "INVALID_FILE" | "PARSE_ERROR" | "EMPTY_PDF" | "FILE_TOO_LARGE";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function parsePDF(
  buffer: Buffer
): Promise<PDFParseResult | PDFParseError> {
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      error: "File size exceeds 5MB limit. Please upload a smaller PDF.",
      code: "FILE_TOO_LARGE",
    };
  }

  const header = buffer.subarray(0, 5).toString("ascii");
  if (!header.startsWith("%PDF")) {
    return {
      error: "File does not appear to be a valid PDF.",
      code: "INVALID_FILE",
    };
  }

  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    await parser.destroy();

    const text = cleanText(textResult.text || "");

    if (!text || text.trim().length < 50) {
      return {
        error:
          "PDF appears to be empty or contains too little text. It may be a scanned image — please use a text-based PDF.",
        code: "EMPTY_PDF",
      };
    }

    const wordCount = text
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length;

    return {
      text,
      pageCount: textResult.total || 1,
      wordCount,
    };
  } catch (err) {
    console.error("PDF parse error:", err);
    return {
      error: "Failed to parse PDF. The file may be corrupted or password-protected.",
      code: "PARSE_ERROR",
    };
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function isPDFError(
  result: PDFParseResult | PDFParseError
): result is PDFParseError {
  return "error" in result;
}
```

---

## Step 4: Upload API Route

> **File:** `src/app/api/upload/route.ts`  
> **Purpose:** `POST /api/upload` — accepts a PDF file, returns extracted text.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { parsePDF, isPDFError } from "@/lib/pdf-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a PDF file." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await parsePDF(buffer);

    if (isPDFError(result)) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: result.text,
      pageCount: result.pageCount,
      wordCount: result.wordCount,
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Internal server error during file upload.", details: (err as Error).message },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Extraction Prompt (Prompt 1)

> **File:** `src/lib/prompts/extraction-prompt.ts`  
> **Purpose:** System + user prompt for structured resume extraction.

```typescript
export const EXTRACTION_SYSTEM_PROMPT = `You are an expert resume analyst. Your job is to extract structured data from resume text.

CRITICAL RULES:
1. ONLY extract information that is EXPLICITLY stated in the resume text.
2. DO NOT invent, assume, or hallucinate any skills, projects, or experience.
3. If something is ambiguous, include it with a note in the context field.
4. Extract ALL skills mentioned, including those in project descriptions, tool lists, and job highlights.
5. For projects, extract the technologies used from the description even if not listed separately.

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "skills": [
    { "name": "Python", "context": "Used in 3 projects and listed under technical skills" }
  ],
  "projects": [
    { "name": "Project Name", "description": "What it does", "technologies": ["Python", "Flask"] }
  ],
  "experience": [
    { "title": "Job Title", "company": "Company Name", "duration": "Jun 2023 - Present", "highlights": ["Built X", "Improved Y by Z%"] }
  ],
  "education": [
    { "degree": "B.Tech Computer Science", "institution": "University Name", "year": "2024" }
  ],
  "summary": "One-line summary of the candidate's profile"
}`;

export function buildExtractionUserPrompt(resumeText: string): string {
  return `Extract structured data from this resume. Remember: ONLY extract what is explicitly written. Do not invent anything.

--- RESUME TEXT START ---
${resumeText}
--- RESUME TEXT END ---

Return the JSON object now.`;
}
```

---

## Step 6: Extract API Route

> **File:** `src/app/api/extract/route.ts`  
> **Purpose:** `POST /api/extract` — takes resume text, returns structured extraction via LLM.

```typescript
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

    const truncatedText = resumeText.slice(0, 15000);

    const extraction = await callLLM<ResumeExtraction>(
      {
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        userPrompt: buildExtractionUserPrompt(truncatedText),
        temperature: 0.2,
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
```

---

## Step 7: Gap Analysis Prompt (Prompt 2)

> **File:** `src/lib/prompts/gap-analysis-prompt.ts`  
> **Purpose:** System + user prompt for tiered gap analysis.

```typescript
export const GAP_ANALYSIS_SYSTEM_PROMPT = `You are an expert technical career gap analyst. Your job is to compare a candidate's demonstrated skills against a target role's requirements and produce a tiered gap analysis.

TIER DEFINITIONS — apply these EXACTLY:
- "demonstrated": Skill found in resume AND verified by GitHub (if GitHub data provided). If no GitHub data, skill must appear in a project or job experience with concrete evidence.
- "partial": Skill mentioned on resume but lacks strong evidence (just listed, no project/experience showing it). OR skill is in resume but GitHub shows no matching repos.
- "missing": Skill required by the role but NOT found anywhere in the resume.
- "differentiator": Skill the candidate has that goes BEYOND the role requirements — a competitive advantage.

SCORING RULES:
- Score is 0-100 based on weighted skill coverage
- Each required skill has a weight (0-1). Weighted score calculation:
  Sum of (matched skill weight * tier multiplier) / sum of all weights * 100
- Tier multipliers: demonstrated = 1.0, partial = 0.5, missing = 0.0, differentiator = bonus
- Show your calculation clearly in the explanation field

CRITICAL RULES:
1. ONLY classify skills that appear in the provided role profile. Do NOT invent requirements.
2. Every tier assignment MUST have evidence cited from the resume or GitHub data.
3. If GitHub data is not provided, note "GitHub verification not available" and tier based on resume evidence alone.
4. Be strict — a skill merely listed with no context is "partial", not "demonstrated".

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "score": 72,
  "tiers": {
    "demonstrated": [{ "skill": "Python", "tier": "demonstrated", "evidence": "Used in 3 projects + 45 GitHub repos", "weight": 0.9 }],
    "partial": [{ "skill": "Docker", "tier": "partial", "evidence": "Listed in skills but no project uses it", "weight": 0.7 }],
    "missing": [{ "skill": "Kubernetes", "tier": "missing", "evidence": "Not mentioned anywhere in resume", "weight": 0.6 }],
    "differentiators": [{ "skill": "Rust", "tier": "differentiator", "evidence": "Has 5 Rust projects — beyond role requirements", "weight": 0.0 }]
  },
  "explanation": "Score calculation: (Python 0.9*1.0 + Docker 0.7*0.5) / 2.2 total weight * 100 = 72%",
  "verificationNotes": ["GitHub verified: Python confirmed with 45 repos", "Docker: listed on resume but 0 GitHub repos"]
}`;

export function buildGapAnalysisUserPrompt(
  extraction: unknown,
  roleProfile: unknown,
  githubVerification?: unknown
): string {
  let prompt = `Analyze the gap between this candidate and the target role.

--- CANDIDATE'S EXTRACTED RESUME DATA ---
${JSON.stringify(extraction, null, 2)}

--- TARGET ROLE PROFILE ---
${JSON.stringify(roleProfile, null, 2)}
`;

  if (githubVerification) {
    prompt += `
--- GITHUB VERIFICATION DATA ---
${JSON.stringify(githubVerification, null, 2)}
`;
  } else {
    prompt += `
--- GITHUB VERIFICATION DATA ---
Not provided. Tier based on resume evidence alone. Note this in verificationNotes.
`;
  }

  prompt += `\nReturn the gap analysis JSON now.`;
  return prompt;
}
```

---

## Step 8: Analyze API Route

> **File:** `src/app/api/analyze/route.ts`  
> **Purpose:** `POST /api/analyze` — takes extraction + role profile + optional GitHub data, returns gap analysis.

```typescript
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
    const { extraction, roleProfile, githubVerification } = body;

    if (!extraction || !roleProfile) {
      return NextResponse.json(
        { error: "Missing required fields: 'extraction' and 'roleProfile'." },
        { status: 400 }
      );
    }

    const extractionResult = ResumeExtractionSchema.safeParse(extraction);
    if (!extractionResult.success) {
      return NextResponse.json(
        { error: "Invalid extraction data.", details: extractionResult.error.issues },
        { status: 400 }
      );
    }

    const roleResult = RoleProfileSchema.safeParse(roleProfile);
    if (!roleResult.success) {
      return NextResponse.json(
        { error: "Invalid role profile data.", details: roleResult.error.issues },
        { status: 400 }
      );
    }

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
          validatedGithub
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
```

---

## Step 9: Project Generator Prompt (Prompt 3)

> **File:** `src/lib/prompts/project-generator-prompt.ts`  
> **Purpose:** System + user prompt for generating one buildable project per skill gap.

```typescript
export const PROJECT_GENERATOR_SYSTEM_PROMPT = `You are a senior tech mentor. For each missing skill gap, generate ONE specific, buildable project that a candidate can complete to demonstrate that skill on their resume and GitHub.

PROJECT REQUIREMENTS:
1. Each project must be completable in 1-2 weeks by a motivated student or early-career developer.
2. The project must produce a GitHub-demonstrable artifact (working code, not just notes or tutorials).
3. The project must directly teach the missing skill in a way relevant to the target role.
4. Include a realistic, modern tech stack — concise and focused.
5. Learning outcomes must be specific and verifiable (e.g. "Write multi-stage Dockerfiles for Node.js services", not generic "learn Docker").
6. Assign difficulty: beginner (no prior knowledge), intermediate (some familiarity), advanced (builds on existing skill).

OUTPUT FORMAT: Return a JSON object with this exact structure:
{
  "projects": [
    {
      "skillGap": "Docker",
      "projectTitle": "Containerized Microservices Chat App",
      "description": "Build a real-time chat application with separate services for auth, messaging, and notifications. Containerize each service with Docker, orchestrate with Docker Compose, and deploy to a free cloud provider.",
      "techStack": ["Node.js", "Docker", "Docker Compose", "Redis", "WebSocket"],
      "estimatedHours": 20,
      "learningOutcomes": [
        "Write multi-stage Dockerfiles for Node.js services",
        "Configure Docker Compose for multi-service orchestration",
        "Manage environment variables and secrets in containers",
        "Set up health checks and restart policies"
      ],
      "difficulty": "intermediate"
    }
  ]
}`;

export function buildProjectGeneratorUserPrompt(
  missingSkills: { skill: string; weight: number }[],
  roleProfile: unknown
): string {
  return `Generate one buildable project for each of these missing skill gaps. The candidate is targeting the role described below.

--- MISSING SKILL GAPS ---
${JSON.stringify(missingSkills, null, 2)}

--- TARGET ROLE PROFILE ---
${JSON.stringify(roleProfile, null, 2)}

Generate the projects JSON now. Return one project per missing skill.`;
}
```

---

## Step 10: Generate Projects API Route

> **File:** `src/app/api/generate-projects/route.ts`  
> **Purpose:** `POST /api/generate-projects` — takes missing skills + role profile, returns project ideas.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { callLLMRaw } from "@/lib/openrouter";
import { ProjectSuggestionSchema } from "@/types";
import { z } from "zod";
import {
  PROJECT_GENERATOR_SYSTEM_PROMPT,
  buildProjectGeneratorUserPrompt,
} from "@/lib/prompts/project-generator-prompt";

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
```

---

## Step 11: Mock Role Profile for Testing

> **File:** `src/lib/mock-data/mock-role-profile.ts`

```typescript
import { RoleProfile } from "@/types";

export const MOCK_BACKEND_ENGINEER: RoleProfile = {
  roleName: "Backend Engineer",
  matchConfidence: 0.95,
  isAIGenerated: false,
  description:
    "Mid-level backend engineer building scalable APIs, microservices, and data pipelines.",
  requiredSkills: [
    { skill: "Python", weight: 0.9, category: "programming" },
    { skill: "Node.js", weight: 0.8, category: "programming" },
    { skill: "SQL / PostgreSQL", weight: 0.85, category: "database" },
    { skill: "REST API Design", weight: 0.9, category: "architecture" },
    { skill: "Docker", weight: 0.7, category: "devops" },
    { skill: "Git", weight: 0.6, category: "tools" },
    { skill: "CI/CD", weight: 0.5, category: "devops" },
    { skill: "Testing / TDD", weight: 0.7, category: "engineering" },
    { skill: "System Design", weight: 0.6, category: "architecture" },
    { skill: "Cloud (AWS/GCP)", weight: 0.65, category: "infrastructure" },
  ],
  niceToHaveSkills: ["GraphQL", "Redis", "Kubernetes", "TypeScript", "Message Queues"],
};
```
