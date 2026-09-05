import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { createErrorObjectSchema } from "./utils";

export const okSchema = createErrorObjectSchema(HttpStatusPhrases.OK);

export const createdSchema = createErrorObjectSchema(HttpStatusPhrases.CREATED);

export const notFoundErrorSchema = createErrorObjectSchema(
  HttpStatusPhrases.NOT_FOUND,
);

export const unauthorizedSchema = createErrorObjectSchema(
  HttpStatusPhrases.UNAUTHORIZED,
);

export const forbiddenSchema = createErrorObjectSchema(
  HttpStatusPhrases.FORBIDDEN,
);

export const internalServerErrorSchema = createErrorObjectSchema(
  HttpStatusPhrases.INTERNAL_SERVER_ERROR,
);

export const badRequestErrorSchema = createErrorObjectSchema(
  HttpStatusPhrases.BAD_REQUEST,
);

export const tooManyRequestsSchema = createErrorObjectSchema(
  HttpStatusPhrases.TOO_MANY_REQUESTS,
);
