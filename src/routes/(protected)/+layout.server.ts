import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = await locals.validateSession();
  const projects = await locals.db.query.projects.findMany();

  return {
    user,
    projects
  };
};
