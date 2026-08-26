import type { APIRoute } from 'astro';

type RuntimeLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };
type Product = { slug: string; title: string; titleZh?: string; category: string; brand?: string; sku?: string; cover: string; sortOrder: number; searchable: string; description?: string; tags?: string[]; featured?: boolean };

const loadIndex = async (url: URL, locals: App.Locals): Promise<Product[]> => {
  const assets = (locals as RuntimeLocals).runtime?.env?.ASSETS;
  const response = assets ? await assets.fetch(new Request(new URL('/search-index.json', url))) : await fetch(new URL('/search-index.json', url));
  if (!response.ok) throw new Error('Product index unavailable');
  return response.json() as Promise<Product[]>;
};

export const prerender = false;
export const GET: APIRoute = async ({ url, locals }) => {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize')) || 24, 1), 48);
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  const category = (url.searchParams.get('category') || '').trim();
  const kind = (url.searchParams.get('kind') || '').trim();
  try {
    const products = (await loadIndex(url, locals)).filter((product) =>
      (!query || product.searchable.includes(query)) &&
      (!category || product.category === category) &&
      (!kind || kind === 'photos' || (kind === 'new' && product.featured))
    );
    const start = (page - 1) * pageSize;
    return new Response(JSON.stringify({ products: products.slice(start, start + pageSize), page, pageSize, total: products.length, hasMore: start + pageSize < products.length }), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60, stale-while-revalidate=300' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Products are temporarily unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
};
