import { form, getRequestEvent } from '$app/server';
import { SQL_NOW } from '$lib/db/helpers';
import { tasks } from '$lib/db/schemas/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { DeleteProjectRequest, DeleteTaskRequest, UpdateTaskStatusRequest } from './page.schemas';

export const deleteProject = form(DeleteProjectRequest, async (data) => {
  const { locals } = getRequestEvent();

  const result = await locals.services.projects.delete({
    id: data.id,
    created_by: await locals.getUserId()
  });

  if (result.isOk()) return redirect(303, '/projects');

  switch (result.error._tag) {
    case 'ProjectNotFoundError':
      locals.sendFlashMessage({
        title: 'Error',
        description: 'Project not found.'
      });
      return error(404, { message: 'Project not found' });
    case 'DatabaseError':
      locals.logError('Database error deleting project', result.error);
      locals.sendFlashMessage({
        title: 'Error',
        description: 'There was an error deleting the project.'
      });
      return error(500, { message: 'There was an error deleting the project' });
  }
});

export const deleteTask = form(DeleteTaskRequest, async (data) => {
  const { locals } = getRequestEvent();

  const result = await locals.db.delete(tasks).where(eq(tasks.id, data.id));

  if (result.rowCount === 0) {
    return error(404, { message: 'Task not found' });
  }

  return { success: true };
});

export const updateTaskStatus = form(UpdateTaskStatusRequest, async ({ id, status }) => {
  const { locals } = getRequestEvent();

  const result = await locals.session.useDb((db) =>
    db.update(tasks).set({ status, updated_at: SQL_NOW }).where(eq(tasks.id, id))
  );

  if (result.rowCount === 0) {
    return error(404, { message: 'Task not found or you do not have permission to update it.' });
  }

  return { success: true };
});
