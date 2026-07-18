# Repository Guidelines

## Project Structure & Module Organization

This repository is a Hugo portfolio styled with Tailwind CSS. Page content lives in `content/` as Markdown with TOML-style front matter. Shared Hugo templates are in `layouts/`: `_default/` contains page shells, `partials/` contains reusable sections, and `shortcodes/` contains Markdown helpers. Source styles and browser code live in `assets/css/` and `assets/js/`; `assets/css/main.css` is the CSS entry point. Place files that should be copied unchanged—images, videos, PDFs, and standalone demos—in `static/`, grouping project-specific media in matching subdirectories such as `static/notebooks/`. `public/` and `resources/` are generated and ignored; do not edit or commit them.

## Build, Test, and Development Commands

- `npm install` installs the pinned Hugo binary, Tailwind, PostCSS, and Autoprefixer dependencies.
- `npm run develop` starts Hugo at `http://localhost:1313`, includes draft content, and disables stale static caching.
- `npm run export` creates the minified production site in `public/`. Run this before opening a pull request.

The GitHub Pages workflow builds with Node 18 and Hugo 0.115.2, so avoid features that require newer runtime versions without updating CI.

## Coding Style & Naming Conventions

Follow the conventions in the file you edit. Use two-space indentation in JavaScript and configuration files; keep Hugo templates readable by indenting nested HTML and template blocks consistently. Prefer kebab-case for content, CSS, and asset names (`kustomer-design-system.md`, `command-palette.css`). Keep project media under a directory with the same slug. Use Tailwind utilities in templates for small adjustments and named CSS classes in `assets/css/` for reusable or complex behavior. Preserve accessible `alt`, `title`, and `aria-*` attributes on media and controls.

## Testing Guidelines

There is no automated test suite or coverage requirement. Treat `npm run export` as the required validation step. For visual changes, run the development server and review affected pages at desktop and mobile widths, including dark mode and interactive states. Check the browser console and verify that referenced static assets load without 404s.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, sentence-style summaries such as `Add ambient background variations` and `Refactor code structure`. Keep each commit focused on one coherent change. Pull requests should explain the user-visible result, list the pages or components touched, and note local build results. Include before/after screenshots or recordings for layout, animation, or responsive changes, and link relevant issues when available.
