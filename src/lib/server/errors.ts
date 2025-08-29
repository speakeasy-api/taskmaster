import { error } from '@sveltejs/kit';

export type FormError<T extends Record<string, unknown>> = {
  message: string;
  fields: { [K in keyof T]?: string[] };
};

export function formError<T extends Record<string, unknown>>(status: number, err: FormError<T>) {
  return error(status, err);
}
