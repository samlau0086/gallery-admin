import type { APIRoute } from 'astro';

type RuntimeLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };

type SearchRecord = { slug: string; title: string; titleZh: string; category: string; cover: string; sku: string; searchable: string };
const loadSearchIndex = async (url: URL, locals: App.Locals): Promise<SearchRecord[]> => {
  const assets = (locals as RuntimeLocals).runtime?.env?.ASSETS;
  const response = assets ? await assets.fetch(new Request(new URL('/search-index.json', url))) : await fetch(new URL('/search-index.json', url));
  if (!response.ok) throw new Error('Search index unavailable');
  return response.json() as Promise<SearchRecord[]>;
};

export const GET: APIRoute = async ({ url, locals }) => {
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (!query) return new Response(JSON.stringify({ results: [] }), { headers: { 'content-type': 'application/json' } });
  try {
    const searchIndex = await loadSearchIndex(url, locals);
    const results = searchIndex.filter((product) => product.searchable.includes(query)).slice(0, 6).map(({ slug, title, titleZh, category, cover, sku }) => ({ slug, title, titleZh, category, cover, sku }));
    return new Response(JSON.stringify({ results }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Search is temporarily unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
};
