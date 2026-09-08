import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const productsDir = path.resolve('src/content/products');
const searchOutputPath = path.resolve('public/search-index.json');
const productsOutputDir = path.resolve('public/product-data');
const categoriesOutputPath = path.resolve('src/data/product-categories.ts');
const reviewsDir = path.resolve('src/content/reviews');
const parseScalar = (value = '') => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try { return JSON.parse(trimmed); } catch { return trimmed.replace(/^['"]|['"]$/g, ''); }
};
const defaultLocale = 'en';
const localizedValue = (value, locale = defaultLocale, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;
  return value[locale] || value[defaultLocale] || Object.values(value).find(Boolean) || fallback;
};
const localizedMap = (legacyValue, localizedValueObject = undefined, extraValues = {}) => {
  const base = typeof localizedValueObject === 'object' && localizedValueObject ? { ...localizedValueObject } : {};
  if (typeof localizedValueObject === 'string') base.en = localizedValueObject;
  if (legacyValue && !base.en) base.en = legacyValue;
  for (const [locale, value] of Object.entries(extraValues)) if (value && !base[locale]) base[locale] = value;
  return base;
};
const parseFrontmatter = (source) => {
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/m)?.[1] ?? '';
  const get = (key) => {
    const scalarMatch = frontmatter.match(new RegExp('^' + key + ':[ \\t]*(.*)$', 'm'));
    if (scalarMatch?.[1]?.trim()) return parseScalar(scalarMatch[1]);
    const lines = frontmatter.split(/\r?\n/);
    const start = lines.findIndex((line) => new RegExp('^' + key + ':\\s*$').test(line));
    if (start < 0) return '';
    const nested = {};
    for (const line of lines.slice(start + 1)) {
      if (!line.trim()) continue;
      const nestedMatch = line.match(/^\s{2,}([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!nestedMatch) break;
      nested[nestedMatch[1]] = parseScalar(nestedMatch[2]);
    }
    return Object.keys(nested).length ? nested : '';
  };
  const getList = (key) => {
    const list = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)+)`, 'm'))?.[1] ?? '';
    return list.split('\n').map((line) => line.match(/^\s+-\s+(.+)$/)?.[1]).filter(Boolean).map(parseScalar);
  };
  return { get, getList };
};
const files = (await readdir(productsDir)).filter((file) => file.endsWith('.md'));
const reviewFiles = (await readdir(reviewsDir).catch(() => [])).filter((file) => file.endsWith('.md'));
const approvedReviews = [];
for (const file of reviewFiles) {
  const { get, getList } = parseFrontmatter(await readFile(path.join(reviewsDir, file), 'utf8'));
  const status = get('status');
  if (status && status !== 'approved') continue;
  const product = get('product');
  const author = get('author');
  const review = get('review');
  if (!product || !author || !review) continue;
  approvedReviews.push({
    product,
    author,
    email: get('email') || undefined,
    rating: Number(get('rating')),
    title: get('title') || undefined,
    body: review,
    images: getList('images'),
    date: get('date') || undefined,
    variants: get('variants') || undefined,
  });
}
const records = [];
for (const file of files) {
  const source = await readFile(path.join(productsDir, file), 'utf8');
  const { get } = parseFrontmatter(source);
  const tags = parseScalar(source.match(/^tags:\s*(.+)$/m)?.[1]);
  if (get('published') === false || get('published') === 'false') continue;
  const slug = file.replace(/\.md$/, '');
  const titleSource = get('title');
  const categorySource = get('category');
  const descriptionSource = get('description');
  const titleI18n = localizedMap(undefined, titleSource);
  const descriptionI18n = localizedMap(undefined, descriptionSource);
  const categoryI18n = localizedMap(undefined, categorySource);
  const title = localizedValue(titleI18n);
  const category = localizedValue(categoryI18n);
  const sku = get('sku'); const brand = get('brand'); const cover = get('cover');
  const sortOrder = Number(get('sortOrder')) || 0;
  const searchable = [
    ...Object.values(titleI18n),
    ...Object.values(descriptionI18n),
    ...Object.values(categoryI18n),
    brand,
    sku,
    ...(Array.isArray(tags) ? tags : []),
  ].filter(Boolean).join(' ').toLowerCase();
  records.push({
    slug, title, category, brand, sku, cover, sortOrder, searchable, published: true,
    i18n: { title: titleI18n, description: descriptionI18n, category: categoryI18n },
    media: Array.isArray(get('media')) ? get('media') : [],
    price: get('price'), description: localizedValue(descriptionI18n), tags: Array.isArray(tags) ? tags : [],
    variants: Array.isArray(get('variants')) ? get('variants') : [],
    reviews: [
      ...(Array.isArray(get('reviews')) ? get('reviews') : []),
      ...approvedReviews.filter((review) => review.product === slug),
    ],
  });
}
records.sort((a, b) => a.sortOrder - b.sortOrder);
await mkdir(path.dirname(searchOutputPath), { recursive: true });
await writeFile(searchOutputPath, JSON.stringify(records.map(({ slug, title, category, brand, sku, cover, sortOrder, searchable, description, tags, i18n }) => ({ slug, title, category, brand, sku, cover, sortOrder, searchable, description, tags, i18n, featured: sortOrder < 24 }))), 'utf8');
await mkdir(productsOutputDir, { recursive: true });
for (const record of records) await writeFile(path.join(productsOutputDir, `${record.slug}.json`), JSON.stringify(record), 'utf8');
const categories = [...new Set(records.map(({ category }) => String(category).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
await writeFile(categoriesOutputPath, `// Generated by tools/build-search-index.mjs. Do not edit.\nexport const productCategories = ${JSON.stringify(categories)} as const;\n`, 'utf8');
console.log(`Built search index with ${records.length} products.`);




