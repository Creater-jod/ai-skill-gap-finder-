import { tavily } from "@tavily/core";
import OpenAI from "openai";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

async function verifyKeys() {
  console.log("🔍 Testing Live API Connections...\n");

  // 1. Test Tavily API
  console.log("1. Testing Tavily Search API...");
  try {
    const tvClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const tvRes = await tvClient.search("Docker official tutorial get started", { maxResults: 2 });
    console.log(`✅ Tavily API Connected! Found ${tvRes.results.length} live results:`);
    tvRes.results.forEach((r, idx) => {
      console.log(`   [${idx + 1}] ${r.title} -> ${r.url}`);
    });
  } catch (err) {
    console.error(`❌ Tavily API Error: ${err.message}`);
  }

  console.log("\n------------------------------------------------\n");

  // 2. Test OpenRouter LLM API
  console.log("2. Testing OpenRouter LLM API (DeepSeek v3)...");
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Skill Gap Finder",
      },
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
      messages: [
        { role: "system", content: "You are a test assistant. Return JSON: {\"status\": \"ok\", \"message\": \"OpenRouter connected successfully\"}" },
        { role: "user", content: "Ping test" }
      ],
      response_format: { type: "json_object" },
    });

    console.log("✅ OpenRouter Connected! LLM Response:");
    console.log("  ", completion.choices[0]?.message?.content);
  } catch (err) {
    console.error(`❌ OpenRouter API Error: ${err.message}`);
  }

  console.log("\n🎉 Verification finished!");
}

verifyKeys();
