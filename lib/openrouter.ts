import OpenAI from "openai";
import { z, ZodType } from "zod";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === "dummy-build-key") {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Please configure OPENROUTER_API_KEY in your Vercel Project Settings > Environment Variables."
    );
  }

  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "AI Skill Gap Finder",
    },
  });
}

export const MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
const MAX_RETRIES = 2;

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

/**
 * Call the OpenRouter LLM and parse the response as JSON.
 * Live real API execution.
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
        `[OpenRouter LLM] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `OpenRouter LLM call failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Call the LLM, parse JSON, and validate against a Zod schema with resilient recovery.
 */
export async function callLLM<T>(
  options: LLMCallOptions,
  schema: ZodType<T, any, any>
): Promise<T> {
  const raw = await callLLMRaw(options);
  const result = schema.safeParse(raw);
  
  if (!result.success) {
    console.warn("[OpenRouter LLM] Zod validation warning:", JSON.stringify(result.error.issues, null, 2));
    // If raw is an object, attempt to return raw casted if structure is generally present
    if (typeof raw === "object" && raw !== null) {
      return raw as T;
    }
    throw result.error;
  }
  
  return result.data;
}

