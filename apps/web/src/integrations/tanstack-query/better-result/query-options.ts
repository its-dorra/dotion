import type { Result } from "better-result";

import type {
  QueryKey,
  QueryFunctionContext,
  UnusedSkipTokenOptions,
} from "@tanstack/react-query";

import { unwrapResult } from "./utils";

type ResultQueryFunction<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = (
  context: QueryFunctionContext<TQueryKey, TPageParam>,
) => Result<TResult, TError> | Promise<Result<TResult, TError>>;

type ResultQueryOptions<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = Omit<
  UnusedSkipTokenOptions<TResult, TError, TResult, TQueryKey>,
  "queryFn"
> & {
  queryFn: ResultQueryFunction<TResult, TError, TQueryKey, TPageParam>;
};

export function resultQueryOptions<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ResultQueryOptions<TResult, TError, TQueryKey>,
): UnusedSkipTokenOptions<TResult, TError, TResult, TQueryKey> {
  return {
    ...options,
    queryFn: (context) => {
      return unwrapResult(options.queryFn(context));
    },
  };
}
