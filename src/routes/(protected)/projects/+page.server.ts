import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();

  if (parentData.projects.length === 0) {
    return;
  }

  redirect(302, 'projects/' + parentData.projects[0].id);
};
