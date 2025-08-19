import { form, getRequestEvent } from '$app/server';
import { db } from '$lib/db';
import { project, task } from '$lib/db/schemas/schema';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { DeleteProjectRequest, DeleteTaskRequest, UpdateTaskStatusRequest } from './page.schemas';
import { validateForm } from '$lib/util.server';

export const deleteProject = form(async (formData) => {
  const { user } = await getRequestEvent().locals.validateSession();

  const reqValidation = validateForm(formData, DeleteProjectRequest);
  if (!reqValidation.success) {
    return fail(400, { message: 'Invalid request data' });
  }

  const result = await db
    .delete(project)
    .where(and(eq(project.created_by, user.id), eq(project.id, reqValidation.data.id)));

  if (result.rowCount === 0) {
    return fail(404, { message: 'Project not found' });
  }

  redirect(303, '/projects');
});

export const deleteTask = form(async (formData) => {
  const { user } = await getRequestEvent().locals.validateSession();

  const reqValidation = validateForm(formData, DeleteTaskRequest);
  if (!reqValidation.success) {
    return fail(400, { message: 'Invalid request data' });
  }

  const result = await db
    .delete(task)
    .where(and(eq(task.created_by, user.id), eq(task.id, reqValidation.data.id)));

  if (result.rowCount === 0) {
    return fail(404, { message: 'Task not found' });
  }

  return { success: true };
});

export const updateTaskStatus = form(async (formData) => {
  const { user } = await getRequestEvent().locals.validateSession();

  const validatedReq = validateForm(formData, UpdateTaskStatusRequest);

  if (!validatedReq.success) {
    return fail(400, { message: 'Invalid request data' });
  }

  const { id, status } = validatedReq.data;

  const result = await db
    .update(task)
    .set({ status })
    .where(and(eq(task.created_by, user.id), eq(task.id, id)));

  if (result.rowCount === 0) {
    return fail(404, { message: 'Task not found or you do not have permission to update it.' });
  }

  return { success: true };
});
