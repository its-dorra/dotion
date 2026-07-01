import { Result } from "better-result";
import { ValidationError } from "@/lib/errors";
import type { UserProfile, UpdateProfileInput } from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let mockProfile: UserProfile = {
  id: "user_1",
  name: "Sam",
  email: "sam@example.com",
};

export class UserApi {
  async getCurrentUser(): Promise<Result<UserProfile, never>> {
    await delay(250);
    return Result.ok({ ...mockProfile });
  }

  async updateProfile(
    input: UpdateProfileInput,
  ): Promise<Result<UserProfile, ValidationError>> {
    await delay(450);

    if (input.name !== undefined && !input.name.trim()) {
      return Result.err(
        new ValidationError({
          message: "Name cannot be empty.",
          field: "name",
        }),
      );
    }

    mockProfile = {
      ...mockProfile,
      name: input.name?.trim() ?? mockProfile.name,
      avatarUrl: input.avatarUrl ?? mockProfile.avatarUrl,
    };

    return Result.ok({ ...mockProfile });
  }
}

export const userApi = new UserApi();
