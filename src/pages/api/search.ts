import type { APIRoute } from 'astro';
import { searchIndex } from '../../data/search-index';

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (!query) return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  const results = searchIndex.filter((product) => product.searchable.includes(query)).slice(0, 6).map(({ slug, title, titleZh, category, cover, sku }) => ({ slug, title, titleZh, category, cover, sku }));
  return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' } });
};
