import type { CSSProperties, ReactNode } from 'react'



const caretStyle: CSSProperties = {
  display: 'inline-block',
  width: '.55em',
  height: '1.3em',
  verticalAlign: '-.16em',
  marginLeft: '.375rem',
  background: 'var(--t-green)'
}

const hintStyle: CSSProperties = {
  color: 'var(--t-dim)',
  whiteSpace: 'pre',
  opacity: 0.8
}

const defaultOutput = (
  <>
    <p className="home-hero-row">
      <span className="t-ps1">~</span> <span className="t-cmd">miguelsolorio history</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-hash">2023-2026</span><span className="t-scope">{' google-colab:'}</span><span className="t-out">{' data science agents'}</span>
    </p>
    <p className="home-hero-row">
      <span className="t-hash">2025</span><span className="t-scope">{' gemini-cli:'}</span><span className="t-out">{' terminal agent'}</span>
    </p>
    <p className="home-hero-row">
      <span className="t-hash">2022-2023</span><span className="t-scope">{' meta:'}</span><span className="t-out">{' design systems'}</span>
    </p>
    <p className="home-hero-row">
      <span className="t-hash">2018-2022</span><span className="t-scope">{' vs-code:'}</span><span className="t-out">{' developer tools'}</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-ps1">~</span> <span className="t-cmd">miguelsolorio status</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-ok">On branch main</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-out">Changes to be committed:</span>
    </p>
    <p className="home-hero-row">
      <span className="t-deleted">{'  deleted    '}</span><span className="t-deleted-file">should-designers-code.md</span>
    </p>
    <p className="home-hero-row">
      <span className="t-modified">{'  modified   vibe-projects'}</span>
    </p>
    <p className="home-hero-row">
      <span className="t-added">{'  new file   next-chapter.md'}</span>
    </p>
  </>
)

export interface TerminalProps {
  /** Text centered in the terminal title bar. */
  title?: string
  /** Custom output rows that replace the default history and status transcript. */
  children?: ReactNode
  /** Renders the resting prompt line with the block caret and slash-command hint. */
  showInput?: boolean
  /** Width of the terminal window; numbers are treated as pixels. */
  width?: number | string
}

/** The home hero's portfolio terminal window rendered as a static transcript. */
export function Terminal({ title = 'miguelsolorio.com', children, showInput = true, width = 368 }: TerminalProps) {
  return (
    <aside className="home-hero-current" aria-label="Interactive portfolio terminal" style={{ width }}>
      <div className="home-hero-terminal-bar">
        <div className="home-hero-lights" aria-hidden="true"><i /><i /><i /></div>
        <div className="home-hero-terminal-title">{title}</div>
        <div />
      </div>
      <div className="home-hero-terminal-body">
        <div className="home-hero-terminal-output" role="log">
          {children ?? defaultOutput}
        </div>
        {showInput ? (
          <div className="home-hero-terminal-controls">
            <div className="home-hero-terminal-form">
              <span className="t-ps1" aria-hidden="true">~</span>
              <span aria-hidden="true" style={caretStyle} />
              <span aria-hidden="true" style={hintStyle}> use <span style={{ color: 'var(--t-cyan)' }}>/slash</span> for commands</span>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
