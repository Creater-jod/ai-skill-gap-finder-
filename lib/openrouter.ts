import OpenAI from "openai";
import { z, ZodSchema } from "zod";

// Lazy getter or fallback for build-time safety
export function getOpenAIClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy-build-key",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Skill Gap Finder",
    },
  });
}

export const MODEL = "deepseek/deepseek-chat-v3-0324:free";
const MAX_RETRIES = 2;

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

/**
 * Call the LLM and parse the response as JSON.
 * No schema validation — returns raw parsed JSON.
 */
export async function callLLMRaw(options: LLMCallOptions): Promise<unknown> {
  const { systemPrompt, userPrompt, temperature = 0.3 } = options;
  const client = getOpenAIClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from LLM");
      }

      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }

      const parsed = JSON.parse(cleanContent.trim());
      return parsed;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `LLM call attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        (error as Error).message
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `LLM call failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Call the LLM, parse JSON, and validate against a Zod schema.
 * Retries on validation failure.
 */
export async function callLLM<T>(
  options: LLMCallOptions,
  schema: ZodSchema<T>
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callLLMRaw(options);

      // Validate with Zod
      const validated = schema.parse(raw);
      return validated;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof z.ZodError) {
        console.error(
          `Schema validation failed (attempt ${attempt + 1}):`,
          error.issues
        );
      } else {
        console.error(
          `LLM call failed (attempt ${attempt + 1}):`,
          (error as Error).message
        );
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `LLM call with validation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}
