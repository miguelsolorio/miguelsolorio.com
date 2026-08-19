# Building with miguelsolorio-ui

This library mirrors miguelsolorio.com: React wrappers over the site's real compiled CSS. Components carry the markup; almost all styling comes from `styles.css`.

## Wrap everything in SiteShell

Every screen goes inside `SiteShell`. It provides the Inter font stack, the ambient background gradient, the text color, and the `site-content` context that link styling depends on. Without it, text renders in a default font on white and `TextLink` loses its wipe treatment. Dark mode is `<SiteShell theme="dark">`, which sets the `dark` ancestor class the stylesheet keys on; never hand-pick dark colors, the CSS swaps them.

## Styling idiom

- Use the components for anything they cover, and style your own layout glue with inline styles (flex or grid plus gap). The stylesheet is precompiled from the site, so arbitrary utility class names will often not exist; inline styles always work.
- Shadows come from custom properties defined in `styles.css`: `var(--shadow-ring)`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-hover`. Compose like `boxShadow: 'var(--shadow-ring), var(--shadow-sm)'`.
- Brand constants: primary `#3429ff`, primary ink `#2a25ff`, link `#241bc7`, dark accent rose `#efa9ae`. Light neutrals are Tailwind slate (`#334155` text, `#64748b` muted, `#e2e8f0` borders on `#ffffff` surfaces); dark surfaces are `#201c28` with `#3a3444` borders.
- Cards are 16px radius with a 1px border, and hover lifts use `--shadow-hover`. Type is Inter with tight tracking at display sizes (700 to 800 weight, letter-spacing around -0.05em); mono is `'JetBrains Mono'` for terminal output, labels, and sources.
- Inside `Terminal`, compose rows with `<p className="home-hero-row">` (add `is-spaced` for a blank line above) and the color spans `t-ps1`, `t-cmd`, `t-out`, `t-ok`, `t-dim`, `t-scope`, `t-hash`, `t-added`, `t-modified`, `t-deleted`, `t-error`; they resolve from the `--t-*` palette in both themes.
- `BioHighlight` colors c1 to c5 are the only accent marks for running text.

## Where the truth lives

Read `styles.css` before inventing any style; it is the site's real compiled CSS plus the Google Fonts import. Each component's doc under `components/<group>/<Name>/` shows its props and a working composition, and its `.d.ts` is the API contract.

## Idiomatic example

```tsx
<SiteShell>
  <SiteHeader />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
    <SectionHeading variant="featured">Featured Work</SectionHeading>
    <ProjectCard title="Gemini CLI" theme="cli" href="/cli-agents/" />
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <Terminal />
      <StatBlock
        source="google-gemini/gemini-cli"
        stats={[
          { value: '59', label: 'Pull requests opened', tone: 'pr' },
          { value: '44', label: 'Commits on main', tone: 'commit' },
        ]}
      />
    </div>
  </div>
</SiteShell>
```

Components are static: interactive states render via props (`active`, `query`, `pill`), while hover treatments are real CSS and work on their own.
