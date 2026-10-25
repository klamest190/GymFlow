import { AnimatePresence, m } from 'framer-motion'
import { LogOut, Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth, useSession } from '../../auth/authContext'
import { Wordmark } from '../ui/Wordmark'
import { useTheme } from '../../hooks/useUi'
import { repository } from '../../services/repository'
import { tabsFor, type TabId } from './tabs'
import { snap } from '../../lib/motion'

interface AppShellProps {
  tab: TabId
  onTabChange: (tab: TabId) => void
  children: ReactNode
}

export function AppShell({ tab, onTabChange, children }: AppShellProps) {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div className="relative mx-auto flex max-w-[1440px]">
        <Sidebar tab={tab} onTabChange={onTabChange} />
        <main className="min-w-0 flex-1 px-4 pb-36 pt-[calc(env(safe-area-inset-top)+20px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {/* Each tab starts at the top, reset while the old one is already faded out (no visible jump). */}
          <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0 })}>
            <m.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
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

function Sidebar({ tab, onTabChange }: Omit<AppShellProps, 'children'>) {
  const { isDark, toggle } = useTheme()
  const { profile, isAdmin } = useSession()
  const { signOut } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line px-4 py-8 lg:flex">
      <div className="px-3">
        <Wordmark />
      </div>
      <nav className="mt-10 flex flex-col gap-0.5">
        {tabsFor(isAdmin).map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                active ? 'bg-sunken text-fg' : 'text-muted hover:bg-sunken hover:text-fg'
              }`}
            >
              {active && (
                <m.span
                  layoutId="sidebar-active"
                  className="absolute inset-y-2 left-0 w-1 rounded-full bg-accent"
                  transition={snap}
                />
              )}
              <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="mt-auto space-y-1">
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium text-muted transition hover:bg-sunken hover:text-fg"
        >
          {isDark ? 'Dunkel' : 'Hell'}
          {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </button>
        <div className="flex items-center gap-3 border-t border-line px-3 pt-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{profile.displayName}</p>
            <p className="truncate text-[12px] text-muted">
              {repository.mode === 'firebase' ? profile.email : 'Demo-Modus (lokal)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-sunken hover:text-danger"
            aria-label="Abmelden"
            title="Abmelden"
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function TabBar({ tab, onTabChange }: Omit<AppShellProps, 'children'>) {
  const { isAdmin } = useSession()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-solid pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabsFor(isAdmin).map(({ id, label, icon: Icon }) => {
          const active = id === tab
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                active ? 'text-fg' : 'text-muted'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <m.span
                  layoutId="tabbar-active"
                  className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-accent"
                  transition={snap}
                />
              )}
              <m.span whileTap={{ scale: 0.85 }}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
              </m.span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
