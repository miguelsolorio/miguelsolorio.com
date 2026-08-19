---
category: Foundation
---

The bio's tinted phrase highlight, a colored mark that flips to its dark palette under a dark ancestor.

```tsx
<BioHighlight color="c1">making things</BioHighlight>
```

Colors run c1 green, c2 blue, c3 orange, c4 purple, c5 gold. The component wraps its mark in an inline `#bio` span because the site defines the `--bio-c*` variables on that id, so you can compose several inline in a paragraph the way the real bio does.
