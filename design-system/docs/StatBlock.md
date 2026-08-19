---
category: Content
---

A metrics band that mirrors the site's stats shortcode: a mono repo line above a responsive grid of big tabular numbers with tone glyphs and optional trend pills.

```tsx
<StatBlock
  source="google-gemini/gemini-cli"
  stats={[
    { value: '59', label: 'Pull requests opened', tone: 'pr' },
    { value: '39', label: 'Pull requests merged', tone: 'merge' },
    { value: '44', label: 'Commits on main', tone: 'commit' },
    { value: '22', label: 'Issues filed', tone: 'issue' },
  ]}
/>
```

Tones map to the shortcode's GitHub glyphs and colors: `pr`, `merge`, `commit`, `issue`, and `issue-closed`. Omit `tone` to drop the icon. Give a stat `pill: { direction: 'up', children: '18%' }` to badge its value with a trend caret; `down` flips the caret and turns the pill red. `source` renders as a JetBrains Mono link to the GitHub repo. The component brings its own `.single` wrapper and no width cap, so constrain the parent near `50rem` to match the article measure.
