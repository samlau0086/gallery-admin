import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const usage = `Usage: npm run convert:products -- <input.json> [--brand Gucci] [--category Bags] [--overwrite]

Converts product JSON records with Chinese keys (ID, 标签, 货号, 标题, 图片, 时间)
into Astro content files in src/content/products/. Existing files are skipped unless
--overwrite is supplied.`;

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith('--'));

if (!inputPath || args.includes('--help') || args.includes('-h')) {
  console.log(usage);
  process.exit(inputPath ? 0 : 1);
}

const optionValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const defaultBrand = path.basename(inputPath, path.extname(inputPath))
  .replace(/^_+/, '')
  .split(/[_-]/)[0]
  .toUpperCase();
const brand = optionValue('--brand') ?? defaultBrand;
const category = optionValue('--category') ?? 'Bags';
const overwrite = args.includes('--overwrite');
const outputDir = path.resolve('src/content/products');

const raw = await readFile(inputPath, 'utf8');
const records = JSON.parse(raw);

if (!Array.isArray(records)) {
  throw new Error('The input JSON must be an array of product records.');
}

const stringify = (value) => JSON.stringify(value);
const safeFilename = (value) => String(value).trim().replace(/[^a-zA-Z0-9_-]+/g, '-');

await mkdir(outputDir, { recursive: true });

let created = 0;
let skipped = 0;

for (const [index, record] of records.entries()) {
  const sku = String(record['货号'] ?? '').trim();
  const sourceId = String(record.ID ?? '').trim();
  const title = String(record['标题'] ?? '').trim() || sku || sourceId || `Product ${index + 1}`;
  const images = Array.isArray(record['图片']) ? record['图片'].filter(Boolean) : [];

  if (!sku && images.length === 0) {
    console.warn(`Skipping record ${index + 1}: both SKU and images are missing.`);
    skipped += 1;
    continue;
  }

  const filename = `${brand.toLowerCase()}-${safeFilename(sku || sourceId || `record-${index + 1}`)}.md`;
  const destination = path.join(outputDir, filename);
  const exists = await access(destination).then(() => true).catch(() => false);

  if (exists && !overwrite) {
    console.warn(`Skipping existing file: ${path.relative(process.cwd(), destination)}`);
    skipped += 1;
    continue;
  }

  const tags = Array.isArray(record['标签']) && record['标签'].length > 0 ? record['标签'] : [brand, category];
  const cover = images[0] ?? '/product-placeholder.svg';
  const media = images.map((url, imageIndex) => ({
    url,
    type: 'image',
    alt: `${title} image ${imageIndex + 1}`,
  }));
  const content = `---\n`
    + `title: ${stringify(title)}\n`
    + `category: ${stringify(category)}\n`
    + `brand: ${stringify(brand)}\n`
    + (sku ? `sku: ${stringify(sku)}\n` : '')
    + `cover: ${stringify(cover)}\n`
    + `media: ${stringify(media)}\n`
    + `description: ${stringify(title)}\n`
    + `tags: ${stringify(tags)}\n`
    + `featured: false\n`
    + `published: true\n`
    + `sortOrder: ${index}\n`
    + `---\n\n${title}\n`;

  await writeFile(destination, content, 'utf8');
  created += 1;
}

console.log(`Created ${created} product files; skipped ${skipped}.`);
