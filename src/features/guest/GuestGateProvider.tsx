import { ChartNoAxesColumn, Cloud, Dumbbell, FileSpreadsheet, LayoutList, Lock, LogIn, type LucideIcon } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useAuth, useSession } from '../../auth/authContext'
import { Sheet } from '../../components/ui/Sheet'
import { EXERCISES } from '../../data/exercises'
import { GUEST_EXERCISE_IDS } from '../../data/guest'
import { GuestGateContext, isExerciseLockedFor, type GuestGate, type LockedFeature } from './guestGate'

const LOCKED_COUNT = EXERCISES.length - GUEST_EXERCISE_IDS.size

/** What an account adds to the guest mode, in the order a guest runs into it. */
const UNLOCKS: { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: Dumbbell, title: `Alle ${EXERCISES.length} Übungen`, detail: 'Von Einsteiger bis Fortgeschritten, jede mit 3D-Animation.' },
  { icon: ChartNoAxesColumn, title: 'Statistik', detail: 'Volumen, Rekorde und Muskelverteilung über Wochen und Monate.' },
  { icon: LayoutList, title: 'Vorlagen', detail: 'Fertige Trainingstage und eigene, mit einem Tipp eingetragen.' },
  { icon: Cloud, title: 'Cloud-Sync', detail: 'Dein Training auf Handy und Rechner, gesichert in der Cloud.' },
  { icon: FileSpreadsheet, title: 'CSV-Export', detail: 'Deine Daten für Excel und Google Tabellen.' },
]

const reasonFor = (feature: LockedFeature) => {
  switch (feature.kind) {
    case 'exercise':
      return `„${feature.exercise.name}“ und ${LOCKED_COUNT - 1} weitere Übungen gibt es mit eigenem Zugang.`
    case 'stats':
      return 'Die Statistik gibt es mit eigenem Zugang.'
    case 'templates':
      return 'Vorlagen gibt es mit eigenem Zugang.'
    case 'export':
      return 'Den Export gibt es mit eigenem Zugang.'
    case 'all':
      return `Im Gastmodus nutzt du ${GUEST_EXERCISE_IDS.size} von ${EXERCISES.length} Übungen.`
  }
}

/** Provides the guest gate below the signed-in gate and owns the one upgrade sheet. */
export function GuestGateProvider({ children }: { children: ReactNode }) {
  const { isGuest } = useSession()
  const [feature, setFeature] = useState<LockedFeature | null>(null)
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
          title="Mehr mit eigenem Zugang"
          subtitle={shown ? reasonFor(shown) : undefined}
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
  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken">
        {UNLOCKS.map(({ icon: Icon, title, detail }) => (
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
        GymFlow ist ein geschlossenes System, Zugänge vergibt dein Admin. Was du als Gast einträgst, bleibt auf diesem Gerät.
      </p>
    </div>
  )
}

/** To the login (the guest data stays for a later visit), or carry on. */
export function UpgradeActions({ onStay }: { onStay?: () => void }) {
  const { signOut } = useAuth()
  return (
    <div className="flex flex-col gap-2 sm:flex-row-reverse">
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98]"
      >
        <LogIn className="size-4.5" strokeWidth={2.5} />
        Mit Zugang anmelden
      </button>
      {onStay && (
        <button
          type="button"
          onClick={onStay}
          className="flex-1 rounded-xl bg-sunken py-3.5 text-[16px] font-semibold transition hover:bg-surface-solid"
        >
          Weiter als Gast
        </button>
      )}
    </div>
  )
}
