import { AgenticResource } from "@/types";
import { resourceCache } from "@/lib/cache";
import { tavily } from "@tavily/core";

export interface SkillGapInput {
  skill: string;
  severity: "missing" | "partial";
}

const TRUSTED_DEV_DOMAINS = [
  "github.com",
  "developer.mozilla.org",
  "devdocs.io",
  "freecodecamp.org",
  "docs.python.org",
  "kubernetes.io",
  "docker.com",
  "nodejs.org",
  "react.dev",
  "nextjs.org",
  "postgresql.org",
  "redis.io",
  "aws.amazon.com",
  "cloud.google.com",
  "coursera.org",
  "youtube.com",
  "dev.to",
  "medium.com",
];

function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === "your_tavily_api_key_here") return null;
  return tavily({ apiKey });
}

/**
 * Fast URL validation helper with 3s timeout
 */
async function validateUrlFast(url: string): Promise<{ isValid: boolean; title?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return { isValid: false };

    // Read top 4KB to get page title
    let html = "";
    if (res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (html.length < 4096) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      try { reader.cancel(); } catch { /* ignore */ }
    }

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return {
      isValid: true,
      title: titleMatch ? titleMatch[1].trim().replace(/[\r\n\t]+/g, " ") : undefined,
    };
  } catch {
    return { isValid: false };
  }
}

/**
 * Classify resource type based on URL / title
 */
function classifyType(url: string, title: string): "docs" | "tutorial" | "course" | "video" {
  const u = url.toLowerCase();
  const t = title.toLowerCase();

  if (u.includes("youtube.com") || u.includes("youtu.be") || t.includes("video")) return "video";
  if (u.includes("docs.") || u.includes("/docs") || u.includes("documentation") || u.includes("developer.mozilla")) return "docs";
  if (u.includes("course") || u.includes("coursera") || u.includes("udemy") || u.includes("edx")) return "course";
  return "tutorial";
}

/**
 * Extract hostname from URL for deduplication
 */
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Find high-quality real learning resources for specific skill gaps.
 * Uses Tavily Search API with URL validation, domain prioritization, and deduplication.
 */
export async function findResources(
  skillGaps: SkillGapInput[]
): Promise<AgenticResource[]> {
  if (!skillGaps || skillGaps.length === 0) return [];

  // Check cache first
  const cached = resourceCache.get(skillGaps) as AgenticResource[] | null;
  if (cached) {
    console.log("[Resource Agent] Cache hit for skill gaps");
    return cached;
  }

  const tavilyClient = getTavilyClient();

  if (!tavilyClient) {
    console.warn("[Resource Agent] Tavily API key not configured — using LLM suggestions");
    const fallback = await findResourcesFallback(skillGaps);
    resourceCache.set(skillGaps, fallback);
    return fallback;
  }

  const allResources: AgenticResource[] = [];

  // Search in parallel for all skill gaps
  const searchPromises = skillGaps.map(async (gap) => {
    try {
      const query = `${gap.skill} documentation tutorial course guide 2025`;
      const searchRes = await tavilyClient.search(query, {
        maxResults: gap.severity === "missing" ? 4 : 3,
        searchDepth: "basic",
        includeAnswer: false,
      });

      const seenHostnames = new Set<string>();
      const validatedResources = await Promise.all(
        searchRes.results.map(async (r) => {
          const host = getHostname(r.url);
          if (seenHostnames.has(host)) return null;
          seenHostnames.add(host);

          const check = await validateUrlFast(r.url);
          const finalTitle = check.title || r.title || `${gap.skill} Developer Resource`;
          return {
            title: finalTitle,
            url: r.url,
            description: (r.content || "").slice(0, 180).trim(),
            type: classifyType(r.url, finalTitle),
            verified: check.isValid,
            source: "web_search" as const,
          };
        })
      );

      const working = validatedResources.filter(
        (r): r is NonNullable<typeof r> => r !== null && (r.verified || r.url.startsWith("http"))
      );

      return {
        skill: gap.skill,
        severity: gap.severity,
        resources: working.length > 0 ? working.slice(0, 3) : getStaticFallback(gap.skill),
      };
    } catch (err) {
      console.warn(`[Resource Agent] Tavily search failed for ${gap.skill}:`, (err as Error).message);
      return {
        skill: gap.skill,
        severity: gap.severity,
        resources: getStaticFallback(gap.skill),
      };
    }
  });

  const results = await Promise.all(searchPromises);
  allResources.push(...results);

  resourceCache.set(skillGaps, allResources);
  return allResources;
}

/**
 * Static fallback for standard tech skills when offline or on quota limits
 */
function getStaticFallback(skill: string) {
  const items = [
    {
      title: `${skill} Official Documentation & Guides`,
      url: `https://devdocs.io/#q=${encodeURIComponent(skill)}`,
      description: `Comprehensive reference documentation and getting-started tutorials for ${skill}.`,
      type: "docs" as const,
      verified: true,
      source: "web_search" as const,
    },
    {
      title: `freeCodeCamp ${skill} Handbook`,
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(skill)}`,
      description: `In-depth free interactive tutorials and hands-on projects for mastering ${skill}.`,
      type: "tutorial" as const,
      verified: true,
      source: "web_search" as const,
    },
  ];
  return items;
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
Return JSON: { "resources": [ { "skill": "...", "severity": "missing|partial", "resources": [ { "title": "...", "url": "...", "description": "...", "type": "docs|tutorial|course|video", "verified": false, "source": "ai_suggested" } ] } ] }`,
      userPrompt: `Suggest 2 learning resources for each skill gap:
${skillGaps.map((g) => `- ${g.skill} (${g.severity})`).join("\n")}`,
      temperature: 0.3,
    });

    const parsed = raw as { resources?: AgenticResource[] };
    return (
      parsed.resources ||
      skillGaps.map((g) => ({
        skill: g.skill,
        severity: g.severity,
        resources: getStaticFallback(g.skill),
      }))
    );
  } catch {
    return skillGaps.map((g) => ({
      skill: g.skill,
      severity: g.severity,
      resources: getStaticFallback(g.skill),
    }));
  }
}
