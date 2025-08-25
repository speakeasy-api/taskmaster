import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { user } = await locals.validateSession();

  const project = await db.query.projects.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.created_by, user.id), eq(fields.id, params.project_id)),
    with: {
      task: {
        orderBy: (fields, { asc, desc }) => [asc(fields.created_at)]
      }
    }
  });

  if (!project) {
    error(404, 'Project not found');
  }

  return {
    project
  };
};
