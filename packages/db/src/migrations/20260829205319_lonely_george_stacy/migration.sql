CREATE TABLE "workspace_invitations" (
	"id" text PRIMARY KEY,
	"workspace_id" text NOT NULL,
	"invited_user_id" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_id_idx" ON "workspace_invitations" ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invitations_invited_user_id_idx" ON "workspace_invitations" ("invited_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_pending_unique" ON "workspace_invitations" ("workspace_id","invited_user_id") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications" ("user_id","is_read");--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_user_id_users_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_user_id_users_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;