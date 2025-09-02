import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import type z from 'zod';

type InputSchemas = {
  bodySchema?: z.ZodType;
  paramsSchema?: z.ZodType;
  querySchema?: z.ZodType;
};

// 2. Define the mapping from the input key to the output key.
type SchemaKeyToResultKey = {
  bodySchema: 'body';
  paramsSchema: 'params';
  querySchema: 'query';
};

// 3. Define the generic return type.
type ValidationResult<S extends InputSchemas> = {
  // Map over the keys that are actually provided in the input `S`.
  // The `-?` removes the optional modifier, as we only iterate over existing keys.
  -readonly [P in keyof S as P extends keyof SchemaKeyToResultKey
    ? SchemaKeyToResultKey[P]
    : never]-?: S[P] extends z.ZodType ? z.infer<S[P]> : never; // Infer the type from the Zod schema.
};

/**
 * Validates the current event's request body, params, and query against the
 * provided Zod schemas. If validation fails, responds with a 400 error and
 * details about the validation issues.
 */
export async function validateRequest<S extends InputSchemas>(
  schemas: S
): Promise<ValidationResult<S>> {
  const { request, url, params } = getRequestEvent();
  const reqClone = request.clone();
  const { bodySchema, paramsSchema, querySchema } = schemas;

  const query = Object.fromEntries(url.searchParams.entries());

  let reqBody: unknown;
  try {
    if (bodySchema) reqBody = await reqClone.json();
  } catch {
    error(400, 'Invalid JSON body');
  }

  const bodyParse = bodySchema
    ? bodySchema.safeParse(reqBody)
    : { success: true as const, data: {} };
  const paramsParse = paramsSchema
    ? paramsSchema.safeParse(params)
    : { success: true as const, data: params };
  const queryParse = querySchema
    ? querySchema.safeParse(query)
    : { success: true as const, data: query };

  const bodyErrors = bodyParse.success ? null : bodyParse.error.flatten().fieldErrors;
  const paramsErrors = paramsParse.success ? null : paramsParse.error.flatten().fieldErrors;
  const queryErrors = queryParse.success ? null : queryParse.error.flatten().fieldErrors;

  const hasErrors = !!(bodyErrors || paramsErrors || queryErrors);

  if (hasErrors) {
    const errors = {};
    if (bodyErrors) Object.assign(errors, { body: bodyErrors });
    if (paramsErrors) Object.assign(errors, { params: paramsErrors });
    if (queryErrors) Object.assign(errors, { query: queryErrors });
    error(400, { message: 'Invalid request', errors });
  }

  // Build return object conditionally based on provided schemas
  const result = {} as ValidationResult<S>;
  if (bodySchema) Object.assign(result, { body: bodyParse.data });
  if (paramsSchema) Object.assign(result, { params: paramsParse.data });
  if (querySchema) Object.assign(result, { query: queryParse.data });

  return result;
}
