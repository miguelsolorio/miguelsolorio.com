import { Kbd, SiteShell } from 'miguelsolorio-ui'

export const SingleKey = () => <Kbd keys={['↵']} />

export const CommandK = () => <Kbd keys={['⌘', 'K']} />

export const Escape = () => <Kbd keys={['esc']} />

export const Dark = () => (
  <SiteShell theme="dark">
    <Kbd keys={['⌘', 'K']} />
  </SiteShell>
)
