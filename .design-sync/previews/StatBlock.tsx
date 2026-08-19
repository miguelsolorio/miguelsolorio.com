import { SiteShell, StatBlock } from 'miguelsolorio-ui'

export const RepoActivityGrid = () => (
  <div style={{ maxWidth: '50rem' }}>
    <StatBlock
      source="google-gemini/gemini-cli"
      stats={[
        { value: '59', label: 'Pull requests opened', tone: 'pr' },
        { value: '39', label: 'Pull requests merged', tone: 'merge' },
        { value: '44', label: 'Commits on main', tone: 'commit' },
        { value: '22', label: 'Issues filed', tone: 'issue' },
      ]}
    />
  </div>
)

export const SingleStatWithUpPill = () => (
  <div style={{ maxWidth: '50rem' }}>
    <StatBlock
      stats={[
        {
          value: '82%',
          label: 'User satisfaction rating',
          pill: { direction: 'up', children: '18%' },
        },
      ]}
    />
  </div>
)

export const DarkRepoActivityGrid = () => (
  <SiteShell theme="dark">
    <div style={{ maxWidth: '50rem' }}>
      <StatBlock
        source="google-gemini/gemini-cli"
        stats={[
          { value: '59', label: 'Pull requests opened', tone: 'pr' },
          { value: '39', label: 'Pull requests merged', tone: 'merge' },
          { value: '44', label: 'Commits on main', tone: 'commit' },
          { value: '22', label: 'Issues filed', tone: 'issue' },
        ]}
      />
    </div>
  </SiteShell>
)
