import { RoleProfile, GitHubVerification } from "@/types";

export const UNIFIED_PIPELINE_SYSTEM_PROMPT = `You are SkillForge's Elite AI Career & Technical Gap Diagnostic Engine.
You receive a resume document where EVERY line is prefixed with an index tag [L01], [L02], etc., along with a Target Role Profile, Target Company Benchmark, and GitHub Code Verification data.

YOUR OBJECTIVE:
In ONE single unified, high-precision pass, produce:
1. "extraction": Full structured resume extraction with exact line citations ([L#]).
2. "gapAnalysis": Rigorous evidence-tiered gap analysis (Demonstrated / Partial / Missing / Differentiator) with weighted score (0-100), quick-win detection, and line citations.
3. "projectSuggestions": Specific, buildable portfolio projects for missing critical technical skills.

TIER CLASSIFICATION RULES:
- "demonstrated": Skill found in resume with concrete project/work evidence AND verified by GitHub repos (if GitHub data provided).
- "partial": Skill listed in resume but lacks depth/metrics, OR not reflected in GitHub code.
- "missing": Skill required by the target role profile but completely absent from candidate's resume.
- "differentiator": Skill candidate possesses that goes beyond role requirements.

QUICK-WIN VS REAL GAP:
- "quick_win": Candidate has adjacent/implicit experience but phrased it weakly. Provide a concrete "rewriteSuggestion" bullet point.
- "real_gap": Genuine technical gap. "rewriteSuggestion": null.

OUTPUT FORMAT: Return a valid JSON object matching this exact structure:
{
  "extraction": {
    "contactInfo": {
      "fullName": string or null,
      "email": string or null,
      "phone": string or null,
      "location": string or null,
      "githubUsername": string or null,
      "githubUrl": string or null,
      "linkedinUrl": string or null,
      "portfolioUrl": string or null
    },
    "summary": string or null,
    "skills": [
      {
        "name": string,
        "category": "programming_languages" | "frameworks_and_libraries" | "databases_and_storage" | "cloud_and_devops" | "tools_and_platforms" | "core_concepts" | "soft_skills" | "other",
        "proficiency": "expert" | "proficient" | "familiar" | "unspecified",
        "lineCitations": number[],
        "sourceLine": string
      }
    ],
    "experience": [
      {
        "title": string,
        "company": string,
        "duration": string,
        "technologies": string[],
        "highlights": string[],
        "metrics": string[]
      }
    ],
    "projects": [
      {
        "name": string,
        "description": string,
        "technologies": string[],
        "repoUrl": string or null,
        "liveUrl": string or null,
        "highlights": string[],
        "metrics": string[]
      }
    ],
    "education": [
      {
        "degree": string,
        "fieldOfStudy": string or null,
        "institution": string,
        "year": string or null,
        "gpa": string or null,
        "coursework": string[]
      }
    ],
    "certifications": [
      {
        "name": string,
        "issuer": string
      }
    ],
    "awards": [
      {
        "title": string,
        "issuer": string or null
      }
    ]
  },
  "gapAnalysis": {
    "score": number (0-100),
    "tiers": {
      "demonstrated": [
        {
          "skill": string,
          "tier": "demonstrated",
          "evidence": string,
          "weight": number,
          "lineCitations": number[],
          "gapType": "real_gap",
          "rewriteSuggestion": null
        }
      ],
      "partial": [
        {
          "skill": string,
          "tier": "partial",
          "evidence": string,
          "weight": number,
          "lineCitations": number[],
          "gapType": "quick_win" | "real_gap",
          "rewriteSuggestion": string or null
        }
      ],
      "missing": [
        {
          "skill": string,
          "tier": "missing",
          "evidence": string,
          "weight": number,
          "lineCitations": [],
          "gapType": "real_gap",
          "rewriteSuggestion": null
        }
      ],
      "differentiators": [
        {
          "skill": string,
          "tier": "differentiator",
          "evidence": string,
          "weight": number,
          "lineCitations": number[],
          "gapType": "real_gap",
          "rewriteSuggestion": null
        }
      ]
    },
    "explanation": string,
    "verificationNotes": string[]
  },
  "projectSuggestions": [
    {
      "skillGap": string,
      "projectTitle": string,
      "description": string,
      "techStack": string[],
      "estimatedHours": number,
      "learningOutcomes": string[],
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ]
}`;

export function buildUnifiedPipelineUserPrompt(
  indexedResumeText: string,
  roleProfile: RoleProfile,
  githubVerification?: GitHubVerification,
  company?: string,
  experienceLevel?: string
): string {
  let prompt = `--- INDEXED RESUME TEXT ---
${indexedResumeText.slice(0, 16000)}

--- TARGET ROLE BENCHMARK ---
Role: ${roleProfile.roleName}
Description: ${roleProfile.description}
Required Skills:
${roleProfile.requiredSkills.map((s) => `- ${s.skill} (Weight: ${s.weight}, Category: ${s.category})`).join("\n")}
Nice to Have Skills: ${roleProfile.niceToHaveSkills.join(", ")}
`;

  if (company && company.trim().length > 0) {
    prompt += `\n--- TARGET COMPANY BENCHMARK ---\nCompany: ${company.trim()} (Apply engineering standard for ${company.trim()})\n`;
  }

  if (experienceLevel && experienceLevel.trim().length > 0) {
    prompt += `\n--- CANDIDATE EXPERIENCE LEVEL ---\nLevel: ${experienceLevel}\n`;
  }

  if (githubVerification && githubVerification.profileExists) {
    prompt += `\n--- GITHUB CODE VERIFICATION DATA ---\nUsername: ${githubVerification.username}
Public Repos: ${githubVerification.repoCount}
Total Commits: ${githubVerification.totalCommits}
Top Languages: ${JSON.stringify(githubVerification.topLanguages)}
Verified in Code: ${githubVerification.verified.join(", ") || "None"}
Unverified on GitHub: ${githubVerification.unverified.join(", ") || "None"}
Stale (>6 mo inactive): ${githubVerification.stale.join(", ") || "None"}
Unclaimed Repos: ${githubVerification.unclaimed.join(", ") || "None"}
`;
  } else {
    prompt += `\n--- GITHUB CODE VERIFICATION DATA ---\nNo GitHub profile connected or profile is empty. Base verification strictly on resume project evidence.\n`;
  }

  prompt += `\nExecute unified extraction, tiered gap analysis, and remediation project generation. Return valid JSON matching the schema now.`;
  return prompt;
}
