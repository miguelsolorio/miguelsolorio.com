import { SiteShell, TextLink } from 'miguelsolorio-ui'

export const Resting = () => (
  <p style={{ margin: 0, maxWidth: '38rem' }}>
    I&#39;m a software designer who loves <TextLink href="/code/">developer tools</TextLink>, design systems, and open source.
  </p>
)

export const Quiet = () => (
  <p className="home-hero-summary" style={{ marginTop: 0 }}>
    When I&#39;m not vibe coding I&#39;m either exploring new places, trying new foods,
    or <TextLink href="#about" quiet>picking up new hobbies</TextLink> I probably don&#39;t need.
  </p>
)

export const Dark = () => (
  <SiteShell theme="dark">
    <p style={{ margin: 0, maxWidth: '38rem' }}>
      I&#39;m a software designer who loves developer tools, <TextLink href="/kustomer-design-system/">design systems</TextLink>, and open source.
    </p>
  </SiteShell>
)
