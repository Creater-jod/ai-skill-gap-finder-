import OpenAI from "openai";
import { z, ZodSchema } from "zod";

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
const MAX_RETRIES = 1;

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

/**
 * Deterministic local mock responder for offline testing
 */
function getLocalMockResponse(systemPrompt: string, userPrompt: string): unknown {
  const sys = systemPrompt.toLowerCase();

  // Mock for Prompt 1: Resume Extraction
  if (sys.includes("extract structured data from resume text")) {
    const text = userPrompt.toLowerCase();
    const skills = [
      { name: "Python", context: "Demonstrated across multiple backend repositories" },
      { name: "PostgreSQL", context: "Database design and querying" },
      { name: "REST APIs", context: "Designed microservice endpoints" },
      { name: "Node.js", context: "Built backend server applications" },
      { name: "Git", context: "Version control and team collaboration" },
    ];

    if (text.includes("docker") || text.includes("container")) {
      skills.push({ name: "Docker", context: "Containerized local environments" });
    }
    if (text.includes("react") || text.includes("frontend")) {
      skills.push({ name: "React", context: "Built responsive client UIs" });
    }

    return {
      skills,
      projects: [
        {
          name: "Distributed Task Queue",
          description: "Asynchronous task execution engine using Redis and Python workers.",
          technologies: ["Python", "Redis", "PostgreSQL", "REST APIs"],
        },
        {
          name: "Auth & Identity Gateway",
          description: "JWT-based authentication microservice with role-based access control.",
          technologies: ["Node.js", "PostgreSQL", "Docker"],
        },
      ],
      experience: [
        {
          title: "Backend Engineer Intern",
          company: "CloudTech Systems",
          duration: "Jun 2024 - Present",
          highlights: [
            "Optimized SQL queries reducing latency by 35%",
            "Built 12+ REST endpoints for customer onboarding",
          ],
        },
      ],
      education: [
        {
          degree: "B.Tech in Computer Science",
          institution: "State University of Technology",
          year: "2025",
        },
      ],
      summary: "Backend engineer focused on scalable APIs, databases, and microservices.",
    };
  }

  // Mock for Prompt 2: Gap Analysis
  if (sys.includes("tiered gap analysis") || sys.includes("compare a candidate's demonstrated skills")) {
    return {
      score: 74,
      tiers: {
        demonstrated: [
          { skill: "Python", tier: "demonstrated", evidence: "Verified in 3 resume projects and active GitHub repositories", weight: 0.9 },
          { skill: "PostgreSQL", tier: "demonstrated", evidence: "Used extensively for relational schema modeling", weight: 0.8 },
          { skill: "REST APIs", tier: "demonstrated", evidence: "Built production microservices and webhook endpoints", weight: 0.8 },
          { skill: "Node.js", tier: "demonstrated", evidence: "Demonstrated in secondary backend services", weight: 0.7 },
        ],
        partial: [
          { skill: "CI/CD Pipelines", tier: "partial", evidence: "Mentioned on resume, but GitHub shows limited workflow yaml files", weight: 0.6 },
          { skill: "Redis", tier: "partial", evidence: "Listed under technologies without dedicated repository implementation", weight: 0.5 },
        ],
        missing: [
          { skill: "Docker", tier: "missing", evidence: "Required for containerized deployment; 0 evidence on resume/GitHub", weight: 0.8 },
          { skill: "Kubernetes", tier: "missing", evidence: "Required for cluster orchestration; not found in profile", weight: 0.7 },
        ],
        differentiators: [
          { skill: "Solidity / EVM", tier: "differentiator", evidence: "Candidate possesses blockchain experience beyond standard role scope", weight: 0.0 },
        ],
      },
      explanation: "Score calculation: (0.9*1.0 + 0.8*1.0 + 0.8*1.0 + 0.7*1.0 + 0.6*0.5 + 0.5*0.5) / 4.7 * 100 = 74.4% match",
      verificationNotes: [
        "Python & PostgreSQL confirmed with multiple active repositories",
        "Docker & Kubernetes flagged as critical missing skills for mid-level backend role",
      ],
    };
  }

  // Mock for Prompt 3: Project Generator
  if (sys.includes("generate one specific, buildable project")) {
    return {
      projects: [
        {
          skillGap: "Docker",
          projectTitle: "Containerized Microservices Chat App",
          description: "Build a real-time multi-room messaging platform with isolated auth, chat, and notification containers orchestrated via Docker Compose.",
          techStack: ["Node.js", "Docker", "Docker Compose", "Redis", "WebSockets"],
          estimatedHours: 16,
          learningOutcomes: [
            "Author optimized multi-stage Dockerfiles with layer caching",
            "Configure Docker Compose bridge networks with Redis & PostgreSQL services",
            "Implement container health checks, auto-restart policies, and environment secret handling",
          ],
          difficulty: "intermediate",
        },
        {
          skillGap: "Kubernetes",
          projectTitle: "Cloud-Native Microservices Mesh Deployment",
          description: "Deploy a high-availability microservices application to a local Minikube/Kind cluster with ingress routing, configmaps, and pod auto-scaling.",
          techStack: ["Kubernetes", "Minikube", "Helm", "Nginx Ingress"],
          estimatedHours: 20,
          learningOutcomes: [
            "Write production-grade Kubernetes Deployment and Service manifests",
            "Set up Horizontal Pod Autoscaling (HPA) based on CPU/memory limits",
            "Configure Ingress controllers and TLS termination rules",
          ],
          difficulty: "advanced",
        },
      ],
    };
  }

  return { success: true, mode: "local_mock" };
}

/**
 * Call LLM with automatic local fallback when API key is not configured or fails
 */
export async function callLLMRaw(options: LLMCallOptions): Promise<unknown> {
  const { systemPrompt, userPrompt, temperature = 0.3 } = options;
  const apiKey = process.env.OPENROUTER_API_KEY;

  const isConfigured = apiKey && apiKey.trim().length > 0 && !apiKey.includes("your_openrouter_api_key_here") && apiKey !== "dummy-build-key";

  if (!isConfigured) {
    console.log("[OpenRouter] Using local mock provider for testing (no API key configured)");
    return getLocalMockResponse(systemPrompt, userPrompt);
  }

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

      return JSON.parse(cleanContent.trim());
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `[OpenRouter] Call attempt ${attempt + 1} failed: ${lastError.message}`
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  console.warn("[OpenRouter] Falling back to local mock engine after API failure:", lastError?.message);
  return getLocalMockResponse(systemPrompt, userPrompt);
}

/**
 * Call the LLM, parse JSON, and validate against a Zod schema.
 */
export async function callLLM<T>(
  options: LLMCallOptions,
  schema: ZodSchema<T>
): Promise<T> {
  const raw = await callLLMRaw(options);
  const validated = schema.parse(raw);
  return validated;
}
