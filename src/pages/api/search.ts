import type { APIRoute } from 'astro';
import { loadSearchIndex } from '../../data/search-index';

type SearchRecord = { slug: string; title: string; category: string; cover: string; sku: string; searchable: string; i18n?: { title?: Record<string, string>; description?: Record<string, string>; category?: Record<string, string> } };

export const GET: APIRoute = async ({ url, locals }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (!query) return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  try {
    const searchIndex = await loadSearchIndex(url, locals) as SearchRecord[];
    const results = searchIndex.filter((product) => product.searchable.includes(query)).slice(0, 6).map(({ slug, title, category, cover, sku, i18n }) => ({ slug, title, category, cover, sku, i18n }));
    return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Search is temporarily unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
};
