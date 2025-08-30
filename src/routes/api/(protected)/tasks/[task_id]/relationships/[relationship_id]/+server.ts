import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from '../../../_helpers.js';
import { taskDependencies, tasks } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import z from 'zod';

const UpdateRelationshipSchema = z.object({
  relationship_type: z.enum(['blocks', 'relates_to', 'duplicates'], {
    errorMap: () => ({
      message: 'relationship_type must be one of: blocks, relates_to, duplicates'
    })
  })
});

export const PUT: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id, relationship_id } = params;
  if (!task_id || !relationship_id) {
    return json(
      { message: 'task_id and relationship_id parameters are required' },
      { status: 400 }
    );
  }

  // Validate UUIDs
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  const relationshipIdValidation = z.string().uuid().safeParse(relationship_id);

  if (!taskIdValidation.success || !relationshipIdValidation.success) {
    return json({ message: 'task_id and relationship_id must be valid UUIDs' }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = UpdateRelationshipSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { relationship_type } = validation.data;

  // Verify the task belongs to the user
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify the relationship exists and belongs to the task
  const relationship = await db.query.taskDependencies.findFirst({
    where: and(eq(taskDependencies.id, relationship_id), eq(taskDependencies.task_id, task_id))
  });

  if (!relationship) {
    return new Response('Not Found', { status: 404 });
  }

  // Update the relationship
  const updateResult = await db
    .update(taskDependencies)
    .set({ dependency_type: relationship_type })
    .where(eq(taskDependencies.id, relationship_id))
    .returning();

  if (updateResult.length === 0) {
    return json({ message: 'Failed to update task relationship' }, { status: 500 });
  }

  // Return the updated relationship with related task information
  const updatedDependency = await db.query.taskDependencies.findFirst({
    where: eq(taskDependencies.id, relationship_id),
    with: {
      dependsOnTask: {
        columns: {
          id: true,
          title: true,
          description: true,
          status: true
        }
      }
    }
  });

  // Transform the response to use relationship terminology
  const transformedRelationship = {
    id: updatedDependency!.id,
    task_id: updatedDependency!.task_id,
    relates_to_task_id: updatedDependency!.depends_on_task_id,
    relationship_type: updatedDependency!.dependency_type,
    created_by: updatedDependency!.created_by,
    created_at: updatedDependency!.created_at,
    updated_at: updatedDependency!.updated_at,
    relatedTask: updatedDependency!.dependsOnTask
  };

  return json(transformedRelationship);
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id, relationship_id } = params;
  if (!task_id || !relationship_id) {
    return json(
      { message: 'task_id and relationship_id parameters are required' },
      { status: 400 }
    );
  }

  // Validate UUIDs
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  const relationshipIdValidation = z.string().uuid().safeParse(relationship_id);

  if (!taskIdValidation.success || !relationshipIdValidation.success) {
    return json({ message: 'task_id and relationship_id must be valid UUIDs' }, { status: 400 });
  }

  // Verify the task belongs to the user
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify the relationship exists and belongs to the task
  const relationship = await db.query.taskDependencies.findFirst({
    where: and(eq(taskDependencies.id, relationship_id), eq(taskDependencies.task_id, task_id))
  });

  if (!relationship) {
    return new Response('Not Found', { status: 404 });
  }

  // Delete the relationship
  const deleteResult = await db
    .delete(taskDependencies)
    .where(eq(taskDependencies.id, relationship_id))
    .returning();

  if (deleteResult.length === 0) {
    return json({ message: 'Failed to delete task relationship' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
};
