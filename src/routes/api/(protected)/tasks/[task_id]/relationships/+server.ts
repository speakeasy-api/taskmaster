import { taskDependencies, taskDependencyTypeEnum } from '$lib/db/schemas/schema.js';
import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import z from 'zod';
import type { RequestHandler } from './$types.js';

const ParamsSchema = z.object({ task_id: z.string().uuid() });

export const GET: RequestHandler = async ({ locals }) => {
  const { query, params } = await validateRequest({
    querySchema: z.object({
      relationship_type: z.enum(taskDependencyTypeEnum.enumValues).optional()
    }),
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

  const relationships = await locals.session.useDb((db) =>
    db.query.taskDependencies.findMany({
      where: and(
        eq(taskDependencies.created_by, userId.value),
        eq(taskDependencies.task_id, params.task_id),
        query.relationship_type
          ? eq(taskDependencies.dependency_type, query.relationship_type)
          : undefined
      )
    })
  );

  // Transform the response to use relationship terminology
  const transformedRelationships = relationships.map((rel) => ({
    id: rel.id,
    task_id: rel.task_id,
    relates_to_task_id: rel.depends_on_task_id,
    relationship_type: rel.dependency_type,
    created_by: rel.created_by,
    created_at: rel.created_at,
    updated_at: rel.updated_at
  }));

  return json(transformedRelationships);
};

const CreateRelationshipSchema = z.object({
  target_task_id: z.string().uuid(),
  type: z.enum(taskDependencyTypeEnum.enumValues)
});

export const POST: RequestHandler = async ({ locals }) => {
  const { body, params } = await validateRequest({
    bodySchema: CreateRelationshipSchema,
    paramsSchema: ParamsSchema
  });

  const { target_task_id, type: relationshipType } = body;
  const { task_id } = params;

  // Prevent self-referencing relationships
  if (params.task_id === target_task_id) {
    return json({ message: 'A task cannot relate to itself' }, { status: 400 });
  }

  // Verify both tasks exist and user owns them
  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        return new Response('Unauthorized', { status: 401 });
    }
  }

  return locals.session.useDb(async (db) => {
    const existingTasks = await db.query.tasks.findMany({
      limit: 2,
      where: (table, { inArray, eq, and }) =>
        and(eq(table.created_by, userId.value), inArray(table.id, [task_id, target_task_id]))
    });

    if (existingTasks.length !== 2) {
      return json({ message: 'One or both tasks not found or not owned by user' }, { status: 404 });
    }

    // Check if relationship already exists
    const existingRelationship = await db.query.taskDependencies.findFirst({
      where: and(
        eq(taskDependencies.task_id, task_id),
        eq(taskDependencies.depends_on_task_id, target_task_id)
      )
    });

    if (existingRelationship) {
      return json({ message: 'Relationship already exists between these tasks' }, { status: 409 });
    }

    // Create the relationship
    const insertResult = await db
      .insert(taskDependencies)
      .values({
        task_id,
        depends_on_task_id: target_task_id,
        dependency_type: relationshipType
      })
      .returning();

    if (insertResult.length === 0) {
      return json({ message: 'Failed to create task relationship' }, { status: 500 });
    }

    return json(
      {
        id: insertResult[0].id,
        task_id: insertResult[0].task_id,
        relates_to_task_id: insertResult[0].depends_on_task_id,
        relationship_type: insertResult[0].dependency_type,
        created_by: insertResult[0].created_by,
        created_at: insertResult[0].created_at,
        updated_at: insertResult[0].updated_at
      },
      { status: 201 }
    );
  });
};
