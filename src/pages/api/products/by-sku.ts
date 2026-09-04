import type { APIRoute } from 'astro';

type RuntimeLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };
type ProductIndexRecord = { slug: string; sku?: string };

const SUCCESS_CACHE_CONTROL = 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400';
const ERROR_CACHE_CONTROL = 'no-store';

const json = (body: unknown, status: number, cacheControl: string) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheControl,
    'cdn-cache-control': cacheControl,
  },
});

const fetchAsset = async (url: URL, locals: App.Locals, pathname: string) => {
  const assets = (locals as RuntimeLocals).runtime?.env?.ASSETS;
  return assets
    ? assets.fetch(new Request(new URL(pathname, url)))
    : fetch(new URL(pathname, url));
};

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const sku = (url.searchParams.get('sku') || '').trim();
  if (!sku) return json({ error: 'The sku query parameter is required.' }, 400, ERROR_CACHE_CONTROL);

  try {
    const indexResponse = await fetchAsset(url, locals, '/search-index.json');
    if (!indexResponse.ok) throw new Error('Product index unavailable');
    const products = await indexResponse.json() as ProductIndexRecord[];
    const normalizedSku = sku.toLowerCase();
    const matches = products.filter((product) => product.sku?.trim().toLowerCase() === normalizedSku);

    if (!matches.length) return json({ error: 'Product not found.' }, 404, ERROR_CACHE_CONTROL);
    if (matches.length > 1) return json({ error: 'Multiple products match this sku.' }, 409, ERROR_CACHE_CONTROL);

    const productResponse = await fetchAsset(url, locals, `/product-data/${encodeURIComponent(matches[0].slug)}.json`);
    if (!productResponse.ok) throw new Error('Product data unavailable');
    return new Response(await productResponse.text(), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': SUCCESS_CACHE_CONTROL,
        'cdn-cache-control': SUCCESS_CACHE_CONTROL,
      },
    });
  } catch {
    return json({ error: 'Product data is temporarily unavailable.' }, 503, ERROR_CACHE_CONTROL);
  }
};
