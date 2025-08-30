import { getRequestEvent } from '$app/server';
import { db } from '$lib/db';
import type { oauthAccessTokens } from '$lib/db/schemas/auth';
import { error } from '@sveltejs/kit';
import type { InferSelectModel } from 'drizzle-orm';
import type z from 'zod';
import type { ZodError, ZodTypeAny } from 'zod';

export async function validateAuthHeader(
  authHeader: string | null
): Promise<InferSelectModel<typeof oauthAccessTokens> | false> {
  if (!authHeader) return false;
  if (!authHeader.startsWith('Bearer ')) return false;

  const parts = authHeader.split(' ');

  if (parts.length !== 2) return false;
  const providedToken = parts[1];

  const storedToken = await db.query.oauthAccessTokens.findFirst({
    where: (table, { eq }) => eq(table.accessToken, providedToken)
  });
  if (!storedToken) return false;

  return storedToken;
}

type FieldErrors = Record<string, string[]>;

type ValidateResult<
  B extends ZodTypeAny | undefined,
  P extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined
> = {
  body: B extends ZodTypeAny ? z.infer<B> : unknown;
  params: P extends ZodTypeAny ? z.infer<P> : unknown;
  query: Q extends ZodTypeAny ? z.infer<Q> : unknown;
};

function flattenZodError(err: ZodError): FieldErrors {
  // Collect messages by full dot-path: "items.0.name"
  const errors: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.map(String).join('.') || '_root';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/**
 * Validates the current event's request body, params, and query against the
 * provided Zod schemas. If validation fails, responds with a 400 error and
 * details about the validation issues.
 */
export async function validateRequest<
  B extends ZodTypeAny | undefined,
  P extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined
>(schemas: {
  bodySchema?: B;
  paramsSchema?: P;
  querySchema?: Q;
}): Promise<ValidateResult<B, P, Q>> {
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

  const bodyErrors = bodyParse.success ? null : flattenZodError(bodyParse.error);
  const paramsErrors = paramsParse.success ? null : flattenZodError(paramsParse.error);
  const queryErrors = queryParse.success ? null : flattenZodError(queryParse.error);

  const hasErrors = !!(bodyErrors || paramsErrors || queryErrors);

  if (hasErrors) {
    const errors = {};
    if (bodyErrors) Object.assign(errors, { body: bodyErrors });
    if (paramsErrors) Object.assign(errors, { params: paramsErrors });
    if (queryErrors) Object.assign(errors, { query: queryErrors });
    error(400, { message: 'Invalid request', errors });
  }

  // Cast ensures the success branch returns correctly typed parsed values
  return {
    body: bodyParse.data,
    params: paramsParse.data,
    query: queryParse.data
  };
}
