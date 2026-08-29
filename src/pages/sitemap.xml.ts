import { getCollection } from 'astro:content';
import { siteUrl } from '../data/seo';

export const prerender = true;

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
}[character] ?? character));

export async function GET() {
  const products = await getCollection('products', ({ data }) => data.published);
  const urls = [
    `${siteUrl}/`,
    ...products.map(({ id }) => `${siteUrl}/products/${id.replace(/\.md$/, '')}/`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
