import { TaggedError } from "better-result";

export class DatabaseError extends TaggedError("DatabaseError")<{
  message: string;
}> {}

export class ConnectionError extends TaggedError("ConnectionError")<{
  message: string;
}> {}

export class NotFoundError extends TaggedError("NotFoundError")<{
  message: string;
}> {}

export class UniqueConstraintViolationError extends TaggedError(
  "UniqueConstraintViolationError",
)<{
  message: string;
  constraint?: string;
}> {}

export class ForeignKeyViolationError extends TaggedError(
  "ForeignKeyViolationError",
)<{
  message: string;
  constraint?: string;
}> {}

export class InvalidDataError extends TaggedError("InvalidDataError")<{
  message: string;
}> {}
