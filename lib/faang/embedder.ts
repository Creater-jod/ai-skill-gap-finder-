// Runtime embedder using @xenova/transformers for all-MiniLM-L6-v2 (384-dim)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelinePromise: Promise<any> | null = null;

export async function getEmbeddingPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      try {
        const { pipeline } = await import('@xenova/transformers');
        return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      } catch (err) {
        console.warn('Could not load @xenova/transformers at runtime:', err);
        return null;
      }
    })();
  }
  return pipelinePromise;
}

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const embedder = await getEmbeddingPipeline();
    if (!embedder) return null;

    // Truncate text if excessively long to prevent token overflow
    const trimmed = text.slice(0, 2000);
    const output = await embedder(trimmed, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('Error during runtime embedding:', err);
    return null;
  }
}
