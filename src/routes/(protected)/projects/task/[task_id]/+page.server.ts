import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const task = await locals.db.query.tasks.findFirst({
    where: (fields, { and, eq }) => and(eq(fields.id, params.task_id)),
    with: {
      project: { columns: { id: true, name: true } },
      dependencies: { with: { dependsOnTask: true } },
      dependents: { with: { task: true } }
    }
  });

  if (!task) {
    error(404, 'Task not found');
  }

  return {
    task
  };
};
