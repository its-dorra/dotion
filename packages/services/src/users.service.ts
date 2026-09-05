import type { UserId } from "@dotion/shared/users/types";
import type { PaginationQuery } from "@dotion/shared/pagination/types";
import type { UsersRepository } from "@dotion/db/repositories";
import type { DatabaseError } from "@dotion/db";
import { Result } from "better-result";
import type {
  ResourceInput,
  ResourceData,
} from "@dotion/shared/authorization/types";

export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async searchUsers({
    query,
    excludeUserIds,
    pagination,
  }: {
    query: string;
    excludeUserIds?: UserId[];
    pagination: PaginationQuery;
  }) {
    return this.usersRepository.searchUsers({
      query,
      excludeUserIds,
      pagination,
    });
  }

  async getUserById(userId: UserId) {
    return this.usersRepository.getUserById(userId);
  }

  async getUserByEmail(email: string) {
    return this.usersRepository.getUserByEmail(email);
  }

  async getUsersByIds(userIds: UserId[]) {
    return this.usersRepository.getUsersByIds(userIds);
  }

  async loadUserResourceData(
    input: ResourceInput<"user">,
  ): Promise<Result<ResourceData<"user"> | null, DatabaseError>> {
    const userResult = await this.usersRepository.getUserById(input.userId);
    if (userResult.isErr()) {
      return userResult.error._tag === "NotFoundError"
        ? Result.ok(null)
        : Result.err(userResult.error);
    }
    return Result.ok({
      targetUserId: userResult.value.id,
    });
  }
}
