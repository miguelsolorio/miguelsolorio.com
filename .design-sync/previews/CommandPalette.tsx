import { CommandPalette, SiteShell } from 'miguelsolorio-ui'

export const Resting = () => <CommandPalette />

export const FilteredGemini = () => (
  <CommandPalette
    query="gem"
    sections={[{ label: 'Featured Work', items: [{ label: 'Gemini CLI', active: true }] }]}
  />
)

export const Dark = () => (
  <SiteShell theme="dark">
    <CommandPalette
      sections={[
        {
          label: 'Tools',
          items: [{ label: 'Toggle Light Mode', active: true }, { label: 'Play Polarity' }]
        },
        {
          label: 'Featured Work',
          items: [
            { label: 'Colab Notebooks' },
            { label: 'CLI Agents' },
            { label: 'Onboarding' },
            { label: 'Kanvas Design System' },
            { label: 'Icons' }
          ]
        },
        {
          label: 'Projects',
          items: [
            { label: 'Fluent Icons' },
            { label: 'Symbols' },
            { label: 'Min Theme' },
            { label: 'Navigator' }
          ]
        }
      ]}
    />
  </SiteShell>
)
