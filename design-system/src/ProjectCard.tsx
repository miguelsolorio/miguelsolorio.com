export interface ProjectCardProps {
  /** Project title rendered as the outlined headline. */
  title: string
  /** Link destination for the card. */
  href?: string
  /** Aurora artwork theme; 'cli' applies the Gemini CLI surface and shadow tint. */
  theme?: 'default' | 'cli'
}

/**
 * Featured work card from the home page: an outlined title floating over an aurora surface that fills and zooms on hover.
 */
export function ProjectCard({ title, href = '#', theme = 'default' }: ProjectCardProps) {
  const themed = theme !== 'default'
  return (
    <a
      className={themed ? 'project project--themed' : 'project'}
      data-project-theme={themed ? theme : undefined}
      href={href}
    >
      <div className="project-media" aria-hidden="true" />
      <div className="project-meta">
        <p className="title">
          {title}{' '}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </p>
      </div>
    </a>
  )
}
