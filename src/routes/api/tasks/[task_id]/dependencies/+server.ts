import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from '../../_helpers.js';
import { taskDependencies, tasks } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import z from 'zod';

const CreateDependencySchema = z.object({
  depends_on_task_id: z.string().uuid('depends_on_task_id must be a valid UUID'),
  dependency_type: z.enum(['blocks', 'relates_to', 'duplicates'], {
    errorMap: () => ({ message: 'dependency_type must be one of: blocks, relates_to, duplicates' })
  })
});

const QueryParamsSchema = z.object({
  dependency_type: z.enum(['blocks', 'relates_to', 'duplicates']).optional()
});

export const GET: RequestHandler = async ({ request, params, url }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id } = params;
  if (!task_id) {
    return json({ message: 'task_id parameter is required' }, { status: 400 });
  }

  // Validate task_id format
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  if (!taskIdValidation.success) {
    return json({ message: 'task_id must be a valid UUID' }, { status: 400 });
  }

  // Validate query parameters
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const validation = QueryParamsSchema.safeParse(queryParams);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid query parameters', errors }, { status: 400 });
  }

  const { dependency_type } = validation.data;

  // Verify task exists and user owns it
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Get dependencies with related task information
  const dependencies = await db.query.taskDependencies.findMany({
    where: (table, { eq, and }) => {
      const conditions = [eq(table.task_id, task_id)];
      if (dependency_type) {
        conditions.push(eq(table.dependency_type, dependency_type));
      }
      return and(...conditions);
    },
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

  return json(dependencies);
};

export const POST: RequestHandler = async ({ request, params }) => {
  const validToken = await validateAuthHeader(request.headers.get('Authorization'));
  if (!validToken) return new Response('Unauthorized', { status: 401 });

  const authedUserId = validToken.userId;
  if (!authedUserId) {
    return new Response('Invalid token', { status: 400 });
  }

  const { task_id } = params;
  if (!task_id) {
    return json({ message: 'task_id parameter is required' }, { status: 400 });
  }

  // Validate task_id format
  const taskIdValidation = z.string().uuid().safeParse(task_id);
  if (!taskIdValidation.success) {
    return json({ message: 'task_id must be a valid UUID' }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return json({ message: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validation = CreateDependencySchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { depends_on_task_id, dependency_type } = validation.data;

  // Prevent self-referencing dependencies
  if (task_id === depends_on_task_id) {
    return json({ message: 'A task cannot depend on itself' }, { status: 400 });
  }

  // Verify both tasks exist and user owns them
  const [sourceTask, targetTask] = await Promise.all([
    db.query.tasks.findFirst({
      where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
    }),
    db.query.tasks.findFirst({
      where: and(eq(tasks.id, depends_on_task_id), eq(tasks.created_by, authedUserId))
    })
  ]);

  if (!sourceTask || !targetTask) {
    return json({ message: 'One or both tasks not found or not owned by user' }, { status: 404 });
  }

  // Check if dependency already exists
  const existingDependency = await db.query.taskDependencies.findFirst({
    where: and(
      eq(taskDependencies.task_id, task_id),
      eq(taskDependencies.depends_on_task_id, depends_on_task_id)
    )
  });

  if (existingDependency) {
    return json({ message: 'Dependency already exists between these tasks' }, { status: 409 });
  }

  // Create the dependency
  const insertResult = await db
    .insert(taskDependencies)
    .values({
      task_id,
      depends_on_task_id,
      dependency_type,
      created_by: authedUserId
    })
    .returning();

  if (insertResult.length === 0) {
    return json({ message: 'Failed to create task dependency' }, { status: 500 });
  }

  // Return the created dependency with related task information
  const createdDependency = await db.query.taskDependencies.findFirst({
    where: eq(taskDependencies.id, insertResult[0].id),
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

  return json(createdDependency, { status: 201 });
};
