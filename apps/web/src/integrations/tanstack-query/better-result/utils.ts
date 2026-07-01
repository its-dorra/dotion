import type { Result } from "better-result";

export async function unwrapResult<TResult, TError>(
  result: Result<TResult, TError> | Promise<Result<TResult, TError>>,
): Promise<TResult> {
  const resolvedResult = await result;
  if (resolvedResult.isOk()) {
    return resolvedResult.value;
  }

  throw resolvedResult.error;
}
