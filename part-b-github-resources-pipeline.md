# 🅱️ Part B: GitHub Verification + Agentic Resources + Pipeline Orchestrator (Build Independently)

> **What this covers:** GitHub verification (Layer 3), Agentic Resource Finder (Tavily + URL validation), Pipeline Orchestrator  
> **Time estimate:** ~2 hours  
> **Depends on Part A:** Only imports types from `@/types` and `callLLM` from `@/lib/openrouter`  
> **Can test independently:** Yes — mock the extraction data and role profile

---

## Step 0: Prerequisites

```bash
# You must have BEFORE starting Part B:
# 1. Part A's types file (src/types/index.ts) must exist
# 2. Part A's OpenRouter client (src/lib/openrouter.ts) must exist
# 3. OpenRouter API key in .env.local
# 4. Tavily API key from app.tavily.com (sign up → free tier → copy API key)
```

### Install Part B dependencies:
```bash
cd "c:\Users\NIKIL\Documents\HACKTHON\ai gap finder for resume"
npm install ai @ai-sdk/openai @tavily/core
```

### Add to `.env.local`:
```env
TAVILY_API_KEY=your_tavily_api_key_here
GITHUB_TOKEN=optional_for_higher_rate_limits
```

---

## Step 1: GitHub Verifier Utility

> **File:** `src/lib/github-verifier.ts`  
> **Purpose:** Fetch public GitHub data and cross-check against resume claims.

```typescript
import { GitHubVerification } from "@/types";

const GITHUB_API = "https://api.github.com";
const STALE_THRESHOLD_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

interface GitHubRepo {
  name: string;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  size: number;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SkillGapFinder-Hackathon",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      headers: getHeaders(),
    });

    if (res.status === 404) return null;
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        console.error("GitHub API rate limit exceeded");
        return null;
      }
    }
    if (!res.ok) {
      console.error(`GitHub API error: ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error("GitHub fetch error:", (err as Error).message);
    return null;
  }
}

