import { z } from "zod";

// ============================================================
// RESUME EXTRACTION (Exhaustive Open-Source Schema)
// ============================================================

export const ContactInfoSchema = z.object({
  fullName: z.string().nullish().describe("Candidate full name"),
  email: z.string().nullish().describe("Email address"),
  phone: z.string().nullish().describe("Phone number"),
  location: z.string().nullish().describe("City, State, Country"),
  githubUrl: z.string().nullish().describe("GitHub profile URL or username"),
  githubUsername: z.string().nullish().describe("Extracted GitHub handle, e.g. 'octocat'"),
  linkedinUrl: z.string().nullish().describe("LinkedIn profile URL"),
  portfolioUrl: z.string().nullish().describe("Personal website or portfolio URL"),
});

export const SkillSchema = z.object({
  name: z.string().default("Skill").describe("Skill name, e.g. 'Python', 'Docker', 'React'"),
  category: z
    .enum([
      "programming_languages",
      "frameworks_and_libraries",
      "databases_and_storage",
      "cloud_and_devops",
      "tools_and_platforms",
      "core_concepts",
      "soft_skills",
      "other",
    ])
    .default("other")
    .describe("Category of the skill"),
  proficiency: z
    .enum(["expert", "proficient", "familiar", "unspecified"])
    .default("unspecified")
    .describe("Demonstrated depth"),
  yearsOfExperience: z.number().nullish().describe("Estimated years based on resume dates"),
  context: z
    .string()
    .nullish()
    .describe("Explicit citation / quote from the resume where this skill was used"),
  lineCitations: z
    .array(z.number())
    .default([])
    .describe("Line numbers from indexed resume where evidence appears"),
  sourceLine: z.string().nullish().describe("Primary source line text"),
});

export const ProjectSchema = z.object({
  name: z.string().default("Project").describe("Project title"),
  description: z.string().default("").describe("Detailed overview of what the project does"),
  role: z.string().nullish().describe("Candidate role/contribution"),
  technologies: z.array(z.string()).default([]).describe("Full tech stack used"),
  repoUrl: z.string().nullish().describe("GitHub repository link if mentioned"),
  liveUrl: z.string().nullish().describe("Live deployment URL if mentioned"),
  metrics: z.array(z.string()).default([]).describe("Measurable outcomes (e.g. '10k users', '40% latency reduction')"),
  highlights: z.array(z.string()).default([]).describe("Key implementation details"),
});

export const ExperienceSchema = z.object({
  title: z.string().default("Role / Position").describe("Job title"),
  company: z.string().default("Organization / Company").describe("Company or organization name"),
  location: z.string().nullish().describe("Location or 'Remote'"),
  duration: z.string().default("").describe("e.g. 'Jun 2023 - Present'"),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  isCurrent: z.boolean().nullish(),
  technologies: z.array(z.string()).default([]).describe("Tools/tech used in this role"),
  highlights: z.array(z.string()).default([]).describe("Bullet points of accomplishments and responsibilities"),
  metrics: z.array(z.string()).default([]).describe("Quantifiable impact achieved"),
});

export const EducationSchema = z.object({
  degree: z.string().default("Degree / Certificate").describe("e.g. 'B.Tech in Computer Science'"),
  fieldOfStudy: z.string().nullish().describe("Major or specialization"),
  institution: z.string().default("Institution / University").describe("University / College name"),
  location: z.string().nullish(),
  year: z.string().nullish().describe("Graduation year or date range"),
  gpa: z.string().nullish().describe("GPA or honors if mentioned"),
  coursework: z.array(z.string()).default([]).describe("Relevant technical courses taken"),
});

export const CertificationSchema = z.object({
  name: z.string().default("Certification").describe("Certification name, e.g. 'AWS Certified Solutions Architect'"),
  issuer: z.string().default("Issuer / Authority").describe("Issuing organization, e.g. 'Amazon Web Services'"),
  date: z.string().nullish().describe("Issue date or expiry"),
  credentialId: z.string().nullish().describe("License / verification ID"),
  url: z.string().nullish().describe("Verification link"),
});

