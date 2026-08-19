import { ProjectCard, SiteShell } from 'miguelsolorio-ui'

export const Notebooks = () => <ProjectCard title="Notebooks" href="/notebooks/" />

export const GeminiCli = () => <ProjectCard title="Gemini CLI" href="/cli-agents/" theme="cli" />

export const DarkGeminiCli = () => (
  <SiteShell theme="dark">
    <ProjectCard title="Gemini CLI" href="/cli-agents/" theme="cli" />
  </SiteShell>
)
