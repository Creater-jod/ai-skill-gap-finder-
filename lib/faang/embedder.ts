// Runtime embedder using @xenova/transformers for all-MiniLM-L6-v2 (384-dim)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelinePromise: Promise<any> | null = null;

export async function getEmbeddingPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      try {
        const { pipeline, env } = await import('@xenova/transformers');
        if (env) {
          env.allowLocalModels = false;
          env.useBrowserCache = false;
        }
        return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      } catch (err) {
        console.warn('Could not load @xenova/transformers at runtime:', (err as Error).message);
        return null;
      }
    })();
  }
  return pipelinePromise;
}

export async function embedText(text: string): Promise<number[] | null> {
  try {
    // 2.5s maximum timeout to prevent serverless execution hangs
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const embedder = await Promise.race([getEmbeddingPipeline(), timeoutPromise]);
    if (!embedder) return null;

    // Truncate text if excessively long to prevent token overflow
    const trimmed = text.slice(0, 2000);
    const output = await embedder(trimmed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('Runtime embedding fallback to lexical matcher:', (err as Error).message);
    return null;
  }
}

