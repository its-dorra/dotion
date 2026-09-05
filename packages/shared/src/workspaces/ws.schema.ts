import z from "zod";
import { pageId, PageSchema, AllPageRoleSchema } from "../pages/schema";
import {
  workspaceId,
  workspaceInvitationId,
  WorkspaceMemberDetailSchema,
  WorkspaceInvitationWithDetailsSchema,
} from "./schema";
import { userId } from "../ids";

export const WorkspaceWsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workspace.member_joined"),
    payload: z.object({
      workspaceId,
      invitationId: workspaceInvitationId.optional(),
      member: WorkspaceMemberDetailSchema,
    }),
  }),
  z.object({
    type: z.literal("workspace.member_removed"),
    payload: z.object({
      workspaceId,
      userId: z.string(),
    }),
  }),
  z.object({
    type: z.literal("workspace.invitation_created"),
    payload: WorkspaceInvitationWithDetailsSchema,
  }),
  z.object({
    type: z.literal("workspace.invitation_declined"),
    payload: z.object({
      workspaceId,
      invitationId: workspaceInvitationId,
    }),
  }),
  z.object({
    type: z.literal("workspace.invitation_cancelled"),
    payload: z.object({
      workspaceId,
      invitationId: workspaceInvitationId,
    }),
  }),
  z.object({
    type: z.literal("page.created"),
    payload: PageSchema.pick({
      id: true,
      icon: true,
      title: true,
      parentId: true,
      workspaceId: true,
    }),
  }),
  z.object({
    type: z.literal("document.title.changed"),
    payload: z.object({
      id: pageId,
      workspaceId: workspaceId,
      title: z.string(),
    }),
  }),
  z.object({
    type: z.literal("document.icon.changed"),
    payload: z.object({
      id: pageId,
      workspaceId: workspaceId,
      icon: z.string().nullable(),
    }),
  }),
  z.object({
    type: z.literal("document.cover.changed"),
    payload: z.object({
      id: pageId,
      workspaceId: workspaceId,
      cover: z.string().nullable(),
    }),
  }),
  z.object({
    type: z.literal("page.permission_updated"),
    payload: z.object({
      workspaceId,
      pageId,
      userId,
      role: AllPageRoleSchema,
    }),
  }),
]);
