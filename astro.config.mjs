import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dominio público: se usa en el sitemap, la URL canónica y las vistas previas al compartir
  site: 'https://itcoffee.simfcoh.com',
  integrations: [
    tailwind(),
    sitemap({ filter: (page) => !page.includes('/404') }),
  ],
  output: 'static',
});
