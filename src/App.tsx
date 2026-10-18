import { Dumbbell, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import type { TabId } from './components/layout/tabs'
import { ComingSoon } from './features/ComingSoon'
import { ExerciseCatalog } from './features/exercises/ExerciseCatalog'
import { DailyTracker } from './features/tracker/DailyTracker'
import { SessionProvider } from './components/layout/SessionProvider'

export default function App() {
  const [tab, setTab] = useState<TabId>('today')

  return (
    <SessionProvider fallback={(state) => <SplashScreen error={state.status === 'error' ? state.message : null} />}>
      <AppShell tab={tab} onTabChange={setTab}>
        {tab === 'today' && <DailyTracker />}
        {tab === 'exercises' && <ExerciseCatalog />}
        {tab === 'stats' && (
          <ComingSoon title="Statistik" description="Wochenvolumen, Aktivitäts-Heatmap und Muskelgruppen-Verteilung." />
        )}
        {tab === 'profile' && <ComingSoon title="Profil" description="Ziele, Einstellungen und Konto-Verknüpfung." />}
      </AppShell>
    </SessionProvider>
  )
}

function SplashScreen({ error }: { error: string | null }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex flex-col items-center text-center">
        <div className={`grid size-16 place-items-center rounded-2xl ${error ? 'bg-danger/15 text-danger' : 'animate-pulse bg-accent text-accent-ink shadow-accent'}`}>
          {error ? <TriangleAlert className="size-7" /> : <Dumbbell className="size-7" strokeWidth={2.5} />}
        </div>
        {error && (
          <>
            <h1 className="mt-5 text-xl font-bold tracking-tight">Anmeldung fehlgeschlagen</h1>
            <p className="mt-1.5 max-w-sm text-[15px] text-muted">
              Ist „Anonym“ unter Firebase Console → Authentication → Anmeldemethoden aktiviert?
            </p>
            <code className="mt-4 max-w-sm rounded-xl bg-sunken px-3 py-2 text-[12px] text-muted">{error}</code>
          </>
        )}
      </div>
    </div>
  )
}
