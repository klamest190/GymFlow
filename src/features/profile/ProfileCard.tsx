import type { ReactNode } from 'react'

/** Section with title and optional description, for content that needs room (e.g. the weight chart). */
export function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <h2 className="headline text-[25px]">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** A titled part of the profile page ("Training", "App"). */
export function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h2 className="headline px-1 pt-4 text-[31px]">{title}</h2>
      {children}
    </section>
  )
}

/** Settings as rows on one surface, separated by hairlines instead of a card each. */
export function SettingsList({ children }: { children: ReactNode }) {
  return <div className="glass divide-y divide-line rounded-3xl px-4 sm:px-5">{children}</div>
}

/** One setting. `inline`: the control sits to the right of the text (wraps below on narrow screens). */
export function SettingRow({
  title,
  description,
  inline,
  children,
}: {
  title: string
  description?: string
  inline?: boolean
  children: ReactNode
}) {
  return (
    <div className={`py-4 ${inline ? 'flex flex-wrap items-center justify-between gap-x-6 gap-y-3' : ''}`}>
      <div className="min-w-0 max-w-md">
        <h3 className="text-[16px] font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      <div className={inline ? 'shrink-0' : 'mt-3'}>{children}</div>
    </div>
  )
}
