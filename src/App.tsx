import { AnimatePresence, m } from 'framer-motion'
import { Dumbbell } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useAuth, useSession } from './auth/authContext'
import { AppShell } from './components/layout/AppShell'
import type { TabId } from './components/layout/tabs'
import { LoginScreen } from './features/auth/LoginScreen'
import { NoAccessScreen } from './features/auth/NoAccessScreen'
import { GamificationProvider } from './features/gamification/GamificationProvider'
import { OnboardingContext } from './features/onboarding/onboardingContext'
import { DailyTracker } from './features/tracker/DailyTracker'
import { useDelayedFlag } from './hooks/useDelayedFlag'
import { repository } from './services/repository'

// The start tab ships in the main bundle; the others (incl. Recharts) are separate chunks that
// are preloaded in the background right after start (see SignedInApp).
const TAB_MODULES = {
  exercises: () => import('./features/exercises/ExerciseCatalog'),
  stats: () => import('./features/stats/StatsDashboard'),
  profile: () => import('./features/profile/ProfilePage'),
  admin: () => import('./features/admin/AdminDashboard'),
}
const ExerciseCatalog = lazy(() => TAB_MODULES.exercises().then((m) => ({ default: m.ExerciseCatalog })))
const StatsDashboard = lazy(() => TAB_MODULES.stats().then((m) => ({ default: m.StatsDashboard })))
const ProfilePage = lazy(() => TAB_MODULES.profile().then((m) => ({ default: m.ProfilePage })))
const AdminDashboard = lazy(() => TAB_MODULES.admin().then((m) => ({ default: m.AdminDashboard })))
// Needed once per account, so it never weighs on the regular bundle.
const Onboarding = lazy(() => import('./features/onboarding/Onboarding').then((m) => ({ default: m.Onboarding })))

/** Downloads the other tabs once the browser is idle, so switching tabs never waits for code. */
function usePreloadTabs(isAdmin: boolean) {
  useEffect(() => {
    const preload = () => {
      for (const [id, load] of Object.entries(TAB_MODULES)) {
        // Offline or a failed download: no harm, the tab simply loads on its first visit.
        if (id !== 'admin' || isAdmin) load().catch(() => {})
      }
    }
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(preload, { timeout: 2000 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = window.setTimeout(preload, 1200)
    return () => window.clearTimeout(timer)
  }, [isAdmin])
}

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
  const { user, profile } = useSession()
  const [tab, setTab] = useState<TabId>('today')
  // A demoted admin must not stay on the admin tab.
  const activeTab = tab === 'admin' && !isAdmin ? 'today' : tab
  usePreloadTabs(isAdmin)

  // The tour shows until users/{uid}.onboardingCompletedAt is set, so it appears exactly once
  // per account, on any device. `dismissed` hides it right away even if the write is still
  // queued (offline); if the write fails, it simply comes back on the next start.
  const [dismissed, setDismissed] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const showOnboarding = replaying || (profile.onboardingCompletedAt === null && !dismissed)
  const notYetCompleted = profile.onboardingCompletedAt === null
  const finishOnboarding = useCallback(() => {
    setReplaying(false)
    setDismissed(true)
    if (notYetCompleted) {
      repository.completeOnboarding(user.uid).catch((error) => console.error('[GymFlow] saving onboarding failed', error))
    }
  }, [notYetCompleted, user.uid])
  const replayOnboarding = useCallback(() => setReplaying(true), [])

  return (
    // Above the tabs, so a level-up is celebrated right where the set was logged.
    <GamificationProvider>
      <OnboardingContext.Provider value={replayOnboarding}>
        <AppShell tab={activeTab} onTabChange={setTab}>
          <Suspense fallback={<TabSkeleton />}>
            {activeTab === 'today' && <DailyTracker />}
            {activeTab === 'exercises' && <ExerciseCatalog />}
            {activeTab === 'stats' && <StatsDashboard />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'profile' && <ProfilePage />}
          </Suspense>
        </AppShell>
        <Suspense fallback={null}>
          <AnimatePresence>{showOnboarding && <Onboarding key="onboarding" onDone={finishOnboarding} />}</AnimatePresence>
        </Suspense>
      </OnboardingContext.Provider>
    </GamificationProvider>
  )
}

/** Only if a tab's code is really still downloading (normally preloaded): appears late and softly. */
function TabSkeleton() {
  const visible = useDelayedFlag(true)
  return (
    <m.div
      className="mx-auto max-w-6xl"
      aria-busy
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="skeleton h-4 w-32 rounded-full" />
      <div className="skeleton mt-3 h-10 w-56 rounded-2xl" />
      <div className="glass mt-8 h-64 rounded-3xl" />
    </m.div>
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
