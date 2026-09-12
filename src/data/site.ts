import settings from './site.json';

const whatsappUrl = import.meta.env.PUBLIC_WHATSAPP_URL?.trim() || settings.whatsapp;

export const site = {
  name: settings.name,
  tagline: settings.tagline,
  hero: settings.hero,
  contact: { whatsapp: whatsappUrl, email: 'mailto:' + settings.email },
};
export const categorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
