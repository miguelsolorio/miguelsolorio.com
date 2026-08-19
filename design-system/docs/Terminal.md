---
category: Terminal
---

The home hero's terminal window, rendered as a static transcript with the site's default `history` and `status` output baked in.

```tsx
<Terminal title="miguelsolorio.com" width={368}>
  <p className="home-hero-row">
    <span className="t-ps1">~</span> <span className="t-cmd">npm run build</span>
  </p>
  <p className="home-hero-row is-spaced">
    <span className="t-ok">done in 1.2s</span>
  </p>
</Terminal>
```

## Composing output

`<Terminal />` with no children renders the default transcript. Pass rows as children to replace it. Every row is a `<p className="home-hero-row">`; add `is-spaced` to open a blank-line gap above a row. Color comes from spans inside the row:

- `t-ps1` green prompt tilde
- `t-cmd` bright command text
- `t-out` default output text
- `t-ok` green success text
- `t-dim` dim gray text
- `t-scope` cyan label text (there's no `t-cyan` class, so use `t-scope` for cyan)
- `t-added` green added-file line
- `t-modified` yellow modified-file line
- `t-deleted` red status label
- `t-deleted-file` red filename with strikethrough
- `t-error` red error text
- `t-hash` purple text
- `t-muted` dim gray text, same color as `t-dim`

Rows keep whitespace (`pre-wrap`), so align columns by padding strings with spaces, and add `style={{whiteSpace: 'pre'}}` to a row when it must not wrap. `showInput={false}` drops the resting prompt line. The palette flips automatically under a `.dark` ancestor, so never hardcode terminal colors.
