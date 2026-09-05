import { Result, TaggedError } from "better-result";
import type { WorkspaceId, PageId } from "@dotion/shared/ids";
import type { FileUploadResponse } from "@dotion/shared/files/types";

export class StorageError extends TaggedError("StorageError")<{
  message: string;
  cause?: unknown;
}> {}

export interface StorageUploadStreamInput {
  workspaceId: WorkspaceId;
  pageId: PageId;
  stream: ReadableStream<Uint8Array>;
  filename: string;
  mimeType: string;
  size?: number;
  maxBytes?: number;
}

export class StorageService {
  constructor(private readonly r2: R2Bucket) {}

  async uploadStream(
    input: StorageUploadStreamInput,
  ): Promise<Result<FileUploadResponse, StorageError>> {
    try {
      const sanitizedFilename =
        input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "") ||
        "file";
      const fileUid = crypto.randomUUID();
      const fileKey = `${fileUid}-${sanitizedFilename}`;
      const storageKey = `workspaces/${input.workspaceId}/pages/${input.pageId}/${fileKey}`;

      let bytesRead = 0;
      const streamToUpload = input.maxBytes
        ? input.stream.pipeThrough(
            new TransformStream<Uint8Array, Uint8Array>({
              transform(chunk, controller) {
                bytesRead += chunk.byteLength;
                if (input.maxBytes && bytesRead > input.maxBytes) {
                  controller.error(
                    new Error(
                      `File size exceeded maximum limit of ${input.maxBytes} bytes`,
                    ),
                  );
                  return;
                }
                controller.enqueue(chunk);
              },
            }),
          )
        : input.stream;

      const r2Object = await this.r2.put(storageKey, streamToUpload, {
        httpMetadata: {
          contentType: input.mimeType,
        },
        customMetadata: {
          workspaceId: input.workspaceId,
          pageId: input.pageId,
          originalName: input.filename,
          size: String(input.size ?? bytesRead),
          uploadedAt: new Date().toISOString(),
        },
      });

      const finalSize = r2Object?.size ?? input.size ?? bytesRead;
      const url = `/api/v1/workspaces/${input.workspaceId}/pages/${input.pageId}/files/${fileKey}`;

      return Result.ok({
        url,
        key: fileKey,
        name: input.filename,
        size: finalSize,
        mimeType: input.mimeType,
        createdAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error("StorageService.uploadStream error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to upload file to storage";
      return Result.err(
        new StorageError({
          message,
          cause: error,
        }),
      );
    }
  }

  async getFile(
    storageKey: string,
    options?: R2GetOptions,
  ): Promise<Result<R2ObjectBody | R2Object | null, StorageError>> {
    try {
      const object = await this.r2.get(storageKey, options);
      return Result.ok(object);
    } catch (error: unknown) {
      console.error("StorageService.getFile error:", error);
      return Result.err(
        new StorageError({
          message: "Failed to retrieve file from storage",
          cause: error,
        }),
      );
    }
  }

  async getPageFile(
    workspaceId: WorkspaceId,
    pageId: PageId,
    fileKey: string,
    options?: R2GetOptions,
  ): Promise<Result<R2ObjectBody | R2Object | null, StorageError>> {
    const sanitizedKey = fileKey.replace(/(\.\.[\/\\])+/g, "");
    const storageKey = `workspaces/${workspaceId}/pages/${pageId}/${sanitizedKey}`;
    return this.getFile(storageKey, options);
  }
}
