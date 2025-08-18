import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ request, parent }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    redirect(302, '/sign-in');
  }

  const parentData = await parent();

  redirect(302, 'projects/' + parentData.projects[0].id);
};
