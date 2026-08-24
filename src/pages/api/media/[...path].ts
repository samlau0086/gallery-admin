import type { APIRoute } from 'astro';
export const prerender = false;
export const GET: APIRoute = async ({ params, locals }) => {
  const env = ((locals as App.Locals & { runtime?: { env?: Record<string, any> } }).runtime?.env ?? import.meta.env) as Record<string, any>;
  const object = await env.IMAGES_BUCKET?.get(params.path || '');
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
};
