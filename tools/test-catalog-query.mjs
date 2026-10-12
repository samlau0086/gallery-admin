import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile('src/data/catalog-query.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const queryModule = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const { queryCatalog } = await import(queryModule);
const manifest = JSON.parse(await readFile('public/search-index/manifest.json', 'utf8'));
const records = [];
for (let i = 0; i < manifest.shards; i++) records.push(...JSON.parse(await readFile(`public/search-index/${i}.json`, 'utf8')));
let reads = [];
const read = async (path) => {
  reads.push(path);
  try { return new Response(await readFile(`public${path}`)); }
  catch { return new Response('', { status: 404 }); }
};
const defaults = { page: 1, pageSize: 24, category: '', brand: '', tag: '', kind: '', query: '', facets: false };
const sample = records.find((record) => record.brand && record.tags.length);
const cases = [
  {}, { page: 45 }, { pageSize: 48, page: 3 }, { pageSize: 7, page: 2 },
  { category: sample.category }, { brand: sample.brand }, { tag: sample.tags[0] },
  { category: sample.category, brand: sample.brand, tag: sample.tags[0], pageSize: 13 },
  { kind: 'new' }, { kind: 'photos' }, { kind: 'invalid' },
  { query: 'bag' }, { query: sample.sku?.toLowerCase() || 'leather', brand: sample.brand },
  { query: 'no-such-product-987654321' }, { category: 'missing' }, { brand: '__proto__' },
  { page: 999999 }, { facets: true }, { facets: true, query: 'bag', brand: 'ignored' },
];
for (const change of cases) {
  const options = { ...defaults, ...change };
  reads = [];
  const actual = await queryCatalog(read, options);
  const searchMatches = records.filter((p) => !options.query || p.searchable.includes(options.query));
  let expected;
  if (options.facets) {
    const sort = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    expected = { categories: sort(records.map((p) => p.category)), brands: sort(records.map((p) => p.brand)), tags: sort(records.flatMap((p) => p.tags)) };
  } else {
    const selected = searchMatches.filter((p) => (!options.category || p.category === options.category) && (!options.brand || p.brand === options.brand) && (!options.tag || p.tags.includes(options.tag)) && (!options.kind || options.kind === 'photos' || (options.kind === 'new' && p.featured)));
    const start = (options.page - 1) * options.pageSize;
    expected = { products: selected.slice(start, start + options.pageSize), page: options.page, pageSize: options.pageSize, total: selected.length, hasMore: start + options.pageSize < selected.length };
  }
  assert.deepEqual(actual, expected, JSON.stringify(change));
  assert(!reads.some((path) => path.startsWith('/search-index/')));
  if (!options.query || options.facets) assert(!reads.some((path) => /^\/catalog-query\/\d+/.test(path)));
}
await assert.rejects(queryCatalog(async () => new Response('', { status: 404 }), defaults), /unavailable/);
for (const path of ['/catalog-pages/1.json', '/catalog-query/0.json']) {
  await assert.rejects(queryCatalog((asset) => asset === path ? Promise.resolve(new Response('', { status: 404 })) : read(asset), { ...defaults, query: path.includes('catalog-query') ? 'bag' : '' }), /unavailable/);
}
const routeSource = (await readFile('src/pages/api/products.ts', 'utf8')).replace("'../../data/catalog-query'", JSON.stringify(queryModule));
const routeCode = ts.transpileModule(routeSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { GET } = await import(`data:text/javascript;base64,${Buffer.from(routeCode).toString('base64')}`);
const locals = { runtime: { env: { ASSETS: { fetch: (request) => read(new URL(request.url).pathname) } } } };
for (const [params, page, pageSize] of [
  ['page=Infinity&pageSize=NaN', 1, 24],
  ['page=2.9&pageSize=999', 2, 48],
  ['page=-3&pageSize=-1', 1, 1],
  ['page=&page=45&pageSize=24', 45, 24],
]) {
  const response = await GET({ url: new URL(`https://example.com/api/products?${params}`), locals });
  assert.equal(response.status, 200);
  assert(response.headers.get('cache-control').includes('s-maxage=31536000'));
  assert.deepEqual(await response.json(), await queryCatalog(read, { ...defaults, page, pageSize }));
}
const failure = await GET({ url: new URL('https://example.com/api/products'), locals: { runtime: { env: { ASSETS: { fetch: async () => new Response('', { status: 404 }) } } } } });
assert.equal(failure.status, 503);
assert.equal(failure.headers.get('cache-control'), 'no-store');
assert.equal(failure.headers.get('cdn-cache-control'), 'no-store');
reads = [];
await queryCatalog(read, { ...defaults, page: 45 });
const bytes = (await Promise.all(reads.map(async (path) => (await stat(`public${path}`)).size))).reduce((a, b) => a + b, 0);
console.log(`Passed ${cases.length} result comparisons, 4 route parameter cases, and missing-asset/no-store handling. Page 45: ${reads.length} assets, ${bytes} bytes.`);
