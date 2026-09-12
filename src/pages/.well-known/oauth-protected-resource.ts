import type { APIRoute } from 'astro';

export const prerender = false;

const metadata = {
  resource: 'https://gallery.maesvanti.online/',
  resource_name: 'Maesvanti Gallery public catalog and administration APIs',
  resource_documentation: 'https://gallery.maesvanti.online/auth.md',
  authorization_servers: ['https://gallery.maesvanti.online/'],
  scopes_supported: ['repo'],
  bearer_methods_supported: ['header'],
};

export const GET: APIRoute = () => new Response(JSON.stringify(metadata), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=3600',
  },
});
