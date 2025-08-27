import { command, getRequestEvent } from '$app/server';
import { projects } from '$lib/db/schemas/schema';
import { CreateProjectRequest } from './CreateProjectModal.schemas';

export const createProject = command(CreateProjectRequest, async (request) => {
  const { locals } = getRequestEvent();

  const [result] = await locals.db
    .insert(projects)
    .values({ ...request })
    .returning();

  return result;
});
