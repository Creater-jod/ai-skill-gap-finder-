import { generateText, isStepCount } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { webSearchTool } from "@/lib/tools/web-search-tool";
import { urlValidatorTool } from "@/lib/tools/url-validator-tool";
import { AgenticResource } from "@/types";
import { resourceCache } from "@/lib/cache";

function getOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "dummy-build-key") {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Please configure .env.local to enable live AI resource curation."
    );
  }

  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Skill Gap Finder",
    },
  });
}

const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

const RESOURCE_AGENT_SYSTEM_PROMPT = `You are a learning resource curator for tech professionals. Your job is to find high-quality, REAL learning resources for specific skill gaps.

WORKFLOW:
1. For each skill gap, call the web_search tool with a specific query like "best free [SKILL] tutorial for beginners 2025" or "[SKILL] official documentation getting started".
2. From the search results, pick the top 2-3 most relevant results.
3. Call the validate_url tool on each picked URL to verify it's reachable.
4. Return ONLY verified, working URLs.

RESOURCE PREFERENCES (in order):
1. Official documentation (docs.docker.com, react.dev, etc.)
2. Free interactive tutorials (freeCodeCamp, Codecademy free, etc.)
3. High-quality written tutorials (DigitalOcean, dev.to, etc.)
4. YouTube tutorials from reputable channels
5. Paid courses ONLY if nothing free is available — mark as "paid"

RULES:
- NEVER make up URLs. ALWAYS search first, then validate.
- If validate_url returns isValid: false, DO NOT include that URL.
- If web_search returns no results or fails, say so honestly — do not hallucinate resources.
- Classify each resource type as: "course", "tutorial", "docs", or "video".
- Return 2-3 resources for "missing" skills, 1-2 for "partial" skills.

OUTPUT FORMAT: Return ONLY valid JSON with this exact structure:
{
  "resources": [
    {
      "skill": "Docker",
      "severity": "missing",
      "resources": [
        {
          "title": "Docker Getting Started Guide",
          "url": "https://docs.docker.com/get-started/",
          "description": "Official Docker tutorial covering containers, images, and Docker Compose",
          "type": "docs",
          "verified": true,
          "source": "web_search"
        }
      ]
    }
  ]
}`;

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

export interface SkillGapInput {
  skill: string;
  severity: "missing" | "partial";
}

/**
 * Robust JSON extraction from arbitrary LLM response text
 */
function extractJSONFromText(text: string): { resources?: AgenticResource[] } | null {
  try {
    let clean = text.trim();
    if (clean.startsWith("```json")) {
      clean = clean.slice(7);
    } else if (clean.startsWith("```")) {
      clean = clean.slice(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.slice(0, -3);
    }

    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
  } catch (err) {
    console.warn("[Resource Agent] JSON parse fallback triggered:", (err as Error).message);
  }
  return null;
}

/**
 * Find resources for a batch of skill gaps using the agentic approach.
 */
export async function findResources(
  skillGaps: SkillGapInput[]
): Promise<AgenticResource[]> {
  if (skillGaps.length === 0) return [];

  // Check cache first
  const cached = resourceCache.get(skillGaps) as AgenticResource[] | null;
  if (cached) {
    console.log("[Resource Agent] Cache hit for skill gaps");
    return cached;
  }

  const hasTavily = !!process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== "your_tavily_api_key_here";

  if (!hasTavily) {
    console.warn("Tavily API key not configured — using fallback AI suggestions");
    const fallback = await findResourcesFallback(skillGaps);
    resourceCache.set(skillGaps, fallback);
    return fallback;
  }

  const openrouter = getOpenRouterProvider();
  const batches = chunkArray(skillGaps, 3);
  const allResources: AgenticResource[] = [];

  for (const batch of batches) {
    const batchPrompt = `Find learning resources for these skill gaps:

${batch.map((g, i) => `${i + 1}. "${g.skill}" (severity: ${g.severity})`).join("\n")}

Search for each skill, validate URLs, and return the resources JSON.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s max per batch

    try {
      const result = await generateText({
        model: openrouter(MODEL),
        system: RESOURCE_AGENT_SYSTEM_PROMPT,
        prompt: batchPrompt,
        tools: {
          web_search: webSearchTool,
          validate_url: urlValidatorTool,
        },
        stopWhen: isStepCount(15),
        temperature: 0.3,
        abortSignal: controller.signal,
      });

      clearTimeout(timeoutId);

      const parsed = extractJSONFromText(result.text);
      if (parsed && Array.isArray(parsed.resources)) {
        allResources.push(...parsed.resources);
      } else {
        const fallback = await findResourcesFallback(batch);
        allResources.push(...fallback);
      }
    } catch (innerErr) {
      clearTimeout(timeoutId);
      console.warn("[Resource Agent] Batch tool execution error, falling back:", (innerErr as Error).message);
      const fallback = await findResourcesFallback(batch);
      allResources.push(...fallback);
    }
  }

  resourceCache.set(skillGaps, allResources);
  return allResources;
}

/**
 * Fallback: LLM generates resource suggestions WITHOUT web search.
 */
async function findResourcesFallback(
  skillGaps: SkillGapInput[]
): Promise<AgenticResource[]> {
  try {
    const { callLLMRaw } = await import("@/lib/openrouter");

    const raw = await callLLMRaw({
      systemPrompt: `You are a learning resource curator. Suggest well-known, widely-used learning resources for tech skills. 
IMPORTANT: Only suggest URLs you are highly confident actually exist (official docs, well-known platforms like freeCodeCamp, MDN, etc.).
Mark all resources as "source": "ai_suggested" and "verified": false since you cannot verify URLs.

Return JSON: { "resources": [ { "skill": "...", "severity": "missing|partial", "resources": [ { "title": "...", "url": "...", "description": "...", "type": "docs|tutorial|course|video", "verified": false, "source": "ai_suggested" } ] } ] }`,
      userPrompt: `Suggest 2-3 learning resources for each skill gap:
${skillGaps.map((g) => `- ${g.skill} (${g.severity})`).join("\n")}`,
      temperature: 0.3,
    });

    const parsed = raw as { resources?: AgenticResource[] };
    return parsed.resources || [];
  } catch {
    return skillGaps.map((g) => ({
      skill: g.skill,
      severity: g.severity,
      resources: [],
    }));
  }
}
