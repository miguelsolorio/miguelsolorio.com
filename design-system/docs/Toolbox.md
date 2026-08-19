---
category: Navigation
---

The row of tool logos and labels that closes the home page bio section.

```tsx
<Toolbox names={['Claude Code', 'Figma', 'Raycast']} />
```

## Composition notes

- Ships its own hidden SVG symbol defs, so it renders standalone anywhere.
- `names` filters the built-in set: Claude Code, Codex, Ghostty, OpenCode, Figma, Arc, Raycast. Order always follows the site, not the array.
- VS Code, Oh My Pi, and CleanShot from the live partial are left out (external image, gradient defs, and an oversized symbol).
- Mark colors, their dark variants, and the label underline sweep on hover all come from `toolbox.css`. Items wrap on narrow containers.
