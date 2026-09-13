import { TaggedError } from "better-result";

export class StorageError extends TaggedError("StorageError")<{
  message: string;
  cause?: unknown;
}> {}
