import { SiteHeader, SiteShell } from 'miguelsolorio-ui'

export const Light = () => <SiteHeader />

export const Dark = () => (
  <SiteShell theme="dark">
    <SiteHeader />
  </SiteShell>
)
