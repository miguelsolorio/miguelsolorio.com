import { SiteShell, Terminal } from 'miguelsolorio-ui'

export const Resting = () => <Terminal />

export const NpmInstall = () => (
  <Terminal title="~/Developer/miguelsolorio.com">
    <p className="home-hero-row">
      <span className="t-ps1">~</span> <span className="t-cmd">npm install miguelsolorio-ui</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-out">added 3 packages, and audited 4 packages in 1s</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-dim">1 package is looking for funding</span>
    </p>
    <p className="home-hero-row">
      <span className="t-dim">{'  run `npm fund` for details'}</span>
    </p>
    <p className="home-hero-row is-spaced">
      <span className="t-ok">found 0 vulnerabilities</span>
    </p>
  </Terminal>
)

export const TranscriptOnly = () => <Terminal showInput={false} />

export const Dark = () => (
  <SiteShell theme="dark">
    <Terminal />
  </SiteShell>
)
