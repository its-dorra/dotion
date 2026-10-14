import type { UserId } from "@dotion/shared/users/types";
import type { PaginationQuery } from "@dotion/shared/pagination/types";
import type { UsersRepository } from "@dotion/db/repositories";
import { DatabaseError, NotFoundError } from "@dotion/db";
import { Result } from "better-result";
import type {
  ResourceInput,
  ResourceData,
} from "@dotion/shared/authorization/types";

export interface UsersServiceDependencies {
  usersRepository: UsersRepository;
}

export class UsersService {
  private readonly usersRepository: UsersRepository;

  constructor({ usersRepository }: UsersServiceDependencies) {
    this.usersRepository = usersRepository;
  }

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

  async getUserById({ userId }: { userId: UserId }) {
    return this.usersRepository.getUserById({ userId });
  }

  async getUserByEmail({ email }: { email: string }) {
    return this.usersRepository.getUserByEmail({ email });
  }

  async getUsersByIds({ userIds }: { userIds: UserId[] }) {
    return this.usersRepository.getUsersByIds({ userIds });
  }

  async loadUserResourceData({
    input,
  }: {
    input: ResourceInput<"user">;
  }): Promise<Result<ResourceData<"user"> | null, DatabaseError>> {
    return this.usersRepository
      .getUserById({ userId: input.userId })
      .then((res) => {
        if (res.isOk()) {
          return Result.ok({ targetUserId: res.value.id });
        }
        if (NotFoundError.is(res.error)) {
          return Result.ok(null);
        }
        return Result.err(res.error);
      });
  }
}
