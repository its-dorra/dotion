import type { Result } from "better-result";

import {
  type QueryKey,
  type QueryFunctionContext,
  type UnusedSkipTokenOptions,
  type DataTag,
  infiniteQueryOptions,
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

type ReturnQueryOptions<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<
  UnusedSkipTokenOptions<TResult, TError, TResult, TQueryKey>,
  "queryKey"
> & {
  queryKey: DataTag<TQueryKey, TResult, TError>;
};

export function resultQueryOptions<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ResultQueryOptions<TResult, TError, TQueryKey>,
): ReturnQueryOptions<TResult, TError, TQueryKey> {
  return {
    ...options,
    queryKey: options.queryKey as DataTag<TQueryKey, TResult, TError>,
    queryFn: (context) => {
      return unwrapResult(options.queryFn(context));
    },
  };
}

export function resultInfiniteQueryOptions<
  TResult,
  TError,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = number,
>(options: {
  queryKey: TQueryKey;
  queryFn: (
    context: QueryFunctionContext<TQueryKey, TPageParam>,
  ) => Result<TResult, TError> | Promise<Result<TResult, TError>>;
  initialPageParam: TPageParam;
  getNextPageParam: (
    lastPage: TResult,
    allPages: TResult[],
    lastPageParam: TPageParam,
    allPageParams: TPageParam[],
  ) => TPageParam | undefined | null;
  staleTime?: number;
  enabled?: boolean;
}) {
  return infiniteQueryOptions({
    queryKey: options.queryKey,
    queryFn: async (context) => {
      return unwrapResult(options.queryFn(context));
    },
    initialPageParam: options.initialPageParam,
    getNextPageParam: options.getNextPageParam,
    staleTime: options.staleTime,
    enabled: options.enabled,
  });
}
