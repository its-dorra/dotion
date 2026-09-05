import type {
  MutationFunctionContext,
  MutationOptions,
} from '@tanstack/react-query'
import type { Result } from 'better-result'
import { unwrapResult } from './utils'

type ResultMutationFunction<TData, TError, TVariables = unknown> = (
  variables: TVariables,
  context: MutationFunctionContext,
) => Promise<Result<TData, TError>>

type ResultMutationOptions<
  TData,
  TError,
  TVariables,
  TOnMutateResult = unknown,
> = Omit<
  MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationFn'
> & {
  mutationFn: ResultMutationFunction<TData, TError, TVariables>
}

export function resultMutationOptions<
  TData,
  TError,
  TVariables = unknown,
  TOnMutateResult = unknown,
>(
  options: ResultMutationOptions<TData, TError, TVariables, TOnMutateResult>,
): MutationOptions<TData, TError, TVariables, TOnMutateResult> {
  return {
    ...options,
    mutationFn: async (variables, context) => {
      const result = await options.mutationFn(variables, context)

      return unwrapResult(result)
    },
  }
}
