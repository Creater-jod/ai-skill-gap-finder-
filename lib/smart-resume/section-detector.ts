/**
 * SmartResume Layout Normalizer & Semantic Section Boundary Detector
 * Inspired by Alibaba SmartResume's reading order and section indexing architecture.
 */

export interface IndexedLine {
  lineNum: number;
  text: string;
  isHeader: boolean;
  sectionType?: SectionType;
}

export type SectionType =
  | "contact"
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "awards"
  | "other";

export interface ParsedSection {
  type: SectionType;
  rawHeader: string;
  startLine: number;
  endLine: number;
  lines: string[];
  indexedText: string;
}

export interface SectionAnalysisResult {
  indexedLines: IndexedLine[];
  indexedFullText: string;
  sections: ParsedSection[];
  lineCount: number;
}

const SECTION_HEADER_PATTERNS: { type: SectionType; regex: RegExp }[] = [
  {
    type: "contact",
    regex: /^(?:contact|contact\s+info|personal\s+info|details)$/i,
  },
  {
    type: "summary",
    regex: /^(?:summary|professional\s+summary|profile|about\s+me|overview|executive\s+summary|career\s+objective)$/i,
  },
  {
    type: "skills",
    regex: /^(?:skills|technical\s+skills|skills\s+and\s+competencies|core\s+competencies|technologies|tech\s+stack|programming\s+languages)$/i,
  },
  {
    type: "experience",
    regex: /^(?:experience|work\s+experience|professional\s+experience|employment\s+history|work\s+history|internships)$/i,
  },
  {
    type: "projects",
    regex: /^(?:projects|technical\s+projects|personal\s+projects|academic\s+projects|key\s+projects|open\s+source)$/i,
  },
  {
    type: "education",
    regex: /^(?:education|academic\s+background|educational\s+qualifications|academics|university)$/i,
  },
  {
    type: "certifications",
    regex: /^(?:certifications|licenses|certifications\s+and\s+licenses|professional\s+certifications|courses)$/i,
  },
  {
    type: "awards",
    regex: /^(?:awards|honors|achievements|hackathons|publications|extracurricular)$/i,
  },
];

/**
 * Check if a trimmed line is likely a section header
 */
function matchSectionHeader(line: string): SectionType | null {
  const clean = line.replace(/[:\-=_#*|]/g, "").trim();
  if (!clean || clean.length > 40) return null;

  for (const { type, regex } of SECTION_HEADER_PATTERNS) {
    if (regex.test(clean)) {
      return type;
    }
  }

  return null;
}

/**
 * Assign line numbers, detect headers, and chunk resume into verified sections
 */
export function analyzeDocumentLayout(rawText: string): SectionAnalysisResult {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const indexedLines: IndexedLine[] = [];
  const sections: ParsedSection[] = [];

  let currentSectionType: SectionType = "contact";
  let currentHeader = "HEADER";
  let currentStartLine = 1;
  let currentLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const lineNum = i + 1;
    const lineText = rawLines[i];
    const headerMatch = matchSectionHeader(lineText);

    if (headerMatch) {
      // Save previous section if it has content
      if (currentLines.length > 0) {
        sections.push({
          type: currentSectionType,
          rawHeader: currentHeader,
          startLine: currentStartLine,
          endLine: lineNum - 1,
          lines: currentLines,
          indexedText: currentLines.join("\n"),
        });
      }

      currentSectionType = headerMatch;
      currentHeader = lineText;
      currentStartLine = lineNum;
      currentLines = [`[L${lineNum}] ${lineText}`];

      indexedLines.push({
        lineNum,
        text: lineText,
        isHeader: true,
        sectionType: headerMatch,
      });
    } else {
      currentLines.push(`[L${lineNum}] ${lineText}`);
      indexedLines.push({
        lineNum,
        text: lineText,
        isHeader: false,
        sectionType: currentSectionType,
      });
    }
  }

  // Push final section
  if (currentLines.length > 0) {
    sections.push({
      type: currentSectionType,
      rawHeader: currentHeader,
      startLine: currentStartLine,
      endLine: rawLines.length,
      lines: currentLines,
      indexedText: currentLines.join("\n"),
    });
  }

  const indexedFullText = indexedLines
    .map((l) => `[L${l.lineNum}] ${l.text}`)
    .join("\n");

  return {
    indexedLines,
    indexedFullText,
    sections,
    lineCount: indexedLines.length,
  };
}
