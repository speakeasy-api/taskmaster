import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user } = await locals.validateSession();
  try {
    const projects = await locals.db.query.projects.findMany();
    return { user, projects };
  } catch (error) {
    locals.logError('Error loading projects:', error);
    return { user, projects: [] };
  }
};
