import type { UserId } from "@dotion/shared/users/types";
import type {
  NotificationId,
  CreateNotificationInput,
} from "@dotion/shared/notifications/types";
import type { PaginationQuery } from "@dotion/shared/pagination/types";
import type { AppDB } from "@dotion/db";
import type { NotificationsRepository } from "@dotion/db/repositories";
import type { UserEventPublisher } from "./realtime.types";

export interface NotificationsServiceDependencies {
  notificationsRepository: NotificationsRepository;
  userEventPublisher: UserEventPublisher;
}

export class NotificationsService {
  private readonly notificationsRepository: NotificationsRepository;
  private readonly userEventPublisher: UserEventPublisher;

  constructor({
    notificationsRepository,
    userEventPublisher,
  }: NotificationsServiceDependencies) {
    this.notificationsRepository = notificationsRepository;
    this.userEventPublisher = userEventPublisher;
  }

  async createNotification({ input }: { input: CreateNotificationInput }) {
    const result = await this.notificationsRepository.createNotification({
      input,
    });
    if (result.isOk()) {
      await this.userEventPublisher.broadcastNotification(
        input.userId,
        result.value,
      );
    }
    return result;
  }

  async createNotificationTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateNotificationInput;
  }) {
    return this.notificationsRepository.createNotificationTx({ tx, input });
  }

  async getNotifications({
    userId,
    pagination,
  }: {
    userId: UserId;
    pagination: PaginationQuery;
  }) {
    return this.notificationsRepository.getByUserId({ userId, pagination });
  }

  async markAsRead({
    userId,
    notificationId,
  }: {
    userId: UserId;
    notificationId: NotificationId;
  }) {
    const result = await this.notificationsRepository.markAsRead({
      userId,
      notificationId,
    });
    if (result.isOk()) {
      await this.userEventPublisher.broadcastNotificationRead(
        userId,
        notificationId,
      );
    }
    return result;
  }

  async markAllAsRead({ userId }: { userId: UserId }) {
    const result = await this.notificationsRepository.markAllAsRead({ userId });
    if (result.isOk()) {
      await this.userEventPublisher?.broadcastNotificationAllRead(userId);
    }
    return result;
  }
}
