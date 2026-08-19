---
category: Foundation
---

A keyboard key chip, styled like the shortcut hints in the command palette footer.

```tsx
<Kbd keys={['⌘', 'K']} />
```

Each string in `keys` renders as its own chip. The wrapper carries the `cmd-palette-footer` class the site CSS scopes to, with the footer bar's padding, border, and background reset inline, so chips drop into any line of text. Dark styling comes from the `.dark` ancestor for free.
