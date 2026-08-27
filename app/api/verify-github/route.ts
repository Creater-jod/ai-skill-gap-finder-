import { NextRequest, NextResponse } from "next/server";
import { verifyGitHub } from "@/lib/github-verifier";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, claimedSkills } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'username' field." },
        { status: 400 }
      );
    }

    if (!claimedSkills || !Array.isArray(claimedSkills) || claimedSkills.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'claimedSkills' array." },
        { status: 400 }
      );
    }

    // Clean username (remove @ if present, trim whitespace)
    const cleanUsername = username.replace(/^@/, "").trim();

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Invalid GitHub username format." },
        { status: 400 }
      );
    }

    const verification = await verifyGitHub(cleanUsername, claimedSkills);

    return NextResponse.json(verification);
  } catch (err) {
    console.error("GitHub verify route error:", err);
    return NextResponse.json(
      {
        error: "Failed to verify GitHub profile.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
