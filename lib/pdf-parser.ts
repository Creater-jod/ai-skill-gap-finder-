import { extractText } from "unpdf";

export interface PDFParseResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export interface PDFParseError {
  error: string;
  code: "INVALID_FILE" | "PARSE_ERROR" | "EMPTY_PDF" | "FILE_TOO_LARGE";
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

/**
 * Layout-aware PDF text parser inspired by Alibaba SmartResume.
 * Extracts multi-page text reliably in universal JS / Next.js runtimes.
 */
export async function parsePDF(
  buffer: Buffer
): Promise<PDFParseResult | PDFParseError> {
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      error: "File size exceeds 10MB limit. Please upload a smaller PDF.",
      code: "FILE_TOO_LARGE",
    };
  }

  // Check PDF magic bytes (%PDF)
  const header = buffer.subarray(0, 5).toString("ascii");
  if (!header.startsWith("%PDF")) {
    return {
      error: "Uploaded file is not a valid PDF document.",
      code: "INVALID_FILE",
    };
  }

  try {
    const data = new Uint8Array(buffer);
    const result = await extractText(data, { mergePages: false });
    
    let fullText = "";
    let pageCount = 1;

    if (Array.isArray(result.text)) {
      fullText = result.text.join("\n\n");
      pageCount = result.totalPages || result.text.length || 1;
    } else if (typeof result.text === "string") {
      fullText = result.text;
      pageCount = result.totalPages || 1;
    }

    const cleaned = cleanText(fullText);

    if (!cleaned || cleaned.trim().length < 30) {
      return {
        error:
          "PDF appears to be empty or contains too little text. It may be a scanned image — please use a text-based PDF.",
        code: "EMPTY_PDF",
      };
    }

    const wordCount = cleaned
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    return {
      text: cleaned,
      pageCount,
      wordCount,
    };
  } catch (err) {
    console.error("[PDFParser] Error parsing PDF:", err);
    return {
      error: `Failed to parse PDF: ${(err as Error).message || "Unknown parse error"}`,
      code: "PARSE_ERROR",
    };
  }
}

/**
 * Clean & normalize raw resume text (Alibaba SmartResume layout normalization)
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Type guard to check if parse result is an error
 */
export function isPDFError(
  result: PDFParseResult | PDFParseError
): result is PDFParseError {
  return "error" in result;
}


