import { db } from '$lib/db/index.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { validateAuthHeader } from '../../_helpers.js';
import { taskDependencies, tasks } from '$lib/db/schemas/schema.js';
import { eq, and } from 'drizzle-orm';
import z from 'zod';

const CreateRelationshipSchema = z.object({
  target_task_id: z.string().uuid('target_task_id must be a valid UUID'),
  type: z.enum(['blocks', 'relates_to', 'duplicates'], {
    errorMap: () => ({
      message: 'type must be one of: blocks, relates_to, duplicates'
    })
  })
});

const QueryParamsSchema = z.object({
  relationship_type: z.enum(['blocks', 'relates_to', 'duplicates']).optional()
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

  const { relationship_type } = validation.data;

  // Verify task exists and user owns it
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
  });

  if (!task) {
    return new Response('Not Found', { status: 404 });
  }

  // Get relationships with related task information
  const relationships = await db.query.taskDependencies.findMany({
    where: (table, { eq, and }) => {
      const conditions = [eq(table.task_id, task_id)];
      if (relationship_type) {
        conditions.push(eq(table.dependency_type, relationship_type));
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

  // Transform the response to use relationship terminology
  const transformedRelationships = relationships.map((rel) => ({
    id: rel.id,
    task_id: rel.task_id,
    relates_to_task_id: rel.depends_on_task_id,
    relationship_type: rel.dependency_type,
    created_by: rel.created_by,
    created_at: rel.created_at,
    updated_at: rel.updated_at,
    relatedTask: rel.dependsOnTask
  }));

  return json(transformedRelationships);
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

  const validation = CreateRelationshipSchema.safeParse(requestBody);
  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors;
    return json({ message: 'Invalid request data', errors }, { status: 400 });
  }

  const { target_task_id, type: relationship_type } = validation.data;

  // Prevent self-referencing relationships
  if (task_id === target_task_id) {
    return json({ message: 'A task cannot relate to itself' }, { status: 400 });
  }

  // Verify both tasks exist and user owns them
  const [sourceTask, targetTask] = await Promise.all([
    db.query.tasks.findFirst({
      where: and(eq(tasks.id, task_id), eq(tasks.created_by, authedUserId))
    }),
    db.query.tasks.findFirst({
      where: and(eq(tasks.id, target_task_id), eq(tasks.created_by, authedUserId))
    })
  ]);

  if (!sourceTask || !targetTask) {
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
      dependency_type: relationship_type,
      created_by: authedUserId
    })
    .returning();

  if (insertResult.length === 0) {
    return json({ message: 'Failed to create task relationship' }, { status: 500 });
  }

  // Return the created relationship with related task information
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

  // Transform the response to use relationship terminology
  const transformedRelationship = {
    id: createdDependency!.id,
    task_id: createdDependency!.task_id,
    relates_to_task_id: createdDependency!.depends_on_task_id,
    relationship_type: createdDependency!.dependency_type,
    created_by: createdDependency!.created_by,
    created_at: createdDependency!.created_at,
    updated_at: createdDependency!.updated_at,
    relatedTask: createdDependency!.dependsOnTask
  };

  return json(transformedRelationship, { status: 201 });
};
