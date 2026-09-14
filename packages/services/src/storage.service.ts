import { Result } from "better-result";
import type { WorkspaceId, PageId } from "@dotion/shared/ids";
import type { FileUploadResponse } from "@dotion/shared/files/types";

import { StorageError } from "@dotion/shared/files/errors";
import type { StorageUploadStreamInput } from "@dotion/shared/files/types";
export type { StorageError, StorageUploadStreamInput };

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

      if (input.size === undefined || Number.isNaN(input.size)) {
        return Result.err(
          new StorageError({
            message: "File size must be specified for upload",
          }),
        );
      }

      const { readable, writable } = new FixedLengthStream(input.size);

      const [, r2Object] = await Promise.all([
        input.stream.pipeTo(writable),
        this.r2.put(storageKey, readable, {
          httpMetadata: {
            contentType: input.mimeType,
          },
          customMetadata: {
            workspaceId: input.workspaceId,
            pageId: input.pageId,
            originalName: input.filename,
            size: String(input.size),
            uploadedAt: new Date().toISOString(),
          },
        }),
      ]);

      const finalSize = r2Object?.size ?? input.size;
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

  async getFile({
    storageKey,
    options,
  }: {
    storageKey: string;
    options?: R2GetOptions;
  }): Promise<Result<R2ObjectBody | R2Object | null, StorageError>> {
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

  async getPageFile({
    workspaceId,
    pageId,
    fileKey,
    options,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    fileKey: string;
    options?: R2GetOptions;
  }): Promise<Result<R2ObjectBody | R2Object | null, StorageError>> {
    const sanitizedKey = fileKey.replace(/(\.\.[\/\\])+/g, "");
    const storageKey = `workspaces/${workspaceId}/pages/${pageId}/${sanitizedKey}`;
    return this.getFile({ storageKey, options });
  }

  async deletePageFiles(params: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<{ deletedCount: number }, StorageError>> {
    try {
      const prefix = `workspaces/${params.workspaceId}/pages/${params.pageId}/`;
      let truncated = true;
      let cursor: string | undefined;
      let deletedCount = 0;

      while (truncated) {
        const list = await this.r2.list({
          prefix,
          cursor,
        });

        if (list.objects.length > 0) {
          const keys = list.objects.map((obj) => obj.key);
          await this.r2.delete(keys);
          deletedCount += keys.length;
        }

        truncated = list.truncated;
        cursor = list.truncated ? list.cursor : undefined;
      }

      return Result.ok({ deletedCount });
    } catch (error: unknown) {
      console.error("StorageService.deletePageFiles error:", error);
      return Result.err(
        new StorageError({
          message: "Failed to delete page files from storage",
          cause: error,
        }),
      );
    }
  }
}
