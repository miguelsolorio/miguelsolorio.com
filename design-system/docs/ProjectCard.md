---
category: Cards
---

The featured work card from the home page: a full-width link with an outlined title floating over an aurora surface.

```tsx
<ProjectCard title="Gemini CLI" href="/cli-agents/" theme="cli" />
```

Hover fills the outline and zooms the aurora; both are CSS-only transitions from `project.css`, so they work live. The card stretches to its container's width and clamps its own height, so drop it in a sized column like the site's content grid. The `cli` theme swaps in the Gemini CLI artwork via `data-project-theme`; the default theme keeps the plain aurora. Dark colors come from a `.dark` ancestor, which `SiteShell` provides.
