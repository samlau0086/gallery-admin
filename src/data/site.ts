import settings from './site.json';

export const site = {
  name: settings.name,
  tagline: settings.tagline,
  hero: settings.hero,
  contact: { whatsapp: settings.whatsapp, email: 'mailto:' + settings.email },
};
export const categorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
