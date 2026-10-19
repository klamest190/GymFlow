import { motion } from 'framer-motion'
import { ChevronRight, Crown, Search, ShieldAlert, UserCheck, UserPlus, Users, UserX, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../../auth/authContext'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useAllUsers } from '../../hooks/useData'
import type { UserProfile } from '../../types/models'
import { CreateUserSheet } from './CreateUserSheet'
import { RoleBadge, StatusBadge, UserAvatar } from './UserBadges'
import { UserDetailSheet } from './UserDetailSheet'

type Filter = 'all' | 'active' | 'disabled'

const relative = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' })
const shortDate = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })

/** "vor 3 Tagen", "gestern", "vor 2 Stunden" … */
function formatLastSeen(timestamp: number | null): string {
  if (!timestamp) return 'Noch nie'
  const minutes = Math.round((timestamp - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return minutes === 0 ? 'Gerade eben' : relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return relative.format(days, 'day')
  return shortDate.format(timestamp)
}

/** User management: admins create, edit, disable and delete accounts. Gated in App.tsx and by the rules. */
export function AdminDashboard() {
  const { user: me } = useSession()
  const { users, error } = useAllUsers()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = users ?? []
  const term = search.trim().toLowerCase()
  const visible = all.filter(
    (user) =>
      (filter === 'all' || user.status === filter) &&
      (!term || user.displayName.toLowerCase().includes(term) || user.email.includes(term)),
  )
  // Looked up from the live list so the sheet reflects changes immediately.
  const selected = all.find((user) => user.id === selectedId) ?? null

  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: 'Nutzer gesamt', value: all.length, icon: Users },
    { label: 'Aktiv', value: all.filter((user) => user.status === 'active').length, icon: UserCheck },
    { label: 'Gesperrt', value: all.filter((user) => user.status === 'disabled').length, icon: UserX },
    { label: 'Admins', value: all.filter((user) => user.role === 'admin').length, icon: Crown },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Admin</p>
          <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Nutzerverwaltung</h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-full bg-accent p-3 text-[14px] font-semibold text-accent-ink shadow-accent transition hover:brightness-105 active:scale-95 sm:px-4 sm:py-2.5"
          aria-label="Nutzer anlegen"
        >
          <UserPlus className="size-5 sm:size-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">Nutzer anlegen</span>
        </button>
      </header>

      {error ? (
        <div className="glass mt-8 flex flex-col items-center rounded-3xl px-6 py-14 text-center">
          <ShieldAlert className="size-8 text-danger" />
          <h2 className="mt-4 text-[18px] font-bold tracking-tight">Nutzerliste nicht verfügbar</h2>
          <p className="mt-1 max-w-sm text-[15px] text-muted">
            Die Sicherheitsregeln haben den Zugriff abgelehnt. Sind die aktuellen Firestore-Rules deployt und ist dein Konto als
            Admin hinterlegt?
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
            {stats.map(({ label, value, icon: Icon }, index) => (
              <div key={label} className={`glass rounded-3xl p-4 lg:p-5 ${index === 0 ? 'ring-1 ring-accent/40' : ''}`}>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
                  <Icon className="size-3.5" strokeWidth={2.5} />
                  {label}
                </div>
                <AnimatedNumber value={value} className="mt-2 block text-[30px] font-bold leading-none tracking-tight" />
              </div>
            ))}
          </div>

          <div className="glass mt-4 flex flex-col gap-3 rounded-3xl p-3 lg:mt-5 lg:flex-row lg:items-center lg:p-4">
            <label className="flex flex-1 items-center gap-2.5 rounded-2xl bg-sunken px-3.5 py-3">
              <Search className="size-4.5 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name oder E-Mail suchen"
                type="search"
                className="w-full bg-transparent text-[16px] outline-none placeholder:text-muted"
              />
            </label>
            <div className="lg:w-80">
              <SegmentedControl<Filter>
                label="Status"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'Alle' },
                  { value: 'active', label: 'Aktiv' },
                  { value: 'disabled', label: 'Gesperrt' },
                ]}
              />
            </div>
          </div>

          {users === null ? (
            <div className="glass mt-4 h-64 animate-pulse rounded-3xl" aria-busy />
          ) : visible.length === 0 ? (
            <div className="glass mt-4 rounded-3xl px-6 py-14 text-center text-[15px] text-muted">Keine Nutzer gefunden.</div>
          ) : (
            <section className="glass mt-4 overflow-hidden rounded-3xl" aria-label="Nutzerliste">
              {/* Desktop column headers */}
              <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.2fr_1.2fr_24px] gap-4 border-b border-line px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted lg:grid">
                <span>Nutzer</span>
                <span>Rolle</span>
                <span>Status</span>
                <span>Zuletzt aktiv</span>
                <span>Angelegt</span>
                <span />
              </div>
              <ul className="divide-y divide-line">
                {visible.map((user, index) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === me.uid}
                    index={index}
                    onOpen={() => setSelectedId(user.id)}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <CreateUserSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <UserDetailSheet user={selected} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function UserRow({ user, isSelf, index, onOpen }: { user: UserProfile; isSelf: boolean; index: number; onOpen: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.025 } }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-sunken/60 lg:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.2fr_1.2fr_24px] lg:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <UserAvatar user={user} />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-tight">{user.displayName}</span>
              {isSelf && <span className="shrink-0 rounded-full bg-sunken px-2 py-0.5 text-[11px] font-semibold text-muted">Du</span>}
            </span>
            <span className="block truncate text-[13px] text-muted">{user.email}</span>
          </span>
        </span>

        {/* Mobile: compact meta on the right */}
        <span className="flex flex-col items-end gap-1 lg:hidden">
          <StatusBadge status={user.status} />
          <span className="text-[12px] text-muted">{formatLastSeen(user.lastLoginAt)}</span>
        </span>

        <span className="hidden lg:block">
          <RoleBadge role={user.role} />
        </span>
        <span className="hidden lg:block">
          <StatusBadge status={user.status} />
        </span>
        <span className="hidden text-[14px] text-muted lg:block">{formatLastSeen(user.lastLoginAt)}</span>
        <span className="hidden text-[14px] text-muted lg:block">{shortDate.format(user.createdAt)}</span>
        <ChevronRight className="hidden size-4 text-muted lg:block" />

        {user.role === 'admin' && (
          <span className="col-span-2 -mt-1 pl-[52px] lg:hidden">
            <RoleBadge role={user.role} />
          </span>
        )}
      </button>
    </motion.li>
  )
}
