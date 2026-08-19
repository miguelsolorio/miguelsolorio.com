# Design system canvas

Source for the Claude Design canvas at https://claude.ai/code/artifact/c9e43b0a-bc91-411e-8c71-30b695a2290e

Six artboards documenting the site's tokens and components, with every value pulled from `assets/css`:

- `Main.dc.html` cover
- `Colors.dc.html` brand, light and dark themes, terminal palettes, highlights, toolbox accents
- `Typography.dc.html` Inter and JetBrains Mono faces plus the full scale
- `Foundations.dc.html` radius, elevation, glass, layout metrics, motion
- `ComponentsLight.dc.html` and `ComponentsDark.dc.html` header, links, terminal, palette, cards, stats
- `canvas.json` artboard layout and launch view

Each `.dc.html` file is one artboard. To update the published canvas, edit these files and ask Claude to re-seed and save the design canvas from `docs/design-system`. When the site's styles change, update the values here to match; nothing syncs automatically.
