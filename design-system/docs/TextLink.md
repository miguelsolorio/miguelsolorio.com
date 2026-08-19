---
category: Foundation
---

An inline anchor that picks up the site's wipe underline from the surrounding `.site-content` scope: underlined blue at rest, a full color wipe on hover.

```tsx
<p>
  I love <TextLink href="/code/">developer tools</TextLink> and open source.
</p>
```

It needs a `SiteShell` (or any `.site-content` ancestor) to get the treatment; the preview harness provides one. `quiet` adds the hero summary's `home-hero-hobbies-link` class, which softens the underline tint and offset the way the "picking up new hobbies" link does. On the site that class doesn't escape the wipe rule, so quiet keeps the wipe and this mirrors it. Dark palettes come from the shell's `.dark` ancestor, so never hardcode them.
