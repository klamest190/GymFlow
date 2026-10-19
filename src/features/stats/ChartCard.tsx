import { ChartNoAxesColumn } from 'lucide-react'
import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Controls in the card header (segmented controls, selects). */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** Glass card that frames every dashboard chart with a consistent header. */
export function ChartCard({ title, subtitle, actions, className = '', children }: ChartCardProps) {
  return (
    <section className={`glass flex min-w-0 flex-col rounded-3xl p-4 sm:p-5 ${className}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

/** Shown inside a chart card when the selected period has no data. */
export function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-sunken/60 px-6 py-8 text-center text-[14px] text-muted">
      <ChartNoAxesColumn className="size-6 opacity-60" />
      {children}
    </div>
  )
}

/** Glass tooltip used by all Recharts charts. */
export function TooltipCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-solid/95 px-3.5 py-2.5 text-[13px] shadow-float backdrop-blur-xl">
      <div className="font-semibold">{title}</div>
      <div className="mt-0.5 space-y-0.5 text-muted">{children}</div>
    </div>
  )
}
