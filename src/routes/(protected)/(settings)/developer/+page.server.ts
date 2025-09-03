import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const apps = await locals.db.query.oauthApplications.findMany();
  return { apps };
};
