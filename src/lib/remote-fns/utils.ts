import { fail, type ActionFailure } from '@sveltejs/kit';
import type { SafeParseReturnType, ZodType, ZodTypeDef } from 'zod';

export function validateForm<Output, Input = unknown>(
  form: FormData,
  schema: ZodType<Output, ZodTypeDef, Input>
): SafeParseReturnType<Input, Output> {
  const data = Object.fromEntries(form.entries());
  return schema.safeParse(data);
}

export function handleValidationError<T = Record<string, unknown>>(
  validation: SafeParseReturnType<unknown, T>
): ActionFailure<{ message: string; errors?: Record<string, string[]> }> {
  if (validation.success) {
    throw new Error('handleValidationError called with successful validation');
  }

  const errors = validation.error.flatten().fieldErrors;
  return fail(400, {
    message: 'Validation failed',
    errors
  });
}

export function handleDatabaseError(
  rowCount: number | null | undefined,
  notFoundMessage: string = 'Resource not found'
): ActionFailure<{ message: string }> | null {
  if (rowCount === 0) {
    return fail(404, { message: notFoundMessage });
  }
  return null;
}

export function createSuccessResponse<T extends Record<string, unknown> = Record<string, unknown>>(
  data?: T
): { success: true } & (T extends undefined ? Record<string, never> : T) {
  return { success: true, ...(data || ({} as T)) } as { success: true } & (T extends undefined
    ? Record<string, never>
    : T);
}
