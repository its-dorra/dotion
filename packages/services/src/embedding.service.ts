import { Result, TaggedError } from "better-result";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

export class EmbeddingError extends TaggedError("EmbeddingError")<{
  message: string;
  cause?: Error;
}> {}

export class EmbeddingService {
  private readonly googleClient: ReturnType<
    typeof createGoogleGenerativeAI
  > | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.googleClient = createGoogleGenerativeAI({ apiKey });
    }
  }

  async embedText(text: string): Promise<Result<number[], EmbeddingError>> {
    try {
      if (!this.googleClient) {
        return Result.err(
          new EmbeddingError({
            message: "EmbeddingService: GEMINI_API_KEY is missing",
          }),
        );
      }

      const model = this.googleClient.textEmbeddingModel(
        "gemini-embedding-001",
      );
      const { embedding } = await embed({
        model,
        value: text,
      });

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
  ): Promise<Result<number[][], EmbeddingError>> {
    try {
      if (texts.length === 0) {
        return Result.ok([]);
      }

      if (!this.googleClient) {
        return Result.err(
          new EmbeddingError({
            message: "EmbeddingService: GEMINI_API_KEY is missing",
          }),
        );
      }

      const model = this.googleClient.textEmbeddingModel(
        "gemini-embedding-001",
      );
      const { embeddings } = await embedMany({
        model,
        values: texts,
      });

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
