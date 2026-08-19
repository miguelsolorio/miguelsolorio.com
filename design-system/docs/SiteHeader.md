---
category: Navigation
---

Sticky site header with the wordmark, LinkedIn and GitHub links, and the theme toggle, copied from the Hugo header and navigation partials.

```tsx
<SiteHeader />
```

## Composition notes

- Place it at the top of a page composition. It spans the full container width and sticks while content scrolls under it.
- `glass` (default `true`) bakes in the scrolled state: translucent background, hairline border, blur, and `--shadow-sm`. Pass `glass={false}` for the transparent resting state the site shows before any scroll.
- Dark glass comes from a small `<style>` tag scoped to `.dark .site-header`, so it re-skins automatically inside `<SiteShell theme="dark">`. That rule uses `!important` to beat the inline light values and applies to every glass header on the page.
- The theme toggle is static and always shows the sun icon. Hover states on the logo, social icons, and toggle come from the site CSS.
