import { error } from '@sveltejs/kit';
import type { SafeParseReturnType, ZodType, ZodTypeDef } from 'zod';

export function validateForm<Output, Input = unknown>(
  form: FormData,
  schema: ZodType<Output, ZodTypeDef, Input>
): SafeParseReturnType<Input, Output> {
  const data = Object.fromEntries(form.entries());
  return schema.safeParse(data);
}

export type FormFnRsult<TForm extends Record<string, string>, TData> =
  | {
      success: false;
      message?: string;
      errors: Record<keyof TForm, string[]>;
    }
  | {
      success: true;
      message?: string;
      result: TData;
    };

export function formError(status: number) {
  return error(status);
}
