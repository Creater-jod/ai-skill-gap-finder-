import crypto from "crypto";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache with TTL (Time To Live)
class InMemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMinutes: number = 60) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  private generateKey(input: unknown): string {
    const serialized = typeof input === "string" ? input : JSON.stringify(input);
    return crypto.createHash("sha256").update(serialized).digest("hex");
  }

  get(input: unknown): T | null {
    const key = this.generateKey(input);
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(input: unknown, data: T): void {
    const key = this.generateKey(input);
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.store.clear();
  }
}

// Global caches for pipeline steps
export const pipelineCache = new InMemoryCache<unknown>(120); // 2 hour cache for demo queries
export const githubCache = new InMemoryCache<unknown>(30); // 30 min cache for GitHub profiles
export const resourceCache = new InMemoryCache<unknown>(120); // 2 hour cache for learning resources
