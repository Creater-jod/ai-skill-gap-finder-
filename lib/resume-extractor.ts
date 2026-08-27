import {
  ResumeExtraction,
  ContactInfo,
} from "@/types";
import { SmartResumeAnalyzer } from "./smart-resume/smart-analyzer";
import { analyzeDocumentLayout } from "./smart-resume/section-detector";

export { analyzeDocumentLayout };

/**
 * Deterministic regex pre-pass for high-precision metadata extraction
 * Supports GitHub, LinkedIn, Portfolio, Email, Phone
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
    /(?:https?:\/\/)?([a-zA-Z0-9-]+\.(?:dev|io|me|app|site|tech|info|ai|com))\b/i
  );
  if (
    portfolioMatch &&
    !portfolioMatch[0].includes("github") &&
    !portfolioMatch[0].includes("linkedin") &&
    !portfolioMatch[0].includes("gmail")
  ) {
    metadata.portfolioUrl = portfolioMatch[0].startsWith("http")
      ? portfolioMatch[0]
      : `https://${portfolioMatch[0]}`;
  }

  return metadata;
}

/**
 * Hybrid Open-Source Deep Resume Extractor (Alibaba SmartResume Architecture)
 * Uses line indexing, section boundary detection, and DeepSeek LLM structured inference.
 */
export async function extractFullResume(
  resumeText: string
): Promise<ResumeExtraction> {
  const result = await SmartResumeAnalyzer.analyze(resumeText);
  return result.extraction;
}
