# design-sync notes

- This repo is a Hugo + Tailwind static site, not a component library. The DS package is hand-authored at `design-system/` (React wrappers that copy the exact markup and class names from `layouts/partials` and `layouts/shortcodes`) and rides on the site's real compiled CSS.
- `design-system` has its own `node_modules` (react, esbuild, typescript); the repo root has none of these. Pass `--node-modules design-system/node_modules` and `--entry ./design-system/dist/index.es.js` to the converter.
- `dist/site.css` is compiled from `assets/css/main.css` with the root Tailwind (3.2.4, same as the Hugo build) plus a content override that adds `design-system/src` and `.design-sync/previews` so preview-only utilities exist. The `@import './x.css'` lines in main.css sit after the tailwind directives, so the Tailwind CLI silently drops them (Hugo inlines them via PostCSS `inlineImports`); `design-system/build-css.mjs` textually inlines them first. If site.css comes out ~17KB instead of ~90KB, that inlining broke. A Google Fonts `@import` for Inter and JetBrains Mono is prepended (the site itself relies on locally installed fonts and ships no `@font-face`), so `[FONT_REMOTE]` is expected.
- Components that copy `.single`-scoped markup (QuoteCard, StatBlock) wrap themselves in `<div class="single" style="display:block">` because `.single` is a grid on the site.
- Dark mode is class-based (`.dark` ancestor). `SiteShell` (the `cfg.provider`) supplies the ambient background, text color, font stack, and the `dark` class, replicating what the site sets on `body`/`html`.
- Playwright browsers live at `~/Library/Caches/ms-playwright` (macOS path, not `~/.cache`). Cached chromium build 1181 pins `playwright@1.54.0` in `.ds-sync`; installing latest playwright fails wanting build 1234.
- Miguel's global npm config points at a curated Google Artifact Registry that 403s packages. `design-system/.npmrc` and `.ds-sync/.npmrc` scope those installs to the public registry; without them installs fail (and `cmd | tail` masks the exit code, so check for real).
- The site header lives OUTSIDE `.site-content` on the site, and toolbox items are excluded from the link-wipe rule only in light. Inside preview shells both would pick up wipe styling, so `SiteHeader` and `Toolbox` carry small component `<style>` tags with id-specificity resets replicating their real context. Remove only if the preview context ever stops wrapping in `.site-content`.
- Two dark-mode cascade bugs (in-content links staying light blue, toolbox items rose-tiled) were found live during the first sync and fixed in commit 7197c5e by adding `:not(.toolbox-item)` to the dark link rules. Dark links now render rose in the DS. The SiteHeader and Toolbox style-tag compensations stay; they now guard only against the preview shells wrapping everything in `.site-content`.

## Known render warns

- `[GRID_OVERFLOW]` Terminal: resolved via `cfg.overrides.Terminal.cardMode: "column"`.
- `[FONT_REMOTE]` Inter and JetBrains Mono via the Google Fonts import prepended by build:css. Expected on every validate.

## Re-sync risks

- The compiled CSS depends on the ROOT tailwindcss (3.2.4) and `design-system/build-css.mjs` inlining; a Tailwind upgrade at the root or a restructuring of the `@import` chain in `assets/css/main.css` changes output silently. Compare `dist/site.css` size (~90 KB) when in doubt.
- CommandPalette's default sections and Terminal's default transcript are frozen copies of `assets/js/common.js` and `home.js` content. When Miguel adds projects or changes the terminal output, those defaults drift; refresh them by hand.
- SideProjectCard preview metrics are frozen from `data/project_metrics.json` (Symbols 893k/4.9, Fluent 1.8M/5.0) and drift as the JSON updates.
- Google Fonts serves Inter and JetBrains Mono at runtime ([FONT_REMOTE]); if that import is ever dropped from build:css, previews silently fall back to system fonts.
- Playwright in `.ds-sync` is pinned to 1.54.0 for the cached chromium 1181; a bare `npm i playwright` breaks the render check.
