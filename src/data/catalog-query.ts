import type { SearchIndexRecord } from './search-index';
type Manifest = { total: number; shardSize: number; cardPageSize: number; featured: number[]; filters: Record<'category' | 'brand' | 'tag', Record<string, number[]>> };
export type CatalogQuery = { page: number; pageSize: number; category: string; brand: string; tag: string; kind: string; query: string; facets: boolean };
type ReadAsset = (path: string) => Promise<Response>;
const readJson = async <T>(read: ReadAsset, path: string): Promise<T> => {
  const response = await read(path);
  if (!response.ok) throw new Error(`Catalog asset unavailable: ${path}`);
  return response.json() as Promise<T>;
};
const posting = (values: Record<string, number[]>, key: string) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] : [];
export const queryCatalog = async (read: ReadAsset, options: CatalogQuery) => {
  const plain = !options.facets && !options.query && !options.category && !options.brand && !options.tag && (!options.kind || options.kind === 'photos');
  let manifest: Manifest;
  if (plain) {
    const pages = await readJson<{ total: number; pageSize: number }>(read, '/catalog-pages/manifest.json');
    manifest = { total: pages.total, cardPageSize: pages.pageSize, shardSize: 1024, featured: [], filters: { category: {}, brand: {}, tag: {} } };
  } else {
    manifest = await readJson<Manifest>(read, '/catalog-query/manifest.json');
  }
  if (options.facets) {
    const sorted = (kind: 'category' | 'brand' | 'tag') => Object.keys(manifest.filters[kind]).sort((a, b) => a.localeCompare(b));
    return { categories: sorted('category'), brands: sorted('brand'), tags: sorted('tag') };
  }
  const lists: number[][] = [];
  for (const kind of ['category', 'brand', 'tag'] as const) if (options[kind]) lists.push(posting(manifest.filters[kind], options[kind]));
  if (options.kind === 'new') lists.push(manifest.featured);
  else if (options.kind && options.kind !== 'photos') lists.push([]);
  lists.sort((a, b) => a.length - b.length);
  const start = (options.page - 1) * options.pageSize;
  let ids = plain ? [] : lists.length ? lists[0] : Array.from({ length: manifest.total }, (_, id) => id);
  for (const list of lists.slice(1)) {
    const allowed = new Set(list);
    ids = ids.filter((id) => allowed.has(id));
  }
  if (options.query && ids.length) {
    const matches: number[] = [];
    const groups = new Map<number, number[]>();
    for (const id of ids) {
      const index = Math.floor(id / manifest.shardSize);
      if (!groups.has(index)) groups.set(index, []);
      groups.get(index)!.push(id);
    }
    // Search strings only; load full product cards after pagination.
    for (const [index, candidates] of groups) {
      const strings = await readJson<string[]>(read, `/catalog-query/${index}.json`);
      for (const id of candidates) if (strings[id % manifest.shardSize].includes(options.query)) matches.push(id);
    }
    ids = matches;
  }
  const total = plain ? manifest.total : ids.length;
  const pageIds = plain
    ? Array.from({ length: Math.max(0, Math.min(options.pageSize, total - start)) }, (_, offset) => start + offset)
    : ids.slice(start, start + options.pageSize);
  const cards = new Map<number, SearchIndexRecord[]>();
  for (const id of pageIds) {
    const page = Math.floor(id / manifest.cardPageSize) + 1;
    if (!cards.has(page)) {
      const data = await readJson<{ products: SearchIndexRecord[] }>(read, `/catalog-pages/${page}.json`);
      cards.set(page, data.products);
    }
  }
  const products = pageIds.map((id) => cards.get(Math.floor(id / manifest.cardPageSize) + 1)![id % manifest.cardPageSize]);
  return { products, page: options.page, pageSize: options.pageSize, total, hasMore: start + options.pageSize < total };
};
