import { tool } from "ai";
import { z } from "zod";

/**
 * URL validator tool for the Vercel AI SDK agent.
 * The LLM calls this to verify that a resource URL is actually reachable and not a 404 or dead link.
 */
export const urlValidatorTool = tool({
  description:
    "Validate that a URL is reachable and extract the page title and description. Use this to verify that search results point to real, working pages.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to validate."),
  }),
  execute: async ({ url }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          isValid: false,
          title: "",
          description: "",
          statusCode: res.status,
        };
      }

      // Extract title and meta description from HTML snippet (only read first 8KB)
      let html = "";
      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (html.length < 8192) {
          const { done, value } = await reader.read();
          if (done) break;
          html += decoder.decode(value, { stream: true });
        }
        try { reader.cancel(); } catch { /* ignore cancel errors */ }
      } else {
        html = await res.text();
      }

      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
      );

      return {
        isValid: true,
        title: titleMatch ? titleMatch[1].trim() : "No title found",
        description: descMatch
          ? descMatch[1].trim().slice(0, 200)
          : "No description available",
        statusCode: res.status,
      };
    } catch (err) {
      const errorMessage = (err as Error).message;
      return {
        isValid: false,
        title: "",
        description: "",
        error: errorMessage.includes("aborted")
          ? "Request timed out"
          : errorMessage,
      };
    }
  },
});
