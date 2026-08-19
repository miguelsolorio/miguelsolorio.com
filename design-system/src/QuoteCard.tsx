import type { ReactNode } from 'react'

const logos: Record<'twitter' | 'github' | 'reddit' | 'hackernews', { label: string; svg: ReactNode }> = {
  twitter: {
    label: 'Twitter',
    svg: (
      <svg viewBox="0 0 24 24">
        <path
          fill="#1DA1F2"
          d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z"
        />
      </svg>
    ),
  },
  github: {
    label: 'GitHub',
    svg: (
      <svg viewBox="0 0 50 50">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.9255 1C11.1423 1 0 12.2245 0 26.1107C0 37.2107 7.13928 46.6066 17.0434 49.9321C18.2816 50.1821 18.7352 49.3918 18.7352 48.727C18.7352 48.1449 18.6944 46.1495 18.6944 44.0704C11.7607 45.5673 10.3168 41.077 10.3168 41.077C9.20255 38.1668 7.55153 37.4189 7.55153 37.4189C5.28214 35.8806 7.71684 35.8806 7.71684 35.8806C10.2342 36.0469 11.5551 38.4582 11.5551 38.4582C13.7832 42.2827 17.3735 41.202 18.8179 40.5367C19.024 38.9153 19.6847 37.7929 20.3862 37.1694C14.8561 36.5872 9.03776 34.4255 9.03776 24.7801C9.03776 22.0362 10.0276 19.7913 11.5959 18.0454C11.3485 17.4219 10.4816 14.8439 11.8439 11.3934C11.8439 11.3934 13.9485 10.7281 18.6939 13.9709C20.7256 13.4213 22.8208 13.1416 24.9255 13.1393C27.0301 13.1393 29.1755 13.4306 31.1566 13.9709C35.9026 10.7281 38.0071 11.3934 38.0071 11.3934C39.3694 14.8439 38.502 17.4219 38.2546 18.0454C39.8643 19.7913 40.8133 22.0362 40.8133 24.7801C40.8133 34.4255 34.9949 36.5454 29.4235 37.1694C30.3316 37.9592 31.1153 39.4556 31.1153 41.8255C31.1153 45.1929 31.0745 47.8954 31.0745 48.7265C31.0745 49.3918 31.5286 50.1821 32.7663 49.9327C42.6704 46.6061 49.8097 37.2107 49.8097 26.1107C49.8505 12.2245 38.6673 1 24.9255 1Z"
        />
      </svg>
    ),
  },
  reddit: {
    label: 'Reddit',
    svg: (
      <svg viewBox="0 0 24 24">
        <path
          fill="#FF4500"
          d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z"
        />
      </svg>
    ),
  },
  hackernews: {
    label: 'Hacker News',
    svg: (
      <svg viewBox="0 0 24 24">
        <rect width="24" height="24" rx="4" fill="#FF6600" />
        <path
          fill="#fff"
          d="M11.06 13.6 7.42 6.8h1.9l2.12 4.28c.03.07.07.15.11.23l.07.15.05.11.03.08.09.19.08.18.14-.3.16-.34.06-.11.1-.22c.05-.08.08-.16.12-.23L14.6 6.8h1.98l-3.68 6.87v4.53h-1.84V13.6Z"
        />
      </svg>
    ),
  },
}

const fallbackAvatar = (
  <span
    className="quote-avatar quote-avatar--fallback"
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9999 }}
  >
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
      <circle cx="24" cy="19" r="8.5" fill="currentColor" />
      <path
        fill="currentColor"
        d="M24 31c-8.4 0-14.4 5-15.6 12.2A23.9 23.9 0 0 0 24 48c5.9 0 11.3-2.1 15.6-4.8C38.4 36 32.4 31 24 31Z"
      />
    </svg>
  </span>
)

export interface QuoteCardProps {
  /** Name shown bold on the byline. */
  name: string
  /** Handle shown under the name, like @svpino or r/GeminiAI. */
  handle?: string
  /** Platform whose logo sits at the right edge of the header. */
  source?: 'twitter' | 'github' | 'reddit' | 'hackernews'
  /** Avatar element, like an img with className "quote-avatar"; defaults to the gray person circle. */
  avatar?: ReactNode
  /** Quote body; wrap highlighted phrases in mark elements. */
  children: ReactNode
}

/** Testimonial card mirroring the site's quote shortcode: avatar, byline, platform logo, and quote text with optional highlights. */
export function QuoteCard({ name, handle, source, avatar, children }: QuoteCardProps) {
  const logo = source ? logos[source] : undefined
  return (
    <div className="single" style={{ display: 'block' }}>
      <div className="quote-card" style={{ maxWidth: 700, marginInline: 0 }}>
        <div className="quote-header">
          {avatar ?? fallbackAvatar}
          <span className="quote-byline">
            <b className="quote-name">{name}</b>
            {handle && <span className="quote-handle">{handle}</span>}
          </span>
          {logo && (
            <>
              <span className="quote-logo" aria-hidden="true">
                {logo.svg}
              </span>
              <span className="sr-only">on {logo.label}</span>
            </>
          )}
        </div>
        <div className="quote-text">
          <p>{children}</p>
        </div>
      </div>
    </div>
  )
}
