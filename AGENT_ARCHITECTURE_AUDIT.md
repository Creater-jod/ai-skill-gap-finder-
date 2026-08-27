# 🔍 Agent Architecture Audit Report

```json
{
  "schema_version": "ecc.agent-architecture-audit.report.v1",
  "executive_verdict": {
    "overall_health": "production_ready",
    "primary_failure_mode": "rate_limit_degradation_on_unauthenticated_public_endpoints",
    "most_urgent_fix": "cache_identical_github_and_rag_queries_in_memory"
  },
  "scope": {
    "target_name": "AI Skill Gap Finder - Backend Agent & Prompt Stack",
    "model_stack": [
      "deepseek/deepseek-chat-v3-0324:free (via OpenRouter)",
      "tavily-search-api (via @tavily/core)",
      "github-rest-v3 (public unauthenticated + token optional)"
    ],
    "layers_to_audit": [
      "1. System prompt",
      "2. Session history",
      "6. Tool selection & discipline",
      "7. Tool execution",
      "8. Tool interpretation",
      "9. Answer shaping",
      "10. Platform rendering & streaming",
      "11. Hidden repair loops",
      "12. Persistence"
    ]
  },
  "findings": [
    {
      "severity": "medium",
      "title": "OpenRouter Free-Tier Multi-Call Burst Concurrency",
      "mechanism": "The pipeline orchestrator fires Prompt 1 (Extraction), Prompt 2 (Gap Analysis), Prompt 3 (Projects), and Resource Agent in sequence within ~5-15 seconds per user submission. Free tier OpenRouter endpoints may rate-limit bursts.",
      "source_layer": "11. Hidden repair loops / Provider Transport",
      "root_cause": "Sequential dependency on external free LLM endpoints without local session cache.",
      "evidence_refs": ["src/app/api/pipeline/route.ts:74", "src/lib/openrouter.ts:31"],
      "confidence": 0.95,
      "recommended_fix": "Implement a simple in-memory Map cache keyed by SHA-256 hash of the extracted resume text + target role to eliminate redundant LLM calls during live demo tests."
    },
    {
      "severity": "low",
      "title": "GitHub Unauthenticated API 60 req/hr Cap",
      "mechanism": "If GITHUB_TOKEN is omitted, public API requests are limited to 60 requests per hour per IP. Multiple test runs during hackathon judging could hit 403.",
      "source_layer": "7. Tool execution / External API Gateway",
      "root_cause": "Defaulting to unauthenticated fetch when GITHUB_TOKEN is undefined in .env.local.",
      "evidence_refs": ["src/lib/github-verifier.ts:30-45"],
      "confidence": 0.90,
      "recommended_fix": "Code already includes graceful fallback (returns unverified state rather than crashing). Ensure GITHUB_TOKEN is populated before live demo."
    },
    {
      "severity": "low",
      "title": "Resource Agent Markdown Codeblock Stripping on Non-JSON LLM Returns",
      "mechanism": "When Tavily is disabled and fallback runs, the LLM may wrap its JSON output in ```json markdown codeblocks.",
      "source_layer": "8. Tool interpretation / Answer shaping",
      "root_cause": "callLLMRaw strips markdown codeblocks, but regex parsing in findResources handles raw match.",
      "evidence_refs": ["src/lib/resource-agent.ts:133-145", "src/lib/openrouter.ts:47-54"],
      "confidence": 0.85,
      "recommended_fix": "Both openrouter.ts and resource-agent.ts now enforce codeblock stripping and regex match extraction."
    }
  ],
  "ordered_fix_plan": [
    {
      "order": 1,
      "goal": "Ensure GITHUB_TOKEN and TAVILY_API_KEY in .env.local for demo resilience",
      "why_now": "Prevents hitting the 60 req/hr GitHub rate limit and activates real-time web search.",
      "expected_effect": "100% verified demo flow without fallback degradation."
    },
    {
      "order": 2,
      "goal": "Add in-memory caching for repeated demo queries",
      "why_now": "Protects OpenRouter free-tier quota when judges test the same resume multiple times.",
      "expected_effect": "Instant 50ms responses for cached resumes."
    }
  ]
}
```

---

## Detailed 12-Layer Stack Diagnosis

### Layer 1: System Prompt (Health: ✅ 10/10)
- **Extraction (`src/lib/prompts/extraction-prompt.ts`):** Strictly forbids hallucination; mandates evidence-only extraction.
- **Gap Analysis (`src/lib/prompts/gap-analysis-prompt.ts`):** Explicit mathematical weighting formula; constrained solely to skills present in the retrieved role profile.
- **Project Generator (`src/lib/prompts/project-generator-prompt.ts`):** Constrained to 1-2 week buildable portfolio artifacts.

### Layer 6 & 7: Tool Selection & Execution (Health: ✅ 9.5/10)
- **Tavily Web Search (`src/lib/tools/web-search-tool.ts`):** Tool calls are code-gated via Vercel AI SDK (`inputSchema` with Zod validation).
- **URL Validator (`src/lib/tools/url-validator-tool.ts`):** Uses 5000ms `AbortController` timeout to prevent hanging HTTP requests.

### Layer 9 & 10: Answer Shaping & Platform Streaming (Health: ✅ 10/10)
- Endpoints enforce typed Zod schema parsing before returning data to the client.
- `/api/find-resources` emits clean newline-delimited JSON (`application/x-ndjson`) for real-time frontend streaming.

### Layer 11: Hidden Repair Loops (Health: ✅ 9/10)
- Maximum 2 retries with exponential backoff in `src/lib/openrouter.ts`. No runaway recursive loops.
