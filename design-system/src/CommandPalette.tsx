import type { ReactNode } from 'react'

type GlyphName =
  | 'sun'
  | 'moon'
  | 'layers'
  | 'terminal'
  | 'shapes'
  | 'flag'
  | 'notebook'
  | 'clear'
  | 'grid'
  | 'compass'

const GLYPHS: Record<GlyphName, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  terminal: (
    <>
      <path d="m4 17 6-5-6-5" />
      <path d="M12 19h8" />
    </>
  ),
  shapes: (
    <>
      <circle cx="8" cy="8" r="5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4.5" />
      <path d="M5 5c3-1.8 6 1.2 9-.5v8.5c-3 1.7-6-1.3-9 .5Z" />
    </>
  ),
  notebook: (
    <>
      <path d="M6 2h13v20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M9 2v20" />
    </>
  ),
  clear: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" />
    </>
  )
}

const GLYPH_BY_LABEL: Record<string, GlyphName | undefined> = {
  'Toggle Dark Mode': 'moon',
  'Toggle Light Mode': 'sun',
  'Play Polarity': 'grid',
  'Colab Notebooks': 'notebook',
  'CLI Agents': 'terminal',
  'Gemini CLI': 'terminal',
  Onboarding: 'flag',
  'Kanvas Design System': 'layers',
  Icons: 'shapes',
  Navigator: 'compass',
  'Clear Recents': 'clear'
}

function glyphFor(label: string): GlyphName {
  return GLYPH_BY_LABEL[label] ?? 'grid'
}

const DEFAULT_SECTIONS: Array<{ label: string; items: Array<{ label: string; active?: boolean }> }> = [
  {
    label: 'Tools',
    items: [{ label: 'Toggle Dark Mode', active: true }, { label: 'Play Polarity' }]
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
      { label: 'Chroma Colors' },
      { label: 'Colorizer' },
      { label: 'VS Code Icons' },
      { label: 'Navigator' },
      { label: 'Regulator' },
      { label: 'Kaleidocode' },
      { label: 'Variables Generator' },
      { label: 'Syntaxer' },
      { label: 'Paster' },
      { label: 'Contrast Grid' },
      { label: 'Gradient Studio' },
      { label: 'VS Code Toolkit' }
    ]
  }
]

export interface CommandPaletteProps {
  /** Search text shown in the read-only input; the placeholder shows when omitted. */
  query?: string
  /** Grouped results rendered as category headers and rows; defaults to the site's real palette entries. */
  sections?: Array<{ label: string; items: Array<{ label: string; active?: boolean }> }>
  /** Inline max width for the palette, a pixel number or any CSS length; defaults to 640. */
  width?: number | string
}

/** The site's Cmd+K command palette in its open state, rendered in flow without the fixed overlay. */
export function CommandPalette({ query, sections = DEFAULT_SECTIONS, width = 640 }: CommandPaletteProps) {
  const rows: ReactNode[] = []
  let index = 0
  for (const section of sections) {
    rows.push(
      <div key={`header-${section.label}`} className="cmd-category-header" aria-hidden="true">
        {section.label}
      </div>
    )
    for (const item of section.items) {
      rows.push(
        <div
          key={`${section.label}-${item.label}`}
          className={item.active ? 'cmd-item active' : 'cmd-item'}
          role="option"
          aria-selected={item.active === true}
          data-id={item.label === 'Clear Recents' ? 'clear-recents' : undefined}
          data-index={index}
        >
          <span className="cmd-item-left">
            <span className="cmd-item-icobox" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {GLYPHS[glyphFor(item.label)]}
              </svg>
            </span>
            <span className="cmd-item-label">{item.label}</span>
          </span>
        </div>
      )
      index += 1
    }
  }

  return (
    <div
      id="cmd-palette"
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
      style={{ maxWidth: width, transform: 'none' }}
    >
      <input
        id="cmd-palette-input"
        type="text"
        placeholder="Search for commands..."
        autoComplete="off"
        spellCheck={false}
        aria-label="Search commands"
        readOnly
        value={query ?? ''}
      />
      <div id="cmd-palette-results" role="listbox" aria-label="Command results">
        {rows}
      </div>
      <div className="cmd-palette-footer" aria-hidden="true">
        <span className="cmd-footer-action">
          Select Item <kbd>↵</kbd>
        </span>
        <span className="cmd-footer-sep" />
        <span className="cmd-footer-action">
          Clear Recents <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </div>
    </div>
  )
}
