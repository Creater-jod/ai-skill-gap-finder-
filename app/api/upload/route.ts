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

    // Check MIME type or extension
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
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
