import type { APIRoute } from 'astro';

type RuntimeLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };
type Product = { slug: string; title: string; titleZh?: string; category: string; brand?: string; sku?: string; cover: string; sortOrder: number; searchable: string; description?: string; tags?: string[]; featured?: boolean };

const SUCCESS_CACHE_CONTROL = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400';
const ERROR_CACHE_CONTROL = 'no-store';

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
  const brand = (url.searchParams.get('brand') || '').trim();
  const tag = (url.searchParams.get('tag') || '').trim();
  const facetsOnly = url.searchParams.get('facets') === '1';
  try {
    const allProducts = await loadIndex(url, locals);
    if (facetsOnly) {
      const categories = [...new Set(allProducts.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const brands = [...new Set(allProducts.map((product) => product.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      const tags = [...new Set(allProducts.flatMap((product) => product.tags || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      return new Response(JSON.stringify({ categories, brands, tags }), { headers: { 'content-type': 'application/json', 'cache-control': SUCCESS_CACHE_CONTROL, 'cdn-cache-control': SUCCESS_CACHE_CONTROL } });
    }
    const products = allProducts.filter((product) =>
      (!query || product.searchable.includes(query)) &&
      (!category || product.category === category) &&
      (!brand || product.brand === brand) &&
      (!tag || (product.tags || []).includes(tag)) &&
      (!kind || kind === 'photos' || (kind === 'new' && product.featured))
    );
    const start = (page - 1) * pageSize;
    return new Response(JSON.stringify({ products: products.slice(start, start + pageSize), page, pageSize, total: products.length, hasMore: start + pageSize < products.length }), { headers: { 'content-type': 'application/json', 'cache-control': SUCCESS_CACHE_CONTROL, 'cdn-cache-control': SUCCESS_CACHE_CONTROL } });
  } catch {
    return new Response(JSON.stringify({ error: 'Products are temporarily unavailable.' }), { status: 503, headers: { 'content-type': 'application/json', 'cache-control': ERROR_CACHE_CONTROL, 'cdn-cache-control': ERROR_CACHE_CONTROL } });
  }
};
