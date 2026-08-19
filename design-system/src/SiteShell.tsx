import type { ReactNode } from 'react'

export interface SiteShellProps {
  /** Color scheme; 'dark' adds the site's `.dark` ancestor class so dark styles apply. */
  theme?: 'light' | 'dark'
  /** Pads the shell by 32px, on by default. */
  padded?: boolean
  /** Preview content rendered inside the `.site-content` scope. */
  children?: ReactNode
}

/** The ambient page shell that recreates the site's body font, text color, and background gradient and provides the `.site-content` scope previews render inside. */
export function SiteShell({ theme = 'light', padded = true, children }: SiteShellProps) {
  const dark = theme === 'dark'
  return (
    <div className={dark ? 'dark' : undefined}>
      <div
        className="site-content"
        style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          minHeight: '100%',
          background: dark
            ? 'linear-gradient(180deg, #161320 0%, #1a1626 48%, #110e1a 100%)'
            : 'linear-gradient(180deg, #f2f0ff 0%, #f8f7ff 45%, #f5f5f5 100%)',
          color: dark ? '#a79fb8' : '#334155',
          fontSize: 16,
          lineHeight: 1.5,
          padding: padded ? 32 : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
