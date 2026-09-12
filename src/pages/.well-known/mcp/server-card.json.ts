import type { APIRoute } from 'astro';

export const prerender = false;

const card = {
  serverInfo: { name: 'Maesvanti Gallery', version: '1.0.0' },
  description: 'Public fashion and accessories catalog tools for AI agents.',
  transport: { type: 'streamable-http', endpoint: 'https://gallery.maesvanti.online/api/mcp' },
  capabilities: { tools: {} },
  tools: [
    { name: 'search_catalog', description: 'Search published products by name, SKU, brand, category, or tag.' },
    { name: 'filter_catalog', description: 'Open the catalog filtered by a brand or tag.' },
    { name: 'get_product', description: 'Open a published product detail page by slug or SKU.' },
    { name: 'request_quote', description: 'Open the product enquiry flow for a selected product.' },
  ],
};

export const GET: APIRoute = () => new Response(JSON.stringify(card), {
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'public, max-age=3600',
  },
});
