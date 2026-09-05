import type { AppRouteHandler } from "#/lib/types";
import type { UploadRoute, GetRoute } from "./routes";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import { MAX_FILE_SIZE } from "@dotion/shared/files/schema";

export const uploadHandler: AppRouteHandler<UploadRoute> = async (c) => {
  const { id: workspaceId, pageId } = c.req.valid("param");

  const contentLengthHeader =
    c.req.header("content-length") || c.req.header("x-file-size");
  const contentLength = contentLengthHeader
    ? Number(contentLengthHeader)
    : undefined;

  if (contentLength !== undefined && contentLength > MAX_FILE_SIZE) {
    const maxMb = MAX_FILE_SIZE / (1024 * 1024);
    return c.json(
      errorResponseJson(
        `File size exceeds maximum allowed limit of ${maxMb}MB`,
      ),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const rawStream = c.req.raw.body;
  if (!rawStream) {
    return c.json(
      errorResponseJson("A valid binary stream payload must be provided"),
      HttpStatusCodes.BAD_REQUEST,
    );
  }

  const rawFileName = c.req.header("x-file-name");
  const filename = rawFileName ? decodeURIComponent(rawFileName) : "file";
  const mimeType = c.req.header("content-type") || "application/octet-stream";

  const result = await c.var.services.storage.uploadStream({
    workspaceId,
    pageId,
    stream: rawStream,
    filename,
    mimeType,
    size: contentLength,
    maxBytes: MAX_FILE_SIZE,
  });

  if (result.isErr()) {
    return result.error.match({
      StorageError: (err) =>
        c.json(
          errorResponseJson(err.message),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};

export const getHandler: AppRouteHandler<GetRoute> = async (c) => {
  const { id: workspaceId, pageId, fileKey } = c.req.valid("param");

  const result = await c.var.services.storage.getPageFile(
    workspaceId,
    pageId,
    fileKey,
    {
      range: c.req.raw.headers,
      onlyIf: c.req.raw.headers,
    },
  );

  if (result.isErr()) {
    return result.error.match({
      StorageError: (err) =>
        c.json(
          errorResponseJson(err.message),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  const object = result.value;
  if (!object) {
    return c.json(
      errorResponseJson("File not found"),
      HttpStatusCodes.NOT_FOUND,
    );
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  headers.set("cache-control", "public, max-age=31536000, immutable");

  // Handle conditional request (304 Not Modified)
  if ("body" in object === false || !object.body) {
    return new Response(null, {
      status: HttpStatusCodes.NOT_MODIFIED,
      headers,
    });
  }

  // Handle Range Requests (206 Partial Content)
  if (object.range) {
    if (
      "offset" in object.range &&
      typeof object.range.offset === "number" &&
      typeof object.range.length === "number"
    ) {
      const start = object.range.offset;
      const end = object.range.offset + object.range.length - 1;
      headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
    } else if (
      "suffix" in object.range &&
      typeof object.range.suffix === "number"
    ) {
      const start = object.size - object.range.suffix;
      const end = object.size - 1;
      headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
    }

    return new Response(object.body, {
      status: HttpStatusCodes.PARTIAL_CONTENT,
      headers,
    });
  }

  return new Response(object.body, {
    status: HttpStatusCodes.OK,
    headers,
  });
};
