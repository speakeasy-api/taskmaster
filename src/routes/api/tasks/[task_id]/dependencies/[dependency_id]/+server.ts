import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from '../../../_helpers.js';
import { taskDependencies, tasks } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import z from 'zod';

const UpdateDependencySchema = z.object({
  dependency_type: z.enum(['blocks', 'relates_to', 'duplicates'], {
    errorMap: () => ({ message: 'dependency_type must be one of: blocks, relates_to, duplicates' })
  })
});

export const PUT: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id, dependency_id } = params;
  if (!task_id || !dependency_id) {
    return json({ message: 'task_id and dependency_id parameters are required' }, { status: 400 });
  }

  // Validate UUIDs
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  const dependencyIdValidation = z.string().uuid().safeParse(dependency_id);

  if (!taskIdValidation.success || !dependencyIdValidation.success) {
    return json({ message: 'task_id and dependency_id must be valid UUIDs' }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = UpdateDependencySchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { dependency_type } = validation.data;

  // Verify the task belongs to the user
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify the dependency exists and belongs to the task
  const dependency = await db.query.taskDependencies.findFirst({
    where: and(eq(taskDependencies.id, dependency_id), eq(taskDependencies.task_id, task_id))
  });

  if (!dependency) {
    return new Response('Not Found', { status: 404 });
  }

  // Update the dependency
  const updateResult = await db
    .update(taskDependencies)
    .set({ dependency_type })
    .where(eq(taskDependencies.id, dependency_id))
    .returning();

  if (updateResult.length === 0) {
    return json({ message: 'Failed to update task dependency' }, { status: 500 });
  }

  // Return the updated dependency with related task information
  const updatedDependency = await db.query.taskDependencies.findFirst({
    where: eq(taskDependencies.id, dependency_id),
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

  return json(updatedDependency);
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id, dependency_id } = params;
  if (!task_id || !dependency_id) {
    return json({ message: 'task_id and dependency_id parameters are required' }, { status: 400 });
  }

  // Validate UUIDs
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  const dependencyIdValidation = z.string().uuid().safeParse(dependency_id);

  if (!taskIdValidation.success || !dependencyIdValidation.success) {
    return json({ message: 'task_id and dependency_id must be valid UUIDs' }, { status: 400 });
  }

  // Verify the task belongs to the user
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Verify the dependency exists and belongs to the task
  const dependency = await db.query.taskDependencies.findFirst({
    where: and(eq(taskDependencies.id, dependency_id), eq(taskDependencies.task_id, task_id))
  });

  if (!dependency) {
    return new Response('Not Found', { status: 404 });
  }

  // Delete the dependency
  const deleteResult = await db
    .delete(taskDependencies)
    .where(eq(taskDependencies.id, dependency_id))
    .returning();

  if (deleteResult.length === 0) {
    return json({ message: 'Failed to delete task dependency' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
};
