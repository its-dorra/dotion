import { Result, TaggedError } from "better-result";
import {
  createGoogleGenerativeAI,
  type GoogleEmbeddingModelOptions,
} from "@ai-sdk/google";
import { embed, embedMany } from "ai";

export class EmbeddingError extends TaggedError("EmbeddingError")<{
  message: string;
  cause?: Error;
}> {}

export type EmbeddingTaskType = NonNullable<
  GoogleEmbeddingModelOptions["taskType"]
>;

const MAX_EMBED_CHARS = 7500;

function truncateForEmbedding(text: string): string {
  if (text.length <= MAX_EMBED_CHARS) return text;
  console.warn(
    `EmbeddingService: truncating text from ${text.length} to ${MAX_EMBED_CHARS} chars for embedding limit.`,
  );
  return text.slice(0, MAX_EMBED_CHARS);
}

export class EmbeddingService {
  private readonly googleClient: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(apiKey: string) {
    this.googleClient = createGoogleGenerativeAI({ apiKey });
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

  async embedText(
    text: string,
    taskType: EmbeddingTaskType = "RETRIEVAL_QUERY",
  ): Promise<Result<number[], EmbeddingError>> {
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

  async embedBatch(
    texts: string[],
    taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
  ): Promise<Result<number[][], EmbeddingError>> {
    try {
      if (texts.length === 0) {
        return Result.ok([]);
      }

      const sanitizedTexts = texts.map(truncateForEmbedding);
      const model = this.googleClient.embedding("gemini-embedding-001");

      const { embeddings } = await this.withRetry(() =>
        embedMany({
          model,
          values: sanitizedTexts,
          providerOptions: {
            google: {
              outputDimensionality: 1536,
              taskType,
            } satisfies GoogleEmbeddingModelOptions,
          },
        }),
      );

      return Result.ok(embeddings);
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
