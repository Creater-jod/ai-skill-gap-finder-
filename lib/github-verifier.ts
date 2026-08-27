import { GitHubVerification } from "@/types";
import { githubCache } from "@/lib/cache";

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      headers: getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 404) return null;
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        console.warn("[GitHub API] Rate limit reached. Gracefully falling back.");
        return null;
      }
    }
    if (!res.ok) {
      console.warn(`[GitHub API] Non-critical error: ${res.status} on ${endpoint}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("[GitHub API] Network failure or timeout:", (err as Error).message);
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
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  const uniqueClaimed = Array.from(
    new Set(
      claimedSkills
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.toLowerCase() !== "skill")
    )
  );
  const cacheKey = { username: cleanUsername, claimedSkills: uniqueClaimed };

  const cached = githubCache.get(cacheKey) as GitHubVerification | null;
  if (cached) {
    console.log(`[GitHub API] Cache hit for ${cleanUsername}`);
    return cached;
  }

  const profile = await githubFetch<{ public_repos: number }>(
    `/users/${cleanUsername}`
  );

  if (!profile) {
    const result: GitHubVerification = {
      username: cleanUsername,
      profileExists: false,
      repoCount: 0,
      totalCommits: 0,
      topLanguages: {},
      verified: [],
      unverified: uniqueClaimed,
      stale: [],
      unclaimed: [],
    };
    githubCache.set(cacheKey, result);
    return result;
  }

  const repos = await githubFetch<GitHubRepo[]>(
    `/users/${cleanUsername}/repos?sort=updated&per_page=100&type=owner`
  );

  if (!repos || repos.length === 0) {
    const result: GitHubVerification = {
      username: cleanUsername,
      profileExists: true,
      repoCount: 0,
      totalCommits: 0,
      topLanguages: {},
      verified: [],
      unverified: uniqueClaimed,
      stale: [],
      unclaimed: [],
    };
    githubCache.set(cacheKey, result);
    return result;
  }

  const events = await githubFetch<GitHubEvent[]>(
    `/users/${cleanUsername}/events/public?per_page=100`
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

  for (const skill of uniqueClaimed) {
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
    uniqueClaimed.flatMap((s) => normalizeSkill(s))
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

  const result: GitHubVerification = {
    username: cleanUsername,
    profileExists: true,
    repoCount: nonForkedRepos.length,
    totalCommits,
    topLanguages,
    verified: Array.from(new Set(verified)),
    unverified: Array.from(new Set(unverified)),
    stale: Array.from(new Set(stale)),
    unclaimed: Array.from(new Set(unclaimed)),
  };

  githubCache.set(cacheKey, result);
  return result;
}
