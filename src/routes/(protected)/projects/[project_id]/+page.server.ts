import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { user } = await locals.validateSession();

  const project = await db.query.project.findFirst({
    where: (table, { eq, and }) =>
      and(eq(table.created_by, user.id), eq(table.id, params.project_id)),
    with: { task: true }
  });

  if (!project) {
    error(404, 'Project not found');
  }

  return {
    project
  };
};
