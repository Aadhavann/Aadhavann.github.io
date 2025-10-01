/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(240, 255, 255)',
            '--tw-prose-headings': 'rgb(240, 255, 255)',
            '--tw-prose-lead': 'rgb(240, 255, 255)',
            '--tw-prose-links': '#00ff41',
            '--tw-prose-bold': 'rgb(240, 255, 255)',
            '--tw-prose-counters': '#00ff41',
            '--tw-prose-bullets': '#00ff41',
            '--tw-prose-hr': 'rgba(0, 255, 65, 0.3)',
            '--tw-prose-quotes': 'rgb(240, 255, 255)',
            '--tw-prose-quote-borders': '#00ff41',
            '--tw-prose-captions': 'rgb(170, 170, 180)',
            '--tw-prose-code': '#00ff41',
            '--tw-prose-pre-code': 'rgb(240, 255, 255)',
            '--tw-prose-pre-bg': 'rgba(8, 8, 12, 0.9)',
            '--tw-prose-th-borders': 'rgba(0, 255, 65, 0.3)',
            '--tw-prose-td-borders': 'rgba(0, 255, 65, 0.2)',
            color: 'rgb(240, 255, 255)',
            maxWidth: 'none',
            h1: {
              color: 'rgb(240, 255, 255)',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            },
            h2: {
              color: 'rgb(240, 255, 255)',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            },
            h3: {
              color: 'rgb(240, 255, 255)',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            },
            h4: {
              color: 'rgb(240, 255, 255)',
              textShadow: '0 0 10px rgba(0, 255, 65, 0.3)',
            },
            strong: {
              color: 'rgb(240, 255, 255)',
              fontWeight: '700',
            },
            a: {
              color: '#00ff41',
              '&:hover': {
                color: '#00cc33',
              },
            },
            code: {
              color: '#00ff41',
              backgroundColor: 'rgba(18, 18, 24, 0.8)',
              borderRadius: '4px',
              padding: '2px 5px',
              border: '1px solid rgba(0, 255, 65, 0.3)',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

