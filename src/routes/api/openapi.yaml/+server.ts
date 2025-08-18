import type { RequestHandler } from '@sveltejs/kit';

export const prerender = true;

export const GET: RequestHandler = async () => {
  const result = import.meta.glob(['/static/openapi.yaml'], {
    eager: true,
    query: '?raw',
    import: 'default'
  });

  if (!result['/static/openapi.yaml']) {
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response(result['/static/openapi.yaml'] as string, {
    headers: [['Content-Type', 'text/yaml']]
  });
};
