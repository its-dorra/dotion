import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { aiAssistantApi } from "../api";
import { aiAssistantKeys } from "../query-options";
import type { SendMessageInput } from "../types";

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: SendMessageInput) => aiAssistantApi.sendMessage(input),
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: aiAssistantKeys.conversations(variables.pageId),
        });
        queryClient.invalidateQueries({
          queryKey: aiAssistantKeys.conversation(
            variables.pageId,
            result.conversationId,
          ),
        });
      },
    }),
  );
}