export const AwardSchema = z.object({
  title: z.string().default("Award / Honor").describe("Award or hackathon name"),
  issuer: z.string().nullish().describe("Issuing organization or event"),
  date: z.string().nullish(),
  description: z.string().nullish().describe("Details of the achievement"),
});

export const ResumeExtractionSchema = z.object({
  contactInfo: ContactInfoSchema.nullish(),
  summary: z.string().nullish().describe("Comprehensive professional profile summary"),
  skills: z.array(SkillSchema).default([]).describe("Exhaustive list of all skills found in the resume"),
  experience: z.array(ExperienceSchema).default([]).describe("Full work history with bullet points and stacks"),
  projects: z.array(ProjectSchema).default([]).describe("All personal, academic, and open-source projects"),
  education: z.array(EducationSchema).default([]).describe("All educational credentials"),
  certifications: z.array(CertificationSchema).default([]).describe("Licenses and professional certifications"),
  awards: z.array(AwardSchema).default([]).describe("Hackathons, honors, competitions, publications"),
  totalYearsOfExperience: z.number().nullish().describe("Calculated total years in tech"),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Award = z.infer<typeof AwardSchema>;
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
  tier: z
    .preprocess(
      (v) => {
        const str = String(v || "").toLowerCase().trim();
        if (str.includes("demonstrat")) return "demonstrated";
        if (str.includes("miss")) return "missing";
        if (str.includes("different")) return "differentiator";
        return "partial";
      },
      z.enum(["demonstrated", "partial", "missing", "differentiator"])
    )
    .default("partial"),
  evidence: z.string().default("Evidence extracted from candidate profile"),
  weight: z.coerce.number().default(0.5),
  lineCitations: z.array(z.number()).default([]).describe("Source line index citations"),
  gapType: z.enum(["quick_win", "real_gap"]).default("real_gap").describe("Quick win (resume rewrite) vs Real gap (needs project/learning)"),
  rewriteSuggestion: z.string().nullish().describe("For quick wins, suggested reworded resume bullet point"),
  evidenceVerified: z.boolean().default(true).describe("Whether evidence quote was verified against resume text"),
});

export const GapAnalysisSchema = z.object({
  score: z.coerce.number().default(50),
  tiers: z.object({
    demonstrated: z.array(TieredSkillSchema).default([]),
    partial: z.array(TieredSkillSchema).default([]),
    missing: z.array(TieredSkillSchema).default([]),
    differentiators: z.array(TieredSkillSchema).default([]),
  }),
  explanation: z.string().default("Gap analysis computed against target role profile"),
  verificationNotes: z.array(z.string()).default([]),
});

export type TieredSkill = z.infer<typeof TieredSkillSchema>;
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ============================================================
// PROJECT SUGGESTIONS (Prompt 3 output)
// ============================================================

export const ProjectSuggestionSchema = z.object({
  skillGap: z.string(),
  projectTitle: z.string(),
  description: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  estimatedHours: z.coerce.number().default(16),
  learningOutcomes: z.array(z.string()).default([]),
  difficulty: z
    .preprocess(
      (v) => {
        const str = String(v || "").toLowerCase().trim();
        if (str.includes("advanc")) return "advanced";
        if (str.includes("begin")) return "beginner";
        return "intermediate";
      },
      z.enum(["beginner", "intermediate", "advanced"])
    )
    .default("intermediate"),
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

import type { PositionMatchResult } from "@/lib/faang/types";
export * from "@/lib/faang/types";

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
  faangMatch: z.custom<PositionMatchResult>().optional(),
  experienceLevel: z.string().optional(),
});

export type PipelineResult = z.infer<typeof PipelineResultSchema>;

