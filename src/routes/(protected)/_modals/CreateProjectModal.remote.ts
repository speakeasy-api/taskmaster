import { command, getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { CreateProjectRequest } from './CreateProjectModal.schemas';
import type { projects } from '$lib/db/schemas/schema';

export const createProject = command(
  CreateProjectRequest,
  async (request): Promise<typeof projects.$inferSelect> => {
    const { locals } = getRequestEvent();

    const result = await locals.services.projects.create({
      ...request,
      created_by: await locals.getUserId()
    });

    if (result.isOk()) {
      locals.sendFlashMessage({
        title: 'Success',
        description: 'Project created successfully.'
      });
      return result.value;
    }

    switch (result.error._tag) {
      case 'DatabaseError':
        locals.logError('Database error creating project', result.error);
        locals.sendFlashMessage({
          title: 'Error',
          description: 'There was an unhandled error creating the project.'
        });
        error(500, 'There was a database error creating the project.');
    }
  }
);
