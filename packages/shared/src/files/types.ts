import { z } from "zod";
import {
  FileUploadResponseSchema,
  UploadFileParamsSchema,
  GetFileParamsSchema,
  ALL_ALLOWED_MEDIA_TYPES,
} from "./schema";
import type { FileId } from "../ids";

export type { FileId };

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;
export type UploadFileParams = z.infer<typeof UploadFileParamsSchema>;
export type GetFileParams = z.infer<typeof GetFileParamsSchema>;
export type AllowedMediaType = (typeof ALL_ALLOWED_MEDIA_TYPES)[number];
