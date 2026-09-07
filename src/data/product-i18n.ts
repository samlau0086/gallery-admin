export type LocalizedString = string | Record<string, string | undefined> | undefined;

export const defaultLocale = 'en';
export const supportedProductLocales = ['en', 'es', 'zh'] as const;
export type ProductLocale = (typeof supportedProductLocales)[number];

export function productLocaleFromUrl(url: URL): ProductLocale {
  return supportedProductLocales.includes(url.searchParams.get('lang') as ProductLocale) ? (url.searchParams.get('lang') as ProductLocale) : defaultLocale;
}

export function localizedValue(value: LocalizedString, locale: string, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;
  return value[locale] || value[defaultLocale] || Object.values(value).find(Boolean) || fallback;
}

export function localizedProduct<T extends { title?: LocalizedString; description?: LocalizedString; category?: LocalizedString }>(product: T, locale: string) {
  const title = localizedValue(product.title, locale);
  const description = localizedValue(product.description, locale, title);
  const category = localizedValue(product.category, locale);
  return { ...product, title, description, category };
}
