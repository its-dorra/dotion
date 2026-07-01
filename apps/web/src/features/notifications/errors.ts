import { TaggedError } from "better-result";

export class NotificationNotFoundError extends TaggedError(
  "NotificationNotFoundError",
)<{
  message: string;
  notificationId: string;
}>() {}
