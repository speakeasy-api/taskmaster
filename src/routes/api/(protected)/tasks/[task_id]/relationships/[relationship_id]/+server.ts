import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { taskDependencies, taskDependencyTypeEnum } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import z from 'zod';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { SQL_NOW } from '$lib/db/helpers.js';

const ParamsSchema = z.object({ task_id: z.string().uuid(), relationship_id: z.string().uuid() });

export const PUT: RequestHandler = async ({ locals }) => {
  const { body, params } = await validateRequest({
    paramsSchema: ParamsSchema,
    bodySchema: z.object({
      relationship_type: z.enum(taskDependencyTypeEnum.enumValues)
    })
  });

  // Update the relationship
  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        return new Response('Unauthorized', { status: 401 });
    }
  }

  const updateResult = await locals.session.useDb((db) =>
    db
      .update(taskDependencies)
      .set({ dependency_type: body.relationship_type, updated_at: SQL_NOW })
      .where(
        and(
          eq(taskDependencies.created_by, userId.value),
          eq(taskDependencies.id, params.relationship_id),
          eq(taskDependencies.task_id, params.task_id)
        )
      )
      .returning()
  );

  if (updateResult.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  // Transform the response to use relationship terminology
  const transformedRelationship = {
    id: updateResult[0].id,
    task_id: updateResult[0].task_id,
    relates_to_task_id: updateResult[0].depends_on_task_id,
    relationship_type: updateResult[0].dependency_type,
    created_by: updateResult[0].created_by,
    created_at: updateResult[0].created_at,
    updated_at: updateResult[0].updated_at
  };

  return json(transformedRelationship);
};

export const DELETE: RequestHandler = async ({ locals }) => {
  const { params } = await validateRequest({
    paramsSchema: ParamsSchema
  });

  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        return new Response('Unauthorized', { status: 401 });
    }
  }

  // Delete the relationship
  const deleteResult = await locals.session.useDb((db) =>
    db
      .delete(taskDependencies)
      .where(
        and(
          eq(taskDependencies.created_by, userId.value),
          eq(taskDependencies.id, params.relationship_id)
        )
      )
      .returning()
  );

  if (deleteResult.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(null, { status: 204 });
};
