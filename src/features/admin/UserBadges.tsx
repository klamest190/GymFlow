import { CircleCheck, CircleOff, Crown } from 'lucide-react'
import type { UserProfile } from '../../types/models'

const initials = (user: Pick<UserProfile, 'displayName' | 'email'>) =>
  (user.displayName || user.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

/** Initials avatar; admins get the accent fill. */
export function UserAvatar({ user, size = 'md' }: { user: UserProfile; size?: 'md' | 'lg' }) {
  const admin = user.role === 'admin'
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold tracking-tight ${
        size === 'lg' ? 'size-16 text-[22px]' : 'size-10 text-[14px]'
      } ${admin ? 'bg-accent text-accent-ink' : 'bg-sunken text-fg'} ${user.status === 'disabled' ? 'opacity-50' : ''}`}
      aria-hidden
    >
      {initials(user)}
    </span>
  )
}

export function RoleBadge({ role }: { role: UserProfile['role'] }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[12px] font-semibold text-accent-fg">
        <Crown className="size-3" strokeWidth={2.5} />
        Admin
      </span>
    )
  }
  return <span className="inline-flex rounded-full bg-sunken px-2.5 py-1 text-[12px] font-semibold text-muted">Nutzer</span>
}

/** Status with icon + label, so it never relies on color alone. */
export function StatusBadge({ status }: { status: UserProfile['status'] }) {
  const active = status === 'active'
  const Icon = active ? CircleCheck : CircleOff
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-medium ${active ? 'text-accent-fg' : 'text-danger'}`}>
      <Icon className="size-3.5" strokeWidth={2.5} />
      {active ? 'Aktiv' : 'Gesperrt'}
    </span>
  )
}
