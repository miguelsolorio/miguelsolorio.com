---
category: Foundation
---

The home page's section titles (Featured Work, Projects, About me), each variant at its own clamp type scale.

```tsx
<SectionHeading variant="featured">Featured Work</SectionHeading>
```

On the site, `.section` adds a clamp margin-top of 5rem to 8rem between page sections. `flush` defaults to true and zeroes it so the heading sits sanely in a card; pass `flush={false}` to keep the real page rhythm when stacking full sections.
