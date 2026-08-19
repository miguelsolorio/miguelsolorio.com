---
category: Foundation
---

The page shell every preview renders inside: the site's Inter stack, body text color, ambient gradient, and the `.site-content` scope that link and component styles expect.

```tsx
<SiteShell theme="dark">
  <p>I like making things and design is one of the ways I like expressing it.</p>
</SiteShell>
```

The preview harness already wraps every cell in a light shell, so reach for it directly only for a dark story or an unpadded canvas. Nesting a dark shell inside the light one is fine. Set `padded={false}` when a component supplies its own spacing.
