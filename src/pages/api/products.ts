import type { APIRoute } from 'astro';
import { loadSearchIndex } from '../../data/search-index';

type Product = { slug: string; title: string; category: string; brand?: string; sku?: string; cover: string; sortOrder: number; searchable: string; description?: string; tags?: string[]; featured?: boolean; i18n?: { title?: Record<string, string>; description?: Record<string, string>; category?: Record<string, string> } };

const SUCCESS_CACHE_CONTROL = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400';
const ERROR_CACHE_CONTROL = 'no-store';
const CACHE_QUERY_KEYS = ['page', 'pageSize', 'category', 'kind', 'brand', 'tag', 'q', 'facets'];
const normalizeProductsUrl = (url: URL) => {
  const normalized = new URL(url);
  const params = new URLSearchParams();
  for (const key of CACHE_QUERY_KEYS) {
    const values = normalized.searchParams.getAll(key).map((value) => value.trim()).filter(Boolean);
    if (!values.length) continue;
    const value = key === 'category' || key === 'kind' || key === 'brand' || key === 'tag' ? values[0] : key === 'q' ? values[0].toLowerCase() : values[0];
    params.set(key, value);
  }
  normalized.search = params.toString();
  return normalized;
};

export const prerender = false;
export const GET: APIRoute = async ({ url, locals }) => {
  const normalizedUrl = normalizeProductsUrl(url);
  const page = Math.max(Number(normalizedUrl.searchParams.get('page')) || 1, 1);
  const pageSize = Math.min(Math.max(Number(normalizedUrl.searchParams.get('pageSize')) || 24, 1), 48);
  const query = (normalizedUrl.searchParams.get('q') || '').trim().toLowerCase();
  const category = (normalizedUrl.searchParams.get('category') || '').trim();
  const kind = (normalizedUrl.searchParams.get('kind') || '').trim();
  const brand = (normalizedUrl.searchParams.get('brand') || '').trim();
  const tag = (normalizedUrl.searchParams.get('tag') || '').trim();
  const facetsOnly = normalizedUrl.searchParams.get('facets') === '1';
  try {
    const allProducts = await loadSearchIndex(url, locals) as Product[];
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
