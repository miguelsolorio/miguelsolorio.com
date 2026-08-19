import { SectionHeading, SiteShell } from 'miguelsolorio-ui'

export const FeaturedWork = () => <SectionHeading variant="featured">Featured Work</SectionHeading>

export const Projects = () => <SectionHeading variant="side">Projects</SectionHeading>

export const AboutMe = () => <SectionHeading variant="about">About me</SectionHeading>

export const Dark = () => (
  <SiteShell theme="dark">
    <SectionHeading variant="featured">Featured Work</SectionHeading>
  </SiteShell>
)
