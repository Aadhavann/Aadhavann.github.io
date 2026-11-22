// @ts-check

import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://aadhavann.github.io',
	integrations: [sitemap()],
	build: {
		inlineStylesheets: 'auto',
	},
	markdown: {
		shikiConfig: {
			theme: 'github-light',
		},
	},
});
