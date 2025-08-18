import type { LayoutServerLoad } from './$types';
import { db } from '$lib/db';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = await locals.validateSession();

  const projects = await db.query.project.findMany({
    where: (table, { eq }) => eq(table.created_by, user.id)
  });

  return { user, projects };
};
