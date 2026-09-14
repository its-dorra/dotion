import type { UserId } from "@dotion/shared/users/types";
import type {
  Notification,
  NotificationId,
  CreateNotificationInput,
} from "@dotion/shared/notifications/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";
import type { AppDB, DBClient } from "../index";
import { notifications } from "../schema/notifications";
import { and, count, desc, eq } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError, NotFoundError } from "../errors";

export class NotificationsRepository {
  constructor(private readonly db: DBClient) {}

  async createNotification({
    input,
  }: {
    input: CreateNotificationInput;
  }): Promise<Result<Notification, DatabaseError>> {
    try {
      const [row] = await this.db
        .insert(notifications)
        .values({
          ...input,
        })
        .returning({
          id: notifications.id,
          userId: notifications.userId,
          metadata: notifications.metadata,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          updatedAt: notifications.updatedAt,
        });

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create notification" }),
        );
      }

      return Result.ok(row as unknown as Notification);
    } catch (e) {
      console.error("NotificationsRepository.createNotification error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to create notification" }),
      );
    }
  }

  async createNotificationTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateNotificationInput;
  }): Promise<Result<Notification, DatabaseError>> {
    try {
      const [row] = await tx
        .insert(notifications)
        .values({
          ...input,
        })
        .returning({
          id: notifications.id,
          userId: notifications.userId,
          metadata: notifications.metadata,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          updatedAt: notifications.updatedAt,
        });

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create notification" }),
        );
      }

      return Result.ok(row as unknown as Notification);
    } catch (e) {
      console.error("NotificationsRepository.createNotificationTx error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to create notification" }),
      );
    }
  }

  async getByUserId({
    userId,
    pagination,
  }: {
    userId: UserId;
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<Notification>, DatabaseError>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const countQuery = this.db
        .select({ total: count() })
        .from(notifications)
        .where(eq(notifications.userId, userId));

      const rowsQuery = this.db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          metadata: notifications.metadata,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          updatedAt: notifications.updatedAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const [[countResult], rows] = await Promise.all([countQuery, rowsQuery]);
      const total = Number(countResult?.total ?? 0);
      const hasMore = offset + rows.length < total;

      return Result.ok({
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          hasMore,
        },
        payload: rows as unknown as Notification[],
      });
    } catch (e) {
      console.error("NotificationsRepository.getByUserId error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get notifications" }),
      );
    }
  }

  async markAsRead({
    userId,
    notificationId,
  }: {
    userId: UserId;
    notificationId: NotificationId;
  }): Promise<Result<boolean, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await this.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId),
          ),
        )
        .returning({ id: notifications.id });

      if (!updated) {
        return Result.err(
          new NotFoundError({ message: "Notification not found" }),
        );
      }

      return Result.ok(true);
    } catch (e) {
      console.error("NotificationsRepository.markAsRead error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to mark notification as read" }),
      );
    }
  }

  async markAllAsRead({
    userId,
  }: {
    userId: UserId;
  }): Promise<Result<boolean, DatabaseError>> {
    try {
      await this.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false),
          ),
        );

      return Result.ok(true);
    } catch (e) {
      console.error("NotificationsRepository.markAllAsRead error:", e);
      return Result.err(
        new DatabaseError({
          message: "Failed to mark all notifications as read",
        }),
      );
    }
  }
}
