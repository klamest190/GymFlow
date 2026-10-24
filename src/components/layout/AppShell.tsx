import { AnimatePresence, m } from 'framer-motion'
import { Dumbbell, LogOut, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth, useSession } from '../../auth/authContext'
import { useTheme } from '../../hooks/useUi'
import { repository } from '../../services/repository'
import { tabsFor, type TabId } from './tabs'

interface AppShellProps {
  tab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ tab, onTabChange, children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <AmbientBackground />
      <div className="relative mx-auto flex max-w-[1440px]">
        <Sidebar tab={tab} onTabChange={onTabChange} />
        <main className="min-w-0 flex-1 px-4 pb-36 pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {/* Each tab starts at the top, reset while the old one is already faded out (no visible jump). */}
          <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
            <m.div
              key={tab}
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </main>
      </div>
      <TabBar tab={tab} onTabChange={onTabChange} />
    </div>
  )
}

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-40 size-[520px] rounded-full bg-(--glow-a) blur-[120px]" />
      <div className="absolute -right-40 top-1/3 size-[560px] rounded-full bg-(--glow-b) blur-[140px]" />
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-ink shadow-accent">
        <Dumbbell className="size-5" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        Gym<span className="text-accent-fg">Flow</span>
      </span>
    </div>
  )
}

function Sidebar({ tab, onTabChange }: Omit<AppShellProps, 'children'>) {
  const { isDark, toggle } = useTheme()
  const { profile, isAdmin } = useSession()
  const { signOut } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 p-4 lg:block">
      <div className="glass flex h-full flex-col rounded-4xl p-4">
        <div className="px-2 pt-2">
          <Logo />
        </div>
        <nav className="mt-10 flex flex-col gap-1">
          {tabsFor(isAdmin).map(({ id, label, icon: Icon }) => {
            const active = id === tab
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] font-medium transition-colors ${
                  active ? 'text-accent-ink' : 'text-muted hover:bg-sunken hover:text-fg'
                }`}
              >
                {active && (
                  <m.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-accent shadow-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={active ? 2.5 : 2} />
                <span className="relative">{label}</span>
              </button>
            )
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold tracking-tight">{profile.displayName}</p>
              <p className="truncate text-[12px] text-muted">
                {repository.mode === 'firebase' ? profile.email : 'Demo-Modus (lokal)'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-solid hover:text-danger"
              aria-label="Abmelden"
              title="Abmelden"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-[15px] font-medium text-muted transition hover:bg-sunken hover:text-fg"
          >
            {isDark ? 'Dunkel' : 'Hell'}
            <m.span key={String(isDark)} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
              {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </m.span>
          </button>
        </div>
      </div>
    </aside>
  )
}

function TabBar({ tab, onTabChange }: Omit<AppShellProps, 'children'>) {
  const { isAdmin } = useSession()
  return (
    <nav className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 lg:hidden">
      <div className="glass mx-auto flex max-w-md items-center justify-between rounded-[28px] p-1.5 shadow-float">
        {tabsFor(isAdmin).map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] font-semibold transition-colors ${
                active ? 'text-accent-ink' : 'text-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <m.span
                  layoutId="tabbar-active"
                  className="absolute inset-0 rounded-[22px] bg-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <m.span className="relative" whileTap={{ scale: 0.85 }}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
              </m.span>
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
