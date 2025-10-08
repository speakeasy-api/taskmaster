import type { SafeParseReturnType, ZodType, ZodTypeDef } from 'zod';

/**
 * @deprecated This helper is no longer needed for `form()` remote functions.
 * The new `form(schema, callback)` API validates automatically.
 * Only use this for non-remote-function FormData validation.
 */
export function validateForm<Output, Input = unknown>(
  form: FormData,
  schema: ZodType<Output, ZodTypeDef, Input>
): SafeParseReturnType<Input, Output> {
  const data = Object.fromEntries(form.entries());
  return schema.safeParse(data);
}
