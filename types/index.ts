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
// ROLE PROFILE (provided by RAG matcher)
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
// GITHUB VERIFICATION (Layer 3)
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
// AGENTIC RESOURCES (Layer: Vercel AI SDK + Tavily)
// ============================================================

export const AgenticResourceSchema = z.object({
  skill: z.string(),
  severity: z.enum(["missing", "partial"]),
  resources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      description: z.string(),
      type: z.enum(["course", "tutorial", "docs", "video"]),
      verified: z.boolean(),
      source: z.enum(["web_search", "ai_suggested"]),
    })
  ),
});

export type AgenticResource = z.infer<typeof AgenticResourceSchema>;

// ============================================================
// FULL PIPELINE RESULT
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

// ============================================================
// ON-CHAIN CREDENTIAL ATTESTATION (Stretch Feature)
// ============================================================

export interface OnChainCredential {
  candidateName: string;
  roleName: string;
  skillName: string;
  projectTitle: string;
  attestationHash: string;
  txHash: string;
  blockNumber: number;
  network: string;
  issuedAt: string;
}
