type AssetLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };

const fetchAsset = (url: URL, locals: App.Locals, pathname: string) => {
  const assets = (locals as AssetLocals).runtime?.env?.ASSETS;
  return assets ? assets.fetch(new Request(new URL(pathname, url))) : fetch(new URL(pathname, url));
};

export const loadProduct = async (url: URL, locals: App.Locals, slug: string) => {
  const manifestResponse = await fetchAsset(url, locals, '/product-data/manifest.json');
  if (!manifestResponse.ok) return null;
  const manifest = await manifestResponse.json() as { shards: number };
  for (let index = 0; index < manifest.shards; index += 1) {
    const response = await fetchAsset(url, locals, `/product-data/${index}.json`);
    if (!response.ok) continue;
    const products = await response.json() as Record<string, unknown>;
    if (slug in products) return products[slug];
  }
  return null;
};
