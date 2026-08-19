---
category: Navigation
---

The site's Cmd+K palette in its open state, rendered in flow without the fixed overlay or backdrop.

```tsx
<CommandPalette
  query="gem"
  sections={[{ label: 'Featured Work', items: [{ label: 'Gemini CLI', active: true }] }]}
/>
```

Composition notes:

- Omit `sections` to get the site's real palette: Tools, Featured Work, and Projects with the first row active.
- Rows pick a stroke glyph by label. Real palette labels (CLI Agents, Onboarding, Kanvas Design System, Icons) keep their site glyphs; unrecognized labels fall back to a grid glyph.
- The input is read only. `query` fills its value, and the placeholder shows when it's unset.
- `width` sets an inline max width (default 640). The palette also keeps the site's fluid `calc(100% - 2rem)` width, so it shrinks in narrow cells.
- Results taller than 380px scroll inside the panel, same as the site.
- A row labeled "Clear Recents" renders muted, matching the site's hidden action.
- Dark styling comes from a `.dark` ancestor, so wrap in `<SiteShell theme="dark">` for the dark look.
