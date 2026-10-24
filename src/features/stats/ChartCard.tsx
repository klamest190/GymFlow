import { m } from 'framer-motion'
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

/** Frosted-glass tooltip used by all Recharts charts; pops in with a small spring. */
export function TooltipCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
      className="min-w-44 rounded-2xl border border-line bg-surface px-3.5 py-3 text-[13px] shadow-float backdrop-blur-2xl backdrop-saturate-[1.8]"
    >
      <div className="font-semibold tracking-tight">{title}</div>
      {subtitle && <div className="text-[12px] text-muted">{subtitle}</div>}
      <div className="mt-2 space-y-1 text-muted">{children}</div>
    </m.div>
  )
}

/** Label/value line inside a TooltipCard; `highlight` marks the series the chart plots. */
export function TooltipRow({ label, value, highlight, swatch }: { label: string; value: ReactNode; highlight?: boolean; swatch?: string }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${highlight ? 'font-semibold text-fg' : ''}`}>
      <span className="flex items-center gap-1.5">
        {swatch && <span className="size-2 rounded-full" style={{ backgroundColor: swatch }} />}
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
