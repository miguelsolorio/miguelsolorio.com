import type { ReactNode } from 'react'

export interface SectionHeadingProps {
  /** Which heading scale to use: 'featured' (Featured Work), 'side' (Projects), or 'about' (About me). */
  variant: 'featured' | 'side' | 'about'
  /** Heading text. */
  children: ReactNode
  /** When true (the default) zeroes the site's clamp margin-top so the heading sits flush; pass false to keep the page-section spacing. */
  flush?: boolean
}

const variantClass: Record<SectionHeadingProps['variant'], string> = {
  featured: 'section section--work section--featured-work',
  side: 'section section--work section--side-projects',
  about: 'section section--work section--about',
}

/** The home page's section titles (Featured Work, Projects, About me), each at its own clamp type scale. */
export function SectionHeading({ variant, children, flush = true }: SectionHeadingProps) {
  return (
    <h2 className={variantClass[variant]} style={flush ? { marginTop: 0 } : undefined}>
      {children}
    </h2>
  )
}
