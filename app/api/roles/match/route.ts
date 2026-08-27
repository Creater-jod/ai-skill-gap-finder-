import { NextRequest, NextResponse } from "next/server";
import { matchRoleProfile, getCuratedRoleSuggestions } from "@/lib/role-matcher";

export async function GET() {
  const suggestions = getCuratedRoleSuggestions();
  return NextResponse.json({ suggestions });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetRole } = body;

    if (!targetRole || typeof targetRole !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'targetRole' field." },
        { status: 400 }
      );
    }

    const profile = await matchRoleProfile(targetRole);
    return NextResponse.json(profile);
  } catch (err) {
    console.error("Role match route error:", err);
    return NextResponse.json(
      { error: "Failed to match role profile.", details: (err as Error).message },
      { status: 500 }
    );
  }
}
