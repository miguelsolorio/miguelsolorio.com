import type { ReactNode } from 'react'

export interface SideProjectCardProps {
  /** Project name shown under the icon. */
  title: string
  /** Short summary, clamped to two lines by the card styles. */
  description: string
  /** External link for the card; opens in a new tab like the site. */
  href?: string
  /** 56px icon; use an img element like the site does, since an img child keeps the card excluded from the text-link styling. Defaults to a placeholder img tile. */
  icon?: ReactNode
  /** Footer metrics with preformatted values, separated by dots. */
  metrics?: Array<{ type: 'installs' | 'users' | 'likes' | 'rating'; value: string; count?: string }>
}

type Metric = NonNullable<SideProjectCardProps['metrics']>[number]

function metricAriaLabel(metric: Metric): string {
  if (metric.type === 'rating') {
    return metric.count
      ? `${metric.value} out of 5 rating from ${metric.count} reviews`
      : `${metric.value} out of 5 rating`
  }
  return `${metric.value} ${metric.type}`
}

function metricIcon(type: Metric['type']) {
  if (type === 'likes') {
    return (
      <svg className="side-project-metric-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 13.25S2.5 10.1 2.5 6.25A2.75 2.75 0 0 1 7.17 4.3L8 5.2l.83-.9a2.75 2.75 0 0 1 4.67 1.95c0 3.85-5.5 7-5.5 7Z" />
      </svg>
    )
  }
  if (type === 'rating') {
    return (
      <svg className="side-project-metric-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="m8 2.25 1.62 3.28 3.63.53-2.63 2.56.62 3.61L8 10.53l-3.24 1.7.62-3.61-2.63-2.56 3.63-.53L8 2.25Z" />
      </svg>
    )
  }
  return (
    <svg className="side-project-metric-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 2.5v7m0 0 2.75-2.75M8 9.5 5.25 6.75M3 11.5v1.25c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25V11.5" />
    </svg>
  )
}

const placeholderSvg =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'>" +
  "<rect width='56' height='56' rx='14' fill='%23ede9fe'/>" +
  "<circle cx='24.5' cy='24.5' r='2.4' fill='%238b5cf6'/>" +
  "<circle cx='31.5' cy='24.5' r='2.4' fill='%238b5cf6'/>" +
  "<circle cx='24.5' cy='31.5' r='2.4' fill='%238b5cf6'/>" +
  "<circle cx='31.5' cy='31.5' r='2.4' fill='%238b5cf6'/>" +
  '</svg>'

const placeholderIcon = (
  <img
    src={`data:image/svg+xml,${placeholderSvg}`}
    alt=""
    width={56}
    height={56}
    style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto', display: 'block' }}
  />
)

/**
 * Small project card from the home page grid, with an icon, a clamped description, and a metrics footer.
 */
export function SideProjectCard({ title, description, href = '#', icon, metrics }: SideProjectCardProps) {
  return (
    <div style={{ width: 232 }}>
      <a className="side-project" href={href} target="_blank" rel="noopener noreferrer">
        {icon ?? placeholderIcon}
        <p className="side-project-title">{title}</p>
        <p className="side-project-description">{description}</p>
        {metrics && metrics.length > 0 ? (
          <div className="side-project-metrics">
            {metrics.flatMap((metric, index) => {
              const item = (
                <span
                  key={`metric-${index}`}
                  className={`side-project-metric side-project-metric--${metric.type}`}
                  aria-label={metricAriaLabel(metric)}
                >
                  {metricIcon(metric.type)}
                  <span aria-hidden="true">{metric.value}</span>
                  {metric.count ? (
                    <span className="side-project-metric-count" aria-hidden="true">
                      ({metric.count})
                    </span>
                  ) : null}
                </span>
              )
              if (index === 0) {
                return [item]
              }
              return [
                <span key={`separator-${index}`} className="side-project-metric-separator" aria-hidden="true" />,
                item,
              ]
            })}
          </div>
        ) : null}
      </a>
    </div>
  )
}
