import { SiteShell } from 'miguelsolorio-ui'

export const Light = () => (
  <SiteShell>
    <p style={{ margin: 0, maxWidth: '38rem' }}>
      I like making things and design is one of the ways I like expressing it.
    </p>
  </SiteShell>
)

export const Dark = () => (
  <SiteShell theme="dark">
    <p style={{ margin: 0, maxWidth: '38rem' }}>
      I like making things and design is one of the ways I like expressing it.
    </p>
  </SiteShell>
)

export const Unpadded = () => (
  <SiteShell padded={false}>
    <p style={{ margin: 0, maxWidth: '38rem' }}>
      I enjoy ambiguous problems where the answer isn&#39;t obvious.
    </p>
  </SiteShell>
)
