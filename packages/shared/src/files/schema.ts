import { z } from "zod";
import { workspaceId, pageId, fileId } from "../ids";

export { fileId };

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
] as const;

export const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/webm",
] as const;

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/json",
] as const;

export const ALL_ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
] as const;

export const FileUploadResponseSchema = z.object({
  url: z.string(),
  key: z.string(),
  name: z.string(),
  size: z.number(),
  mimeType: z.string(),
  createdAt: z.string(),
});

export const UploadFileParamsSchema = z.object({
  id: workspaceId,
  pageId: pageId,
});

export const GetFileParamsSchema = z.object({
  id: workspaceId,
  pageId: pageId,
  fileKey: z.string().min(1),
});
