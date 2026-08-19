import type { ReactNode } from 'react'

export interface TextLinkProps {
  /** Destination URL or fragment. */
  href: string
  /** The link text. */
  children: ReactNode
  /** Adds the hero summary's `home-hero-hobbies-link` class for its softer underline tint. */
  quiet?: boolean
}

/** An inline anchor that inherits the site's wipe underline treatment from the nearest `.site-content` scope. */
export function TextLink({ href, children, quiet = false }: TextLinkProps) {
  return (
    <a href={href} className={quiet ? 'home-hero-hobbies-link' : undefined}>
      {children}
    </a>
  )
}
