import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

// Initialize Tavily client helper
function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;
  return tavily({ apiKey });
}

/**
 * Web search tool for the Vercel AI SDK agent.
 * The LLM calls this tool to search for real learning resources.
 */
export const webSearchTool = tool({
  description:
    "Search the web for learning resources (courses, tutorials, documentation, videos) for a specific tech skill. Use specific queries like 'best free Docker tutorial for beginners 2025' rather than generic queries like 'learn Docker'.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query. Be specific — include the skill name, resource type, and 'free' if applicable."
      ),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe("Maximum number of results to return. Default 5."),
  }),
  execute: async ({ query, maxResults }) => {
    try {
      const tavilyClient = getTavilyClient();
      if (!tavilyClient) {
        return {
          success: false,
          error: "Tavily API key not configured",
          results: [],
        };
      }

      const response = await tavilyClient.search(query, {
        maxResults: maxResults || 5,
        searchDepth: "basic",
        includeAnswer: false,
      });

      const results = response.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 200) || "",
        score: r.score || 0,
      }));

      return {
        success: true,
        results,
      };
    } catch (err) {
      console.error("Tavily search error:", (err as Error).message);
      return {
        success: false,
        error: (err as Error).message,
        results: [],
      };
    }
  },
});
