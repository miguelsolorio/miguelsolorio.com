---
category: Cards
---

The small project card from the home page grid, with an icon, a two-line description, and a metrics footer.

```tsx
<SideProjectCard
  title="Symbols"
  description="A colorful file icon theme that makes projects easier to scan in VS Code"
  href="https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols"
  metrics={[
    { type: 'installs', value: '893k' },
    { type: 'rating', value: '4.9', count: '43' },
  ]}
/>
```

Metric values are preformatted strings ("893k", "1.8M", "4.9") and a dot separator renders between metrics automatically; `count` adds the parenthesized review count. Pass `icon` to replace the placeholder tile, make it an `img` element like the site does (an `img` child keeps the card excluded from the text-link styling), and size it yourself (56px, 14px radius, centered) since the site scopes image sizing under `#side-projects`. The card presents at 232px wide and links out in a new tab.
