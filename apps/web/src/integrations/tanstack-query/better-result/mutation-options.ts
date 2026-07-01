import type {
  MutationFunctionContext,
  MutationOptions,
} from "@tanstack/react-query";
import type { Result } from "better-result";
import { unwrapResult } from "./utils";

type ResultMutationFunction<TData, TError, TVariables = unknown> = (
  variables: TVariables,
  context: MutationFunctionContext,
) => Promise<Result<TData, TError>>;

type ResultMutationOptions<TData, TError, TVariables> = Omit<
  MutationOptions<TData, TError, TVariables>,
  "mutationFn"
> & {
  mutationFn: ResultMutationFunction<TData, TError, TVariables>;
};

export function resultMutationOptions<TData, TError, TVariables = unknown>(
  options: ResultMutationOptions<TData, TError, TVariables>,
): MutationOptions<TData, TError, TVariables> {
  return {
    ...options,
    mutationFn: async (variables, context) => {
      const result = await options.mutationFn(variables, context);

      return unwrapResult(result);
    },
  };
}
