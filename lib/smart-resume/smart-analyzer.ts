import { callLLM } from "@/lib/openrouter";
import {
  ResumeExtraction,
  ResumeExtractionSchema,
  ContactInfo,
} from "@/types";
import {
  analyzeDocumentLayout,
  SectionAnalysisResult,
} from "./section-detector";
import { extractMetadataRegex } from "@/lib/resume-extractor";

const SMART_RESUME_INDEXED_SYSTEM_PROMPT = `You are the Alibaba-inspired SmartResume Intelligent Parser.
You receive resume text where EVERY line is prefixed with a line index tag like [L01], [L02], etc.

YOUR OBJECTIVE:
Extract structured data with EXACT LINE CITATIONS (line numbers) for evidence verification.

EXTRACTION INSTRUCTIONS:
1. Contact Info: Extract name, email, phone, location, GitHub URL/username, LinkedIn, and portfolio link.
2. Skills:
   - Extract every technical skill.
   - Set category: "programming_languages", "frameworks_and_libraries", "databases_and_storage", "cloud_and_devops", "tools_and_platforms", "core_concepts", "soft_skills", or "other".
   - Set proficiency: "expert", "proficient", "familiar", or "unspecified".
   - Set lineCitations: An array of integers containing the EXACT line numbers (e.g. [14, 15]) where the skill appears.
   - Set sourceLine: The exact text of the primary line citation.
3. Work Experience:
   - Extract company, job title, duration, start/end dates, technologies used, highlights (bullet points), and metrics.
4. Projects:
   - Extract project name, description, tech stack, repo URL, live URL, metrics, and highlights.
5. Education:
   - Extract degree, field of study, university/institution, graduation year, GPA, and coursework.
6. Certifications & Awards:
   - Extract any professional certifications, licenses, hackathon awards, and honors.

RULES:
- ONLY extract facts explicitly stated in the lines.
- lineCitations MUST contain real line numbers corresponding to the [L#] prefixes in the input.

OUTPUT FORMAT: Return a valid JSON object matching ResumeExtractionSchema.`;

export class SmartResumeAnalyzer {
  /**
   * Main SmartResume analysis pipeline
   */
  public static async analyze(rawText: string): Promise<{
    extraction: ResumeExtraction;
    layout: SectionAnalysisResult;
  }> {
    // 1. Layout normalization and line indexing
    const layout = analyzeDocumentLayout(rawText);

    // 2. Deterministic regex metadata extraction
    const regexMetadata = extractMetadataRegex(rawText);

    // 3. LLM Extraction with line-indexed prompt
    const userPrompt = `Analyze this indexed resume document and extract all fields with exact line citations:

--- INDEXED RESUME DOCUMENT ---
${layout.indexedFullText.slice(0, 22000)}
--- END OF DOCUMENT ---

Extract the complete structured JSON object with lineCitations now.`;

    const llmResult = await callLLM<ResumeExtraction>(
      {
        systemPrompt: SMART_RESUME_INDEXED_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.1,
      },
      ResumeExtractionSchema
    );

    // 4. Merge contact details
    const mergedContact: ContactInfo = {
      ...llmResult.contactInfo,
      email: llmResult.contactInfo?.email || regexMetadata.email,
      githubUrl: llmResult.contactInfo?.githubUrl || regexMetadata.githubUrl,
      githubUsername:
        llmResult.contactInfo?.githubUsername ||
        regexMetadata.githubUsername ||
        (regexMetadata.githubUrl ? regexMetadata.githubUrl.split("/").pop() : undefined),
      linkedinUrl: llmResult.contactInfo?.linkedinUrl || regexMetadata.linkedinUrl,
      phone: llmResult.contactInfo?.phone || regexMetadata.phone,
      portfolioUrl: llmResult.contactInfo?.portfolioUrl || regexMetadata.portfolioUrl,
    };

    function ensureArray<T>(val: any): T[] {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return [val];
    }

    const finalExtraction: ResumeExtraction = {
      ...llmResult,
      skills: ensureArray(llmResult.skills),
      experience: ensureArray(llmResult.experience),
      projects: ensureArray(llmResult.projects),
      education: ensureArray(llmResult.education),
      certifications: ensureArray(llmResult.certifications),
      awards: ensureArray(llmResult.awards),
      contactInfo: mergedContact,
    };

    return {
      extraction: finalExtraction,
      layout,
    };
  }
}