function normalizeSkill(skill: string): string[] {
  const lower = skill.toLowerCase().trim();

  const aliases: Record<string, string[]> = {
    javascript: ["javascript", "js"],
    typescript: ["typescript", "ts"],
    python: ["python", "py"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp"],
    react: ["react", "reactjs", "react.js"],
    "react native": ["react-native", "react native"],
    "node.js": ["javascript", "typescript", "nodejs", "node"],
    nodejs: ["javascript", "typescript", "nodejs", "node"],
    "next.js": ["nextjs", "next.js", "next", "react", "typescript", "javascript"],
    nextjs: ["nextjs", "next.js", "next", "react", "typescript", "javascript"],
    "vue.js": ["vue", "vuejs"],
    vue: ["vue", "vuejs"],
    angular: ["angular", "angularjs", "typescript"],
    django: ["django", "python"],
    flask: ["flask", "python"],
    fastapi: ["fastapi", "python"],
    "spring boot": ["java", "spring-boot", "spring"],
    spring: ["java", "spring-boot", "spring"],
    docker: ["docker", "dockerfile"],
    kubernetes: ["kubernetes", "k8s"],
    terraform: ["terraform", "hcl"],
    rust: ["rust"],
    go: ["go", "golang"],
    golang: ["go", "golang"],
    java: ["java"],
    ruby: ["ruby", "rails"],
    php: ["php", "laravel"],
    swift: ["swift"],
    kotlin: ["kotlin"],
    solidity: ["solidity"],
    sql: ["sql", "plsql", "tsql"],
    postgresql: ["sql", "postgresql", "postgres"],
    mongodb: ["mongodb"],
    redis: ["redis"],
    "machine learning": ["machine-learning", "ml", "tensorflow", "pytorch", "python"],
    "deep learning": ["deep-learning", "tensorflow", "pytorch", "keras", "python"],
    aws: ["aws", "amazon-web-services"],
    gcp: ["gcp", "google-cloud"],
    azure: ["azure", "microsoft-azure"],
    graphql: ["graphql"],
    tailwind: ["tailwind", "tailwindcss", "css"],
    tailwindcss: ["tailwind", "tailwindcss", "css"],
    linux: ["shell", "bash", "linux"],
    bash: ["shell", "bash"],
    git: ["git"],
  };

  return aliases[lower] || [lower];
}

export async function verifyGitHub(
  username: string,
  claimedSkills: string[]
): Promise<GitHubVerification> {
  const profile = await githubFetch<{ public_repos: number }>(
    `/users/${username}`
  );

  if (!profile) {
    return {
      username,
      profileExists: false,
      repoCount: 0,
      totalCommits: 0,
      topLanguages: {},
      verified: [],
      unverified: claimedSkills,
      stale: [],
      unclaimed: [],
    };
  }

  const repos = await githubFetch<GitHubRepo[]>(
    `/users/${username}/repos?sort=updated&per_page=100&type=owner`
  );

  if (!repos || repos.length === 0) {
    return {
      username,
      profileExists: true,
      repoCount: 0,
      totalCommits: 0,
      topLanguages: {},
      verified: [],
      unverified: claimedSkills,
      stale: [],
      unclaimed: [],
    };
  }

  const events = await githubFetch<GitHubEvent[]>(
    `/users/${username}/events/public?per_page=100`
  );

  const languageCount: Record<string, number> = {};
  const languageLastActive: Record<string, Date> = {};
  const allTopics = new Set<string>();

  const nonForkedRepos = repos.filter((r) => !r.fork);

  for (const repo of nonForkedRepos) {
    if (repo.language) {
      const lang = repo.language.toLowerCase();
      languageCount[lang] = (languageCount[lang] || 0) + 1;

      const pushedDate = new Date(repo.pushed_at);
      if (!languageLastActive[lang] || pushedDate > languageLastActive[lang]) {
        languageLastActive[lang] = pushedDate;
      }
    }

    if (repo.topics && Array.isArray(repo.topics)) {
      for (const topic of repo.topics) {
        allTopics.add(topic.toLowerCase());
      }
    }
  }

  const pushEvents = (events || []).filter((e) => e.type === "PushEvent");
  const totalCommits = pushEvents.length;

  const now = Date.now();
  const verified: string[] = [];
  const unverified: string[] = [];
  const stale: string[] = [];

  for (const skill of claimedSkills) {
    const aliases = normalizeSkill(skill);
    let found = false;
    let isStale = false;

    for (const alias of aliases) {
      if (languageCount[alias]) {
        found = true;
        const lastActive = languageLastActive[alias];
        if (lastActive && now - lastActive.getTime() > STALE_THRESHOLD_MS) {
          isStale = true;
        }
        break;
      }

      if (allTopics.has(alias)) {
        found = true;
        break;
      }
    }

    if (found && !isStale) {
      verified.push(skill);
    } else if (found && isStale) {
      stale.push(skill);
    } else {
      unverified.push(skill);
    }
  }

  const claimedNormalized = new Set(
    claimedSkills.flatMap((s) => normalizeSkill(s))
  );
  const unclaimed: string[] = [];

  for (const lang of Object.keys(languageCount)) {
    if (!claimedNormalized.has(lang) && languageCount[lang] >= 2) {
      unclaimed.push(lang);
    }
  }

  const topLanguages: Record<string, number> = {};
  const sorted = Object.entries(languageCount).sort((a, b) => b[1] - a[1]);
  for (const [lang, count] of sorted.slice(0, 10)) {
    topLanguages[lang] = count;
  }

  return {
    username,
    profileExists: true,
    repoCount: nonForkedRepos.length,
    totalCommits,
    topLanguages,
    verified,
    unverified,
    stale,
    unclaimed,
  };
}
```

---

## Step 2: GitHub Verification API Route

> **File:** `src/app/api/verify-github/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { verifyGitHub } from "@/lib/github-verifier";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, claimedSkills } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'username' field." },
        { status: 400 }
      );
    }

    if (!claimedSkills || !Array.isArray(claimedSkills) || claimedSkills.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'claimedSkills' array." },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace(/^@/, "").trim();

    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Invalid GitHub username format." },
        { status: 400 }
      );
    }

    const verification = await verifyGitHub(cleanUsername, claimedSkills);

    return NextResponse.json(verification);
  } catch (err) {
    console.error("GitHub verify route error:", err);
    return NextResponse.json(
      {
        error: "Failed to verify GitHub profile.",
        details: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Agentic Resource Finder Core & Tools

> **Files:** `src/lib/tools/web-search-tool.ts`, `src/lib/tools/url-validator-tool.ts`, `src/lib/resource-agent.ts`, and `src/app/api/find-resources/route.ts`
