import { command, getRequestEvent } from '$app/server';
import { tasks } from '$lib/db/schemas/schema';
import { CreateTaskRequest } from './CreateTaskModal.schemas';

export const createTask = command(CreateTaskRequest, async (request) => {
  const { locals } = getRequestEvent();

  const [newTask] = await locals.db
    .insert(tasks)
    .values({
      title: request.title,
      description: request.description,
      project_id: request.project_id
    })
    .returning();

  return newTask;
});
