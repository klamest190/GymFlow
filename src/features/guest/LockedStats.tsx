import { Lock } from 'lucide-react'
import { UnlockList, UpgradeActions } from './GuestGateProvider'

/** Height of each bar in the decorative chart, in percent. */
const PREVIEW_BARS = [34, 52, 41, 66, 58, 74, 49, 82, 70, 88, 63, 95]

/** The statistics tab of a guest: a still preview of the charts behind a lock. */
export function LockedStats() {
  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="headline text-[39px] lg:text-[49px]">Statistik</h1>
        <p className="mt-2 text-[15px] text-muted">Mit eigenem Zugang</p>
      </header>

      <section className="glass relative mt-6 overflow-hidden rounded-3xl p-5 lg:mt-8 lg:p-6">
        <div aria-hidden className="flex h-36 items-end gap-1.5 sm:gap-2.5">
          {PREVIEW_BARS.map((height, index) => (
            <span key={index} className="flex-1 rounded-t-md bg-fg/10" style={{ height: `${height}%` }} />
          ))}
        </div>
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-surface-solid via-surface-solid/70 to-transparent">
          <div className="flex flex-col items-center px-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-fg text-bg">
              <Lock className="size-5" strokeWidth={2.5} />
            </span>
            <h2 className="headline mt-3 text-[25px]">Dein Fortschritt auf einen Blick</h2>
            <p className="mt-1 max-w-sm text-[14px] text-muted">Wochen, Rekorde und Muskelverteilung siehst du mit eigenem Zugang.</p>
          </div>
        </div>
      </section>

      <div className="mt-4 space-y-4">
        <UnlockList />
        <UpgradeActions />
      </div>
    </div>
  )
}
