import { Dumbbell } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { useAuth } from './auth/authContext'
import { AppShell } from './components/layout/AppShell'
import type { TabId } from './components/layout/tabs'
import { LoginScreen } from './features/auth/LoginScreen'
import { NoAccessScreen } from './features/auth/NoAccessScreen'
import { DailyTracker } from './features/tracker/DailyTracker'

// The start tab ships in the main bundle; the others (incl. Recharts) load on first visit.
const ExerciseCatalog = lazy(() => import('./features/exercises/ExerciseCatalog').then((m) => ({ default: m.ExerciseCatalog })))
const StatsDashboard = lazy(() => import('./features/stats/StatsDashboard').then((m) => ({ default: m.StatsDashboard })))
const ProfilePage = lazy(() => import('./features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))

/** Auth gate: every screen behind it can rely on an active, signed-in account (useSession). */
export default function App() {
  const { state } = useAuth()

  switch (state.status) {
    case 'loading':
      return <SplashScreen />
    case 'signed-out':
      return <LoginScreen />
    case 'no-access':
      return <NoAccessScreen email={state.user.email} reason={state.reason} />
    case 'signed-in':
      // Keyed by uid so switching accounts never leaks state (tab, drafts) from the previous user.
      return <SignedInApp key={state.user.uid} isAdmin={state.isAdmin} />
  }
}

function SignedInApp({ isAdmin }: { isAdmin: boolean }) {
  const [tab, setTab] = useState<TabId>('today')
  // A demoted admin must not stay on the admin tab.
  const activeTab = tab === 'admin' && !isAdmin ? 'today' : tab

  return (
    <AppShell tab={activeTab} onTabChange={setTab}>
      <Suspense fallback={<TabSkeleton />}>
        {activeTab === 'today' && <DailyTracker />}
        {activeTab === 'exercises' && <ExerciseCatalog />}
        {activeTab === 'stats' && <StatsDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'profile' && <ProfilePage />}
      </Suspense>
    </AppShell>
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

function SplashScreen() {
  return (
    <div className="grid min-h-dvh place-items-center p-6" aria-busy>
      <div className="grid size-16 animate-pulse place-items-center rounded-2xl bg-accent text-accent-ink shadow-accent">
        <Dumbbell className="size-7" strokeWidth={2.5} />
      </div>
    </div>
  )
}
