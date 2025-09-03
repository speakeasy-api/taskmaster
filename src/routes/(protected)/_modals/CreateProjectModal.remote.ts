import { command, getRequestEvent } from '$app/server';
import { CreateProjectRequest } from './CreateProjectModal.schemas';

export const createProject = command(CreateProjectRequest, async (request) => {
  const { user } = await getRequestEvent().locals.validateSession();

  const result = await locals.services.projects.create({
    ...request,
    created_by: await locals.getUserId()
  });

  if (result.isErr()) {
    locals.logError('Error creating project', result.error);
    locals.sendFlashMessage({
      title: 'Error',
      description: 'There was an error creating the project.'
    });
  }

  return result;
});
