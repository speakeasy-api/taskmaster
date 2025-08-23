import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import z from 'zod';
import type { PageServerLoad } from './$types';

const QueryParamsSchema = z.object({
  consent_code: z.string(),
  scope: z.string(),
  client_id: z.string()
});

export const load: PageServerLoad = async ({ url }) => {
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const paramValidation = QueryParamsSchema.safeParse(queryParams);

  if (!paramValidation.success) {
    error(400, 'Bad request');
  }

  const client = await db.query.oauthApplications.findFirst({
    where: (table, { eq }) => eq(table.clientId, paramValidation.data.client_id)
  });

  if (!client) {
    error(404, 'Not found');
  }

  return {
    client,
    scope: paramValidation.data.scope,
    consent_code: paramValidation.data.consent_code
  };
};
