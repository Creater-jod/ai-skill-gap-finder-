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

/**
 * Extract text from a PDF buffer using PDFParse.
 * Returns cleaned text suitable for LLM processing.
 */
export async function parsePDF(
  buffer: Buffer
): Promise<PDFParseResult | PDFParseError> {
  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      error: "File size exceeds 5MB limit. Please upload a smaller PDF.",
      code: "FILE_TOO_LARGE",
    };
  }

  // Check if it's actually a PDF (starts with %PDF)
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

/**
 * Clean raw PDF text:
 * - Remove null characters
 * - Normalize line breaks
 * - Max 2 consecutive newlines
 * - Collapse spaces/tabs
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
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
