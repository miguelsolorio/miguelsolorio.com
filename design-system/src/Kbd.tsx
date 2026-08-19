export interface KbdProps {
  /** Key labels, one chip per entry, e.g. ['⌘', 'K'] or ['↵']. */
  keys: string[]
}

/** Keyboard key chips styled like the shortcut hints in the command palette footer. */
export function Kbd({ keys }: KbdProps) {
  return (
    <span
      className="cmd-palette-footer"
      style={{ display: 'inline-flex', padding: 0, border: 0, background: 'transparent', gap: '3px' }}
    >
      {keys.map((label, index) => (
        <kbd key={index}>{label}</kbd>
      ))}
    </span>
  )
}
