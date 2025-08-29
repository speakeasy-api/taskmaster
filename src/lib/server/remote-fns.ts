import type { SafeParseReturnType, ZodType, ZodTypeDef } from 'zod';

export function validateForm<Output, Input = unknown>(
  form: FormData,
  schema: ZodType<Output, ZodTypeDef, Input>
): SafeParseReturnType<Input, Output> {
  const data = Object.fromEntries(form.entries());
  return schema.safeParse(data);
}
