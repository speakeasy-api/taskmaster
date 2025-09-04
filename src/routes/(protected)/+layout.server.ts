import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const [user, projects] = await Promise.all([
    locals.session.getUser(),
    locals.session.useDb((db) => db.query.projects.findMany())
  ]);

  return {
    user,
    projects
  };
};
