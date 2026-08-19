import type { ReactNode } from 'react'

export interface BioHighlightProps {
  /** Which bio accent to use: c1 green, c2 blue, c3 orange, c4 purple, c5 gold. */
  color: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'
  /** The highlighted phrase. */
  children: ReactNode
}

/** The bio's tinted phrase highlight, a colored mark that flips to its dark palette under a dark ancestor. */
export function BioHighlight({ color, children }: BioHighlightProps) {
  return (
    <span id="bio" style={{ display: 'inline' }}>
      <mark className={`bio-hl bio-hl--${color}`}>{children}</mark>
    </span>
  )
}
