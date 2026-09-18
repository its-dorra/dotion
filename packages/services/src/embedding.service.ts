import { Result } from "better-result";
import {
  createGoogleGenerativeAI,
  type GoogleEmbeddingModelOptions,
} from "@ai-sdk/google";
import { embed, embedMany } from "ai";

import { EmbeddingError } from "@dotion/shared/ai/errors";
import type { EmbeddingTaskType } from "@dotion/shared/ai/types";
export type { EmbeddingError, EmbeddingTaskType };

const MAX_EMBED_CHARS = 3200;

function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  console.warn(
    `EmbeddingService: truncating text from ${text.length} to ~${MAX_EMBED_CHARS} chars for embedding limit.`,
  );

  // Try to cut at the last sentence boundary within the limit
  const candidate = text.slice(0, MAX_EMBED_CHARS);
  const lastSentenceEnd = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf(".\n"),
    candidate.lastIndexOf("? "),
    candidate.lastIndexOf("!\n"),
  );

  // Only use sentence boundary if it's within the last 400 chars (not too far back)
  if (lastSentenceEnd > MAX_EMBED_CHARS - 400) {
    return candidate.slice(0, lastSentenceEnd + 1);
  }

  return candidate;
}

export class EmbeddingService {
  private readonly googleClient: ReturnType<typeof createGoogleGenerativeAI>;

  constructor() {
    this.googleClient = createGoogleGenerativeAI();
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let delayMs = 500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        const jitter = Math.random() * 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
        delayMs *= 2;
      }
    }
    throw new Error("Unreachable");
  }

  async embedText({
    text,
    taskType = "RETRIEVAL_QUERY",
  }: {
    text: string;
    taskType?: EmbeddingTaskType;
  }): Promise<Result<number[], EmbeddingError>> {
    try {
      const sanitizedText = truncateForEmbedding(text);
      const model = this.googleClient.embedding("gemini-embedding-001");

      const { embedding } = await this.withRetry(() =>
        embed({
          model,
          value: sanitizedText,
          providerOptions: {
            google: {
              outputDimensionality: 1536,
              taskType,
            } satisfies GoogleEmbeddingModelOptions,
          },
        }),
      );

      return Result.ok(embedding);
    } catch (error) {
      console.error("EmbeddingService.embedText error:", error);
      return Result.err(
        new EmbeddingError({
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate embedding",
          cause: error instanceof Error ? error : undefined,
        }),
      );
    }
  }

  async embedBatch({
    texts,
    taskType = "RETRIEVAL_DOCUMENT",
  }: {
    texts: string[];
    taskType?: EmbeddingTaskType;
  }): Promise<Result<number[][], EmbeddingError>> {
    try {
      if (texts.length === 0) {
        return Result.ok([]);
      }

      const sanitizedTexts = texts.map(truncateForEmbedding);
      const model = this.googleClient.embedding("gemini-embedding-001");

      const BATCH_CHUNK_SIZE = 30;
      const slices: string[][] = [];
      for (let i = 0; i < sanitizedTexts.length; i += BATCH_CHUNK_SIZE) {
        slices.push(sanitizedTexts.slice(i, i + BATCH_CHUNK_SIZE));
      }

      const CONCURRENCY = 3;
      const batchResults: number[][][] = new Array(slices.length);

      for (let i = 0; i < slices.length; i += CONCURRENCY) {
        const concurrentSlices = slices.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.all(
          concurrentSlices.map((batchSlice) =>
            this.withRetry(() =>
              embedMany({
                model,
                values: batchSlice,
                providerOptions: {
                  google: {
                    outputDimensionality: 1536,
                    taskType,
                  } satisfies GoogleEmbeddingModelOptions,
                },
              }),
            ).then((res) => res.embeddings),
          ),
        );
        chunkResults.forEach((embs, idx) => {
          batchResults[i + idx] = embs;
        });
      }

      const allEmbeddings = batchResults.flat();
      return Result.ok(allEmbeddings);
    } catch (error) {
      console.error("EmbeddingService.embedBatch error:", error);
      return Result.err(
        new EmbeddingError({
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate batch embeddings",
          cause: error instanceof Error ? error : undefined,
        }),
      );
    }
  }
}
