export type SearchIndexRecord = {
  slug: string;
  title: string;
  category: string;
  brand?: string;
  sku?: string;
  cover: string;
  sortOrder: number;
  searchable: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  i18n?: { title?: Record<string, string>; description?: Record<string, string>; category?: Record<string, string> };
};

type AssetLocals = App.Locals & { runtime?: { env?: { ASSETS?: { fetch: (request: Request | string) => Promise<Response> } } } };

const fetchAsset = (url: URL, locals: App.Locals, pathname: string) => {
  const assets = (locals as AssetLocals).runtime?.env?.ASSETS;
  return assets ? assets.fetch(new Request(new URL(pathname, url))) : fetch(new URL(pathname, url));
};

export const loadSearchIndex = async (url: URL, locals: App.Locals): Promise<SearchIndexRecord[]> => {
  const manifestResponse = await fetchAsset(url, locals, '/search-index/manifest.json');
  if (!manifestResponse.ok) throw new Error('Search index manifest unavailable');
  const manifest = await manifestResponse.json() as { shards: number };
  const shards = await Promise.all(Array.from({ length: manifest.shards }, (_, index) => fetchAsset(url, locals, `/search-index/${index}.json`)));
  if (shards.some((response) => !response.ok)) throw new Error('Search index shard unavailable');
  const records = await Promise.all(shards.map((response) => response.json() as Promise<SearchIndexRecord[]>));
  return records.flat();
};

export const filterSearchIndex = async (url: URL, locals: App.Locals, predicate: (record: SearchIndexRecord) => boolean): Promise<SearchIndexRecord[]> => {
  const manifestResponse = await fetchAsset(url, locals, '/search-index/manifest.json');
  if (!manifestResponse.ok) throw new Error('Search index manifest unavailable');
  const manifest = await manifestResponse.json() as { shards: number };
  const matches: SearchIndexRecord[] = [];
  for (let index = 0; index < manifest.shards; index += 1) {
    const response = await fetchAsset(url, locals, `/search-index/${index}.json`);
    if (!response.ok) throw new Error('Search index shard unavailable');
    const records = await response.json() as SearchIndexRecord[];
    for (const record of records) if (predicate(record)) matches.push(record);
  }
  return matches;
};
