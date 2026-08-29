export const siteUrl = 'https://gallery.maesvanti.online';

export const absoluteUrl = (pathOrUrl: string) => new URL(pathOrUrl, siteUrl).href;

export const toMetaDescription = (value = '', maxLength = 155) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

export const productSeoTitle = (product: { brand?: string; category?: string; sku?: string; title: string }) => {
  const label = [product.brand, product.category, product.sku ? `SKU ${product.sku}` : ''].filter(Boolean).join(' ');
  return label || toMetaDescription(product.title, 58);
};
