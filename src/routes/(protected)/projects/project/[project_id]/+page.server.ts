import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const project = await locals.db.query.projects.findFirst({
    where: (fields, { eq }) => eq(fields.id, params.project_id),
    with: {
      task: {
        orderBy: (fields, { asc }) => [asc(fields.created_at)]
      }
    }
  });

  if (!project) {
    error(404, { message: 'Project not found' });
  }

  return {
    project
  };
};
