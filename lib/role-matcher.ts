import { RoleProfile, RoleProfileSchema } from "@/types";
import roleProfilesData from "@/lib/data/role-profiles.json";
import { callLLM } from "@/lib/openrouter";
import { z } from "zod";

interface CuratedRoleEntry extends RoleProfile {
  aliases?: string[];
  category?: string;
}

const curatedRoles: CuratedRoleEntry[] = roleProfilesData as CuratedRoleEntry[];

/**
 * Return all curated role titles for UI suggestions & autocomplete.
 */
export function getCuratedRoleSuggestions(): { title: string; category?: string }[] {
  return curatedRoles.map((r) => ({
    title: r.roleName,
    category: r.category,
  }));
}

/**
 * Compute lexical and token similarity between two strings.
 */
function computeSimilarity(query: string, target: string, aliases: string[] = []): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  // Exact match
  if (q === t) return 1.0;

  // Exact alias match
  for (const alias of aliases) {
    if (q === alias.toLowerCase().trim()) return 0.98;
    if (alias.toLowerCase().includes(q) || q.includes(alias.toLowerCase())) return 0.9;
  }

  // Substring match
  if (t.includes(q) || q.includes(t)) {
    const ratio = Math.min(q.length, t.length) / Math.max(q.length, t.length);
    return Math.max(0.75, ratio);
  }

  // Token overlap (Jaccard similarity)
  const qTokens = new Set(q.split(/[\s\-_/,]+/).filter((tok) => tok.length > 1));
  const tTokens = new Set(t.split(/[\s\-_/,]+/).filter((tok) => tok.length > 1));

  let overlap = 0;
  for (const token of qTokens) {
    if (tTokens.has(token)) {
      overlap++;
    } else {
      for (const tToken of tTokens) {
        if (tToken.includes(token) || token.includes(tToken)) {
          overlap += 0.6;
          break;
        }
      }
    }
  }

  const union = new Set([...qTokens, ...tTokens]).size;
  const jaccard = union === 0 ? 0 : overlap / union;

  return Math.min(1.0, jaccard * 1.2);
}

const AI_ROLE_GENERATOR_SYSTEM_PROMPT = `You are a technical recruiting and engineering leadership specialist.
Your task is to generate a comprehensive, structured role benchmark profile for ANY technical job title given by the user.

CRITICAL RULES:
1. Generate 7-10 realistic required technical skills with realistic importance weights (0.5 to 1.0).
2. Categorize each skill into: 'programming', 'architecture', 'security', 'database', 'devops', 'tools', 'testing', or 'domain'.
3. Include 4-6 modern nice-to-have skills.
4. Output must strictly conform to the required JSON schema.
5. Set 'isAIGenerated' to true.
6. Set 'matchConfidence' to 0.85.

OUTPUT FORMAT:
{
  "roleName": "Target Job Title",
  "matchConfidence": 0.85,
  "isAIGenerated": true,
  "description": "2-sentence overview of core responsibilities and technical bar.",
  "requiredSkills": [
    { "skill": "Skill Name", "weight": 0.9, "category": "programming" }
  ],
  "niceToHaveSkills": ["Skill 1", "Skill 2"]
}`;

/**
 * Match a target role against the RAG knowledge base of 25+ curated roles,
 * or fallback to dynamic AI generation if it's an unrecognized role.
 */
export async function matchRoleProfile(targetRole: string): Promise<RoleProfile> {
  const cleanRole = targetRole.trim();
  if (!cleanRole) {
    return curatedRoles[0]; // Default to Smart Contract Developer or Backend
  }

  // 1. Search in-memory curated knowledge base
  let bestMatch: CuratedRoleEntry | null = null;
  let highestScore = 0;

  for (const profile of curatedRoles) {
    const score = computeSimilarity(cleanRole, profile.roleName, profile.aliases || []);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = profile;
    }
  }

  // 2. If strong match found (score >= 0.5), return curated benchmark
  if (bestMatch && highestScore >= 0.5) {
    return {
      roleName: cleanRole.length > 2 ? cleanRole : bestMatch.roleName,
      matchConfidence: Math.min(0.98, Math.max(0.7, Number(highestScore.toFixed(2)))),
      isAIGenerated: false,
      description: bestMatch.description,
      requiredSkills: bestMatch.requiredSkills,
      niceToHaveSkills: bestMatch.niceToHaveSkills,
    };
  }

  // 3. Fallback: Generate role profile on-the-fly using LLM
  console.log(`[RAG Role Matcher] Low confidence (${highestScore.toFixed(2)}) for "${cleanRole}" — invoking AI Role Synthesizer...`);

  try {
    const generatedProfile = await callLLM<RoleProfile>(
      {
        systemPrompt: AI_ROLE_GENERATOR_SYSTEM_PROMPT,
        userPrompt: `Generate a comprehensive technical role benchmark profile for the target role: "${cleanRole}".`,
        temperature: 0.3,
      },
      RoleProfileSchema
    );

    return {
      ...generatedProfile,
      roleName: cleanRole,
      isAIGenerated: true,
      matchConfidence: 0.85,
    };
  } catch (err) {
    console.error("[RAG Role Matcher] AI fallback failed, using closest curated profile:", err);
    return bestMatch || curatedRoles[0];
  }
}
