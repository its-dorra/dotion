import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { userApi } from "../api";
import { userKeys } from "../query-options";
import type { UpdateProfileInput } from "../types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateProfileInput) => userApi.updateProfile(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
      },
    }),
  );
}
