import { callLLM } from "@/lib/openrouter";
import {
  ResumeExtractionSchema,
  ResumeExtraction,
  ContactInfo,
} from "@/types";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "@/lib/prompts/extraction-prompt";

/**
 * Deterministic regex pre-pass for high-precision metadata extraction
 */
export function extractMetadataRegex(rawText: string): Partial<ContactInfo> {
  const metadata: Partial<ContactInfo> = {};

  // Email
  const emailMatch = rawText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i
  );
  if (emailMatch) {
    metadata.email = emailMatch[0].trim();
  }

  // GitHub URL or Handle
  const githubMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i
  );
  if (githubMatch) {
    metadata.githubUrl = `https://github.com/${githubMatch[1]}`;
    metadata.githubUsername = githubMatch[1].trim();
  } else {
    // Check for "GitHub: username" or "@username"
    const ghHandleMatch = rawText.match(/github(?:\.com)?[\s/:]+@?([a-zA-Z0-9_-]{2,38})/i);
    if (ghHandleMatch) {
      metadata.githubUsername = ghHandleMatch[1].trim();
      metadata.githubUrl = `https://github.com/${metadata.githubUsername}`;
    }
  }

  // LinkedIn
  const linkedinMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i
  );
  if (linkedinMatch) {
    metadata.linkedinUrl = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  // Phone
  const phoneMatch = rawText.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  if (phoneMatch) {
    metadata.phone = phoneMatch[0].trim();
  }

  // Portfolio / Website URL
  const portfolioMatch = rawText.match(
    /(?:https?:\/\/)?([a-zA-Z0-9-]+\.(?:dev|io|me|app|site|tech|com))\b/i
  );
  if (portfolioMatch && !portfolioMatch[0].includes("github") && !portfolioMatch[0].includes("linkedin")) {
    metadata.portfolioUrl = portfolioMatch[0].startsWith("http")
      ? portfolioMatch[0]
      : `https://${portfolioMatch[0]}`;
  }

  return metadata;
}

/**
 * Hybrid Open-Source Deep Resume Extractor
 * Combines Regex Pattern Recognition + DeepSeek LLM Structured Inference
 */
export async function extractFullResume(
  resumeText: string
): Promise<ResumeExtraction> {
  // Step 1: Deterministic regex pre-pass
  const regexMetadata = extractMetadataRegex(resumeText);

  // Step 2: Deep LLM Extraction using DeepSeek
  const llmResult = await callLLM<ResumeExtraction>(
    {
      systemPrompt: EXTRACTION_SYSTEM_PROMPT,
      userPrompt: buildExtractionUserPrompt(resumeText.slice(0, 20000)),
      temperature: 0.1, // Low temperature for high extraction fidelity
    },
    ResumeExtractionSchema
  );

  // Step 3: Merge and enrich metadata to ensure no loss of detected links
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

  return {
    ...llmResult,
    contactInfo: mergedContact,
  };
}
