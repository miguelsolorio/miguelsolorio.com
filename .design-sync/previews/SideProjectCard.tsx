import { SideProjectCard, SiteShell } from 'miguelsolorio-ui'

export const Symbols = () => (
  <SideProjectCard
    title="Symbols"
    description="A colorful file icon theme that makes projects easier to scan in VS Code"
    href="https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols"
    metrics={[
      { type: 'installs', value: '893k' },
      { type: 'rating', value: '4.9', count: '43' },
    ]}
  />
)

export const FluentIcons = () => (
  <SideProjectCard
    title="Fluent Icons"
    description="A Fluent-inspired product icon theme that refreshes the VS Code interface"
    href="https://marketplace.visualstudio.com/items?itemName=miguelsolorio.fluent-icons"
    metrics={[
      { type: 'installs', value: '1.8M' },
      { type: 'rating', value: '5.0', count: '31' },
    ]}
  />
)

export const DarkSymbols = () => (
  <SiteShell theme="dark">
    <SideProjectCard
      title="Symbols"
      description="A colorful file icon theme that makes projects easier to scan in VS Code"
      href="https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols"
      metrics={[
        { type: 'installs', value: '893k' },
        { type: 'rating', value: '4.9', count: '43' },
      ]}
    />
  </SiteShell>
)
