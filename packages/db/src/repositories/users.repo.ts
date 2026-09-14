import type {
  UserId,
  User,
  UserSearchResult,
} from "@dotion/shared/users/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";
import type { DBClient } from "../index";
import { users } from "../schema/auth";
import { and, count, eq, inArray, notInArray, or, sql } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError, NotFoundError } from "../errors";

export class UsersRepository {
  constructor(private readonly db: DBClient) {}

  async searchUsers({
    query,
    excludeUserIds = [],
    pagination,
  }: {
    query: string;
    excludeUserIds?: UserId[];
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<UserSearchResult>, DatabaseError>> {
    try {
      const cleanQuery = query.trim();

      if (!cleanQuery) {
        return Result.ok({
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: 0,
            hasMore: false,
          },
          payload: [],
        });
      }

      const tsQuery = cleanQuery
        .normalize("NFKC")
        .split(/\s+/)
        .map((term) => term.replace(/[^\p{L}\p{N}_-]/gu, ""))
        .filter(Boolean)
        .map((term) => `${term}:*`)
        .join(" & ");

      const searchFilter = or(
        sql`lower(${users.email}) LIKE ${`${cleanQuery.toLowerCase()}%`}`,
        tsQuery
          ? sql` to_tsvector('simple', ${users.name}) @@ to_tsquery('simple', ${tsQuery}) `
          : undefined,
      );

      const whereClause =
        excludeUserIds.length > 0
          ? and(searchFilter, notInArray(users.id, excludeUserIds))
          : searchFilter;

      const offset = (pagination.page - 1) * pagination.limit;

      const countQuery = this.db
        .select({ total: count() })
        .from(users)
        .where(whereClause);

      const rowsQuery = this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(whereClause)
        .orderBy(
          sql` CASE WHEN lower(${users.email}) = ${cleanQuery.toLowerCase()} THEN 0 WHEN lower(${users.email}) LIKE ${`${cleanQuery.toLowerCase()}%`} THEN 1 ELSE 2 END `,
          users.name,
        )
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
        payload: rows as UserSearchResult[],
      });
    } catch (e) {
      console.error("UsersRepository.searchUsers error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to search users" }),
      );
    }
  }

  async getUserById({
    userId,
  }: {
    userId: UserId;
  }): Promise<Result<User, DatabaseError | NotFoundError>> {
    try {
      const [user] = await this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return Result.err(new NotFoundError({ message: "User not found" }));
      }

      return Result.ok(user);
    } catch (e) {
      console.error("UsersRepository.getUserById error:", e);
      return Result.err(new DatabaseError({ message: "Failed to get user" }));
    }
  }

  async getUserByEmail({
    email,
  }: {
    email: string;
  }): Promise<Result<User, DatabaseError | NotFoundError>> {
    try {
      const [user] = await this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()));

      if (!user) {
        return Result.err(new NotFoundError({ message: "User not found" }));
      }

      return Result.ok(user);
    } catch (e) {
      console.error("UsersRepository.getUserByEmail error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get user by email" }),
      );
    }
  }

  async getUsersByIds({
    userIds,
  }: {
    userIds: UserId[];
  }): Promise<Result<User[], DatabaseError>> {
    try {
      if (userIds.length === 0) {
        return Result.ok([]);
      }

      const rows = await this.db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          emailVerified: users.emailVerified,
          image: users.image,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      return Result.ok(rows);
    } catch (e) {
      console.error("UsersRepository.getUsersByIds error:", e);
      return Result.err(new DatabaseError({ message: "Failed to get users" }));
    }
  }
}
