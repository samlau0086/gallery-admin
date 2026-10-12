import type { APIRoute } from 'astro';
import { queryCatalog } from '../../data/catalog-query';
const SUCCESS_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400';
type AssetLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };
const integer = (value: string, fallback: number, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(Math.max(Math.floor(number) || fallback, 1), max) : fallback;
};
export const prerender = false;
export const GET: APIRoute = async ({ url, locals }) => {
  const param = (key: string) => url.searchParams.getAll(key).map((value) => value.trim()).find(Boolean) || '';
  const assets = (locals as AssetLocals).runtime?.env?.ASSETS;
  const read = (path: string) => assets ? assets.fetch(new Request(new URL(path, url))) : fetch(new URL(path, url));
  try {
    const result = await queryCatalog(read, {
      page: integer(param('page'), 1), pageSize: integer(param('pageSize'), 24, 48),
      category: param('category'), brand: param('brand'), tag: param('tag'),
      kind: param('kind'), query: param('q').toLowerCase(), facets: param('facets') === '1',
    });
    return new Response(JSON.stringify(result), { headers: {
      'content-type': 'application/json', 'cache-control': SUCCESS_CACHE_CONTROL, 'cdn-cache-control': SUCCESS_CACHE_CONTROL,
    } });
  } catch {
    return new Response(JSON.stringify({ error: 'Products are temporarily unavailable.' }), { status: 503, headers: {
      'content-type': 'application/json', 'cache-control': 'no-store', 'cdn-cache-control': 'no-store',
    } });
  }
};
