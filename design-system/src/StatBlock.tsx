import type { ReactNode } from 'react'

const tones: Record<'pr' | 'merge' | 'commit' | 'issue' | 'issue-closed', { color: string; glyph: ReactNode }> = {
  pr: {
    color: '#3d90f9',
    glyph: (
      <>
        <circle cx="4.5" cy="4" r="1.6" />
        <path d="M4.5 5.6V13" />
        <circle cx="11.5" cy="12" r="1.6" />
        <path d="M11.5 10.4V3.2" />
        <path d="m9.6 5.1 1.9-1.9 1.9 1.9" />
      </>
    ),
  },
  merge: {
    color: '#7f46ff',
    glyph: (
      <>
        <circle cx="4.5" cy="4" r="1.6" />
        <path d="M4.5 5.6v4.1a2.4 2.4 0 0 0 2.4 2.4h2.9" />
        <circle cx="11.5" cy="12.1" r="1.6" />
      </>
    ),
  },
  commit: {
    color: '#0f9d58',
    glyph: (
      <>
        <path d="M1.6 8h3.8M10.6 8h3.8" />
        <circle cx="8" cy="8" r="2.6" />
      </>
    ),
  },
  issue: {
    color: '#f9ab00',
    glyph: (
      <>
        <circle cx="8" cy="8" r="5.7" />
        <path d="M8 5.3v3.1" />
        <path d="M8 10.6h.01" />
      </>
    ),
  },
  'issue-closed': {
    color: '#0f9d58',
    glyph: (
      <>
        <circle cx="8" cy="8" r="5.7" />
        <path d="m5.6 8.2 1.7 1.7 3.1-3.7" />
      </>
    ),
  },
}

const carets = {
  up: <path d="M5 1.2 9.2 8.4H.8z" />,
  down: <path d="M5 8.8.8 1.6h8.4z" />,
}

export interface StatBlockProps {
  /** GitHub owner/repo slug rendered as the mono source line linking to the repo. */
  source?: string
  /** Stat entries laid out in the responsive grid. */
  stats: Array<{
    /** Large tabular figure, like "59" or "82%". */
    value: string
    /** Short caption under the value. */
    label: string
    /** Glyph drawn beside the value in the shortcode's light color. */
    tone?: 'pr' | 'merge' | 'commit' | 'issue' | 'issue-closed'
    /** Trend badge rendered inside the value. */
    pill?: {
      /** Caret orientation, which also picks the pill color. */
      direction: 'up' | 'down'
      /** Badge text, usually a delta like "18%". */
      children: ReactNode
    }
  }>
}

/** Metrics band mirroring the site's stats shortcode: a mono repo line over a grid of large values with tone glyphs and trend pills. */
export function StatBlock({ source, stats }: StatBlockProps) {
  return (
    <div className="single" style={{ display: 'block' }}>
      <div className="stat-block">
        {source && (
          <p className="stat-source">
            <a href={`https://github.com/${source}`} target="_blank" rel="noopener noreferrer">
              {source}
            </a>
          </p>
        )}
        <div className="stat-grid">
          {stats.map((stat) => {
            const tone = stat.tone ? tones[stat.tone] : undefined
            return (
              <div className="stat" key={`${stat.value} ${stat.label}`}>
                {tone && (
                  <svg className="stat-icon" style={{ color: tone.color }} viewBox="0 0 16 16" aria-hidden="true">
                    {tone.glyph}
                  </svg>
                )}
                <div className="stat-text">
                  <b className="stat-value">
                    {stat.value}
                    {stat.pill && (
                      <>
                        <span className={`stat-pill stat-pill--${stat.pill.direction}`} aria-hidden="true">
                          <svg viewBox="0 0 10 10">{carets[stat.pill.direction]}</svg>
                          {stat.pill.children}
                        </span>
                        <span className="sr-only">
                          , {stat.pill.direction} {stat.pill.children}
                        </span>
                      </>
                    )}
                  </b>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
