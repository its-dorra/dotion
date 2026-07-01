import { TaggedError } from "better-result";

export class PageNotFoundError extends TaggedError(
  "PageNotFoundError",
)<{
  message: string;
  pageId: string;
}>() {}

export class PageAlreadyInTrashError extends TaggedError(
  "PageAlreadyInTrashError",
)<{
  message: string;
  pageId: string;
}>() {}

export class InsufficientPagePermissionError extends TaggedError(
  "InsufficientPagePermissionError",
)<{
  message: string;
  requiredRole: "commenter" | "editor";
}>() {}

export class PageMemberAlreadyExistsError extends TaggedError(
  "PageMemberAlreadyExistsError",
)<{
  message: string;
  email: string;
}>() {}
