# Repository Guidelines

## Project Structure & Module Organization

This is a Hugo portfolio styled with Tailwind CSS. Content pages live in `content/` as Markdown with TOML front matter; `_index.md` drives the home page. Templates live in `layouts/`: `_default/` provides page shells, `partials/` holds shared header, navigation, footer, and intro sections, and `shortcodes/` embeds media.

Source styles and browser code live in `assets/`. `assets/css/main.css` is the Tailwind entry point and imports page/component styles. Keep shared browser behavior in `assets/js/common.js` and home-page behavior in `assets/js/home.js`. Put copied media and standalone demos in `static/`, grouped by content slug (for example, `static/notebooks/`). Never edit generated `public/` or `resources/`.

## Build, Test, and Development Commands

- `npm install` installs the local Hugo, Tailwind, and PostCSS toolchain.
- `npm run develop` starts Hugo at `http://localhost:1313`, includes drafts, and refreshes static assets reliably.
- `npm run export` creates a clean, minified production site in `public/`.

Run `npm run export` before requesting review.

## Coding Style & Naming Conventions

Follow the conventions in the file you edit. Use two-space indentation in JavaScript and configuration; indent nested HTML and Hugo blocks consistently. Prefer kebab-case for content, CSS, and asset names (for example, `kustomer-design-system.md` and `command-palette.css`).

Use Tailwind utilities for small template-level adjustments and named CSS classes for reusable or complex styling. Keep page-specific media under the matching slug directory. Preserve meaningful `alt` text and existing `title` and `aria-*` attributes on media and controls. Avoid duplicating shared JavaScript helpers between `common.js` and page scripts.

## Testing Guidelines

There is no automated test suite or coverage requirement. Treat `npm run export` as the required validation step. For visual or interactive changes, use `npm run develop` to check affected pages at desktop and mobile widths, including dark mode, keyboard interaction, and reduced-motion behavior. Check the browser console and ensure referenced static assets do not return 404s.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, sentence-style summaries, such as `Add cell animation and demo system` or `Refactor code structure`. Keep each commit focused on one coherent change. Pull requests should explain the user-visible result, list touched pages or components, and note the local build result. Include before/after screenshots or recordings for layout, animation, or responsive changes, and link related issues when available.
