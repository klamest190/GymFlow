import type { ReactNode } from 'react'

export interface TabIconProps {
  className?: string
  strokeWidth?: number
}

export type TabIcon = (props: TabIconProps) => ReactNode

/** Same frame as the Lucide icons elsewhere (24 grid, round joins), so both sit side by side. */
function Frame({ className, strokeWidth = 2, children }: TabIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** "Heute": a weight plate with its hub, like the mark of the wordmark. */
export const PlateIcon: TabIcon = (props) => (
  <Frame {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
  </Frame>
)

/** "Übungen": a dumbbell with two plates a side, as on the figure. */
export const DumbbellIcon: TabIcon = (props) => (
  <Frame {...props}>
    <path d="M8 12h8" />
    <rect x="5" y="6.5" width="3" height="11" rx="1" />
    <rect x="16" y="6.5" width="3" height="11" rx="1" />
    <path d="M3 9.5v5M21 9.5v5" />
  </Frame>
)

/** "Statistik": plates stacked into rising columns. */
export const PlateStackIcon: TabIcon = (props) => (
  <Frame {...props}>
    <path d="M4 19.5h4M4 15h4M10 19.5h4M10 15h4M10 10.5h4M16 19.5h4M16 15h4M16 10.5h4M16 6h4" />
  </Frame>
)

/** "Profil": head and shoulders. */
export const ProfileIcon: TabIcon = (props) => (
  <Frame {...props}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M4.5 20.5c.6-3.8 3.6-6.25 7.5-6.25s6.9 2.45 7.5 6.25" />
  </Frame>
)

/** "Admin": a shield. */
export const ShieldIcon: TabIcon = (props) => (
  <Frame {...props}>
    <path d="M12 3.25 19 6v5.25c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6z" />
    <path d="m9.25 12 2 2 3.5-3.75" />
  </Frame>
)
