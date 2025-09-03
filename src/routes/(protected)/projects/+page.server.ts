import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { resolve } from '$app/paths';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();

  if (parentData.projects.length === 0) {
    return;
  }

  const defaultProjectHref = resolve('/(protected)/projects/project/[project_id]', {
    project_id: parentData.projects[0].id
  });

  redirect(302, defaultProjectHref);
};
