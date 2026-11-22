# aadhavann.github.io

Personal academic site for Aadhavan P Anbumunee, deployed to GitHub Pages.

A single page, built with [Astro](https://astro.build). No content management
system, no framework CSS, no JavaScript on the page. Every fact on the site
lives in one file, `src/data/profile.ts`, so a change to a role, a date or a
link is made in one place and the templates stay free of content.

## Structure

```
src/
  data/profile.ts        all site content: profile, research, experience, projects
  pages/index.astro      the single page, sectioned by anchor
  components/            BaseHead (metadata), Header (anchor nav), Footer
  styles/global.css      the entire stylesheet, light and dark
public/
  fonts/                 Atkinson Hyperlegible, self-hosted
  research/              figures referenced by the research section
  resume.pdf             served at /resume.pdf
```

## Design

Minimal on purpose. One column held to a readable measure, one typeface
(Atkinson Hyperlegible, chosen for legibility and self-hosted so nothing is
fetched from a CDN), one restrained accent, hairline rules between sections.
Dark mode follows the operating system through `prefers-color-scheme`; there is
no toggle and no stored preference. A print stylesheet renders the page as a
usable document.

## Development

```bash
npm install
npm run dev      # local server
npm run build    # static build into dist/
npm run check    # astro check
```

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with Astro
and publishes `dist/` to GitHub Pages. There is nothing else to configure.

## Editing content

Edit `src/data/profile.ts`. A few notes on accuracy:

- The publication entry carries the full author list with the author order from
  the published record. Do not reorder it.
- Sstudize is presented under its own Entrepreneurship section, separate from
  Selected projects, because it is a company rather than a code artifact.
- Dates that could not be confirmed from a primary source are marked
  `UNVERIFIED` in a comment. Confirm them before treating them as settled.
