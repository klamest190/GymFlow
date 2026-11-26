import { ChartNoAxesColumn, Cloud, Dumbbell, FileSpreadsheet, LayoutList, Lock, LogIn, type LucideIcon } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAuth, useSession } from '../../auth/authContext'
import { Sheet } from '../../components/ui/Sheet'
import { EXERCISE_COUNT } from '../../data/exercises'
import { useT, type Messages } from '../../i18n'
import { GUEST_EXERCISE_IDS } from '../../data/guest'
import { GuestGateContext, isExerciseLockedFor, type GuestGate, type LockedFeature } from './guestGate'

const LOCKED_COUNT = EXERCISE_COUNT - GUEST_EXERCISE_IDS.size

/** What an account adds to the guest mode, in the order a guest runs into it. */
const unlocks = ({ unlocks: texts }: Messages['guest']): { icon: LucideIcon; title: string; detail: string }[] => [
  { icon: Dumbbell, title: texts.exercises(EXERCISE_COUNT), detail: texts.exercisesDetail },
  { icon: ChartNoAxesColumn, title: texts.stats, detail: texts.statsDetail },
  { icon: LayoutList, title: texts.templates, detail: texts.templatesDetail },
  { icon: Cloud, title: texts.sync, detail: texts.syncDetail },
  { icon: FileSpreadsheet, title: texts.export, detail: texts.exportDetail },
]

const reasonFor = (feature: LockedFeature, texts: Messages['guest']) => {
  switch (feature.kind) {
    case 'exercise':
      return texts.reasonExercise(feature.exercise.name, LOCKED_COUNT - 1)
    case 'stats':
      return texts.reasonStats
    case 'templates':
      return texts.reasonTemplates
    case 'export':
      return texts.reasonExport
    case 'all':
      return texts.reasonAll(GUEST_EXERCISE_IDS.size, EXERCISE_COUNT)
  }
}

/** Provides the guest gate below the signed-in gate and owns the one upgrade sheet. */
export function GuestGateProvider({ children }: { children: ReactNode }) {
  const { isGuest } = useSession()
  const [feature, setFeature] = useState<LockedFeature | null>(null)
  const t = useT()
  // Kept while the sheet animates out, so its text doesn't vanish mid-exit.
  const [shown, setShown] = useState<LockedFeature | null>(null)
  if (feature && feature !== shown) setShown(feature)

  const showUpgrade = useCallback((next: LockedFeature) => setFeature(next), [])
  const gate = useMemo<GuestGate>(
    () => ({ isGuest, isLocked: (exerciseId) => isExerciseLockedFor(isGuest, exerciseId), showUpgrade }),
    [isGuest, showUpgrade],
  )
  const close = useCallback(() => setFeature(null), [])

  return (
    <GuestGateContext.Provider value={gate}>
      {children}
      {isGuest && (
        <Sheet
          open={feature !== null}
          onClose={close}
          title={t.guest.sheetTitle}
          subtitle={shown ? reasonFor(shown, t.guest) : undefined}
          footer={<UpgradeActions onStay={close} />}
        >
          <UnlockList />
        </Sheet>
      )}
    </GuestGateContext.Provider>
  )
}

/** The list of what an account unlocks; also the body of locked pages. */
export function UnlockList() {
  const t = useT()
  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken">
        {unlocks(t.guest).map(({ icon: Icon, title, detail }) => (
          <li key={title} className="flex items-start gap-3.5 px-4 py-3.5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-surface-solid text-fg">
              <Icon className="size-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold">{title}</span>
              <span className="block text-[13px] leading-snug text-muted">{detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 px-1 text-[13px] leading-relaxed text-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        {t.guest.closedSystem}
      </p>
    </div>
  )
}

/** To the login (the guest data stays for a later visit), or carry on. */
export function UpgradeActions({ onStay }: { onStay?: () => void }) {
  const { signOut } = useAuth()
  const t = useT()
  return (
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98]"
      >
        <LogIn className="size-4.5" strokeWidth={2.5} />
        {t.guest.signInWithAccount}
      </button>
      {onStay && (
        <button
          type="button"
          onClick={onStay}
          className="flex-1 rounded-xl bg-sunken py-3.5 text-[16px] font-semibold transition hover:bg-surface-solid"
        >
          {t.guest.continueAsGuest}
        </button>
      )}
    </div>
  )
}
