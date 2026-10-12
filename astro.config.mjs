import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    routes: {
      extend: {
        exclude: ['/catalog-pages/*', '/catalog-query/*', '/search-index/*', '/product-data/*'].map((pattern) => ({ pattern })),
      },
    },
  }),
  site: 'https://gallery.maesvanti.online',
});
