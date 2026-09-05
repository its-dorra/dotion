import { z } from "zod";
import { NotificationSchema, notificationId } from "./schema";
import { workspaceId } from "../workspaces/schema";

export const UserWsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("notification.created"),
    payload: NotificationSchema,
  }),
  z.object({
    type: z.literal("notification.read"),
    payload: z.object({
      notificationId,
    }),
  }),
  z.object({
    type: z.literal("notification.all_read"),
    payload: z.object({
      workspaceId: workspaceId.optional(),
    }),
  }),
]);

export type UserWsMessage = z.infer<typeof UserWsMessageSchema>;
