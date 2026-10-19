import { Dumbbell, TriangleAlert } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { SessionProvider } from './components/layout/SessionProvider'
import type { TabId } from './components/layout/tabs'
import { DailyTracker } from './features/tracker/DailyTracker'

// The start tab ships in the main bundle; the others (incl. Recharts) load on first visit.
const ExerciseCatalog = lazy(() => import('./features/exercises/ExerciseCatalog').then((m) => ({ default: m.ExerciseCatalog })))
const StatsDashboard = lazy(() => import('./features/stats/StatsDashboard').then((m) => ({ default: m.StatsDashboard })))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))

export default function App() {
  const [tab, setTab] = useState<TabId>('today')

  return (
    <SessionProvider fallback={(state) => <SplashScreen error={state.status === 'error' ? state.message : null} />}>
      <AppShell tab={tab} onTabChange={setTab}>
        <Suspense fallback={<TabSkeleton />}>
          {tab === 'today' && <DailyTracker />}
          {tab === 'exercises' && <ExerciseCatalog />}
          {tab === 'stats' && <StatsDashboard />}
          {tab === 'profile' && <ProfilePage />}
        </Suspense>
      </AppShell>
    </SessionProvider>
  )
}

function TabSkeleton() {
  return (
    <div className="mx-auto max-w-6xl" aria-busy>
      <div className="h-4 w-32 animate-pulse rounded-full bg-sunken" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded-2xl bg-sunken" />
      <div className="glass mt-8 h-64 animate-pulse rounded-3xl" />
    </div>
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
