import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (!query) return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  const products = await getCollection('products', ({ data }) => data.published);
  const results = products.filter(({ data }) => [data.title, data.titleZh, data.category, ...data.tags].filter(Boolean).join(' ').toLowerCase().includes(query)).sort((a, b) => a.data.sortOrder - b.data.sortOrder).slice(0, 6).map(({ slug, data }) => ({ slug, title: data.title, titleZh: data.titleZh, category: data.category, cover: data.cover }));
  return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' } });
};
