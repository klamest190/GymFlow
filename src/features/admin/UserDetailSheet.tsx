import { AnimatePresence, m } from 'framer-motion'
import { KeyRound, LoaderCircle, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/toastContext'
import { repository } from '../../services/repository'
import { ACHIEVEMENTS } from '../../data/achievements'
import { RANK_BY_ID } from '../../data/ranks'
import { isValidUsername, normalizeUsername, USERNAME_RULES } from '../../lib/usernames'
import type { UserProfile, UserRole, UserStatus, UserUpdate } from '../../types/models'
import { LevelBadge } from '../gamification/RankBadge'
import { RoleBadge, StatusBadge, UserAvatar } from './UserBadges'

const xpFormatter = new Intl.NumberFormat('de-DE')
const dateTime = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function UserDetailSheet({ user, onClose }: { user: UserProfile | null; onClose: () => void }) {
  const { user: me } = useSession()
  const toast = useToast()
  const [busy, setBusy] = useState<'name' | 'username' | 'reset' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')

  // Keep the last user visible while the sheet animates out. Live list updates refresh the data,
  // but local edits are only reset when the sheet (re)opens or switches to another user.
  const [shown, setShown] = useState(user)
  const [previous, setPrevious] = useState<UserProfile | null>(null)
  if (user !== previous) {
    setPrevious(user)
    if (user) {
      setShown(user)
      if (!previous || previous.id !== user.id) {
        setName(user.displayName)
        setUsername(user.username ?? '')
        setConfirmDelete(false)
      }
    }
  }
  if (!shown) return null

  const isSelf = shown.id === me.uid
  const nameChanged = name.trim() !== shown.displayName && name.trim().length > 0
  const nextUsername = normalizeUsername(username)
  const usernameValid = isValidUsername(nextUsername)
  const usernameChanged = nextUsername !== (shown.username ?? '') && usernameValid

  const update = async (changes: UserUpdate, successTitle: string) => {
    try {
      await repository.updateUser(shown.id, changes)
      toast({ tone: 'success', title: successTitle })
    } catch (error) {
      toast({ tone: 'error', title: 'Änderung fehlgeschlagen', description: authErrorMessage(error) })
    }
  }

  const saveName = async () => {
    if (!nameChanged) return
    setBusy('name')
    await update({ displayName: name.trim() }, 'Name gespeichert')
    setBusy(null)
  }

  const saveUsername = async () => {
    if (!usernameChanged) return
    setBusy('username')
    try {
      await repository.setUsername(shown, nextUsername)
      toast({ tone: 'success', title: 'Benutzername gespeichert', description: `Anmeldung ab jetzt mit „${nextUsername}“.` })
    } catch (error) {
      toast({ tone: 'error', title: 'Benutzername nicht gespeichert', description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  const sendReset = async () => {
    setBusy('reset')
    try {
      await repository.sendPasswordReset(shown.email)
      toast({ tone: 'success', title: 'Link zum Zurücksetzen gesendet', description: shown.email })
    } catch (error) {
      toast({ tone: 'error', title: 'E-Mail nicht gesendet', description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  const deleteUser = async () => {
    setBusy('delete')
    try {
      await repository.deleteUser(shown.id)
      toast({
        tone: 'success',
        title: `${shown.displayName} wurde gelöscht`,
        description: 'Konto und Trainingsdaten sind entfernt. Den Login kannst du optional in der Firebase Console löschen.',
      })
      onClose()
    } catch (error) {
      toast({ tone: 'error', title: 'Löschen fehlgeschlagen', description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  return (
    <Sheet open={user !== null} onClose={onClose} title="Nutzer verwalten" subtitle={isSelf ? 'Das bist du' : undefined}>
      <div className="space-y-6 pb-2">
        <div className="flex items-center gap-4">
          <UserAvatar user={shown} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold tracking-tight">{shown.displayName}</p>
            <p className="truncate text-[14px] text-muted">
              {shown.username && <span className="font-medium text-fg/80">@{shown.username} · </span>}
              {shown.email}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <RoleBadge role={shown.role} />
              <LevelBadge gamification={shown.gamification} />
              <StatusBadge status={shown.status} />
            </div>
          </div>
        </div>

        <Section title="Name">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void saveName()}
              maxLength={60}
              className="min-w-0 flex-1 rounded-2xl bg-sunken px-4 py-3 text-[16px] outline-none ring-accent/70 focus:ring-2"
            />
            <AnimatePresence>
              {nameChanged && (
                <m.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={saveName}
                  disabled={busy === 'name'}
                  className="flex items-center gap-2 rounded-2xl bg-accent px-4 text-[15px] font-semibold text-accent-ink"
                >
                  {busy === 'name' && <LoaderCircle className="size-4 animate-spin" />}
                  Speichern
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </Section>

        <Section
          title="Benutzername"
          hint={
            username && !usernameValid
              ? USERNAME_RULES
              : shown.username
                ? 'Login mit Benutzername oder E-Mail. Nach einer Änderung gilt der alte Benutzername nicht mehr.'
                : 'Noch kein Benutzername: Anmeldung bisher nur per E-Mail.'
          }
        >
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              onKeyDown={(event) => event.key === 'Enter' && void saveUsername()}
              placeholder="z. B. anna.schneider"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-2xl bg-sunken px-4 py-3 text-[16px] outline-none ring-accent/70 focus:ring-2"
            />
            <AnimatePresence>
              {usernameChanged && (
                <m.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={saveUsername}
                  disabled={busy === 'username'}
                  className="flex items-center gap-2 rounded-2xl bg-accent px-4 text-[15px] font-semibold text-accent-ink"
                >
                  {busy === 'username' && <LoaderCircle className="size-4 animate-spin" />}
                  Speichern
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </Section>

        <Section title="Rolle" hint={isSelf ? 'Deine eigene Rolle kannst du nicht ändern, damit der Admin-Zugang nie verloren geht.' : undefined}>
          <Locked locked={isSelf}>
            <SegmentedControl<UserRole>
              label="Rolle"
              value={shown.role}
              onChange={(role) => role !== shown.role && void update({ role }, role === 'admin' ? 'Zum Admin gemacht' : 'Admin-Rechte entzogen')}
              options={[
                { value: 'user', label: 'Nutzer' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Locked>
        </Section>

        <Section
          title="Zugang"
          hint={
            isSelf
              ? 'Du kannst dich nicht selbst sperren.'
              : 'Gesperrte Nutzer verlieren sofort den Zugriff auf alle Daten. Ihre Trainings bleiben erhalten.'
          }
        >
          <Locked locked={isSelf}>
            <SegmentedControl<UserStatus>
              label="Zugang"
              value={shown.status}
              onChange={(status) => status !== shown.status && void update({ status }, status === 'active' ? 'Zugang aktiviert' : 'Zugang gesperrt')}
              options={[
                { value: 'active', label: 'Aktiv' },
                { value: 'disabled', label: 'Gesperrt' },
              ]}
            />
          </Locked>
        </Section>

        <Section title="Details">
          <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken text-[14px]">
            <Row label="Angelegt">{dateTime.format(shown.createdAt)}</Row>
            <Row label="Zuletzt aktiv">{shown.lastLoginAt ? dateTime.format(shown.lastLoginAt) : 'Noch nie angemeldet'}</Row>
            <Row label="Wochenziel">{shown.weeklyGoalDays} Tage</Row>
            {shown.gamification ? (
              <>
                <Row label="Level">
                  {shown.gamification.level} · {RANK_BY_ID[shown.gamification.rank].label}
                </Row>
                <Row label="XP gesamt">{xpFormatter.format(shown.gamification.totalXP)}</Row>
                <Row label="Erfolge">
                  {ACHIEVEMENTS.filter((achievement) => shown.gamification?.unlockedAchievements[achievement.id]).length} /{' '}
                  {ACHIEVEMENTS.length}
                </Row>
              </>
            ) : (
              <Row label="Level">Noch nicht synchronisiert</Row>
            )}
            <Row label="Nutzer-ID">
              <code className="font-mono text-[12px] text-muted">{shown.id}</code>
            </Row>
          </dl>
        </Section>

        <Section title="Aktionen">
          <div className="space-y-2">
            <button
              type="button"
              onClick={sendReset}
              disabled={busy === 'reset'}
              className="flex w-full items-center gap-3 rounded-2xl bg-sunken px-4 py-3.5 text-left text-[15px] font-medium transition hover:bg-surface-solid disabled:opacity-60"
            >
              {busy === 'reset' ? <LoaderCircle className="size-4.5 animate-spin text-muted" /> : <KeyRound className="size-4.5 text-muted" />}
              Link zum Zurücksetzen des Passworts senden
            </button>

            {!isSelf &&
              (confirmDelete ? (
                <div className="rounded-2xl bg-danger/10 p-4">
                  <p className="text-[14px] font-semibold text-danger">{shown.displayName} endgültig löschen?</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg/80">
                    Konto und alle Trainingsdaten werden gelöscht. Das kann nicht rückgängig gemacht werden. Wenn der Nutzer
                    später zurückkommen soll, sperre ihn stattdessen.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl bg-surface-solid py-2.5 text-[14px] font-semibold">
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      onClick={deleteUser}
                      disabled={busy === 'delete'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-[14px] font-semibold text-white"
                    >
                      {busy === 'delete' && <LoaderCircle className="size-4 animate-spin" />}
                      Endgültig löschen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-medium text-danger transition hover:bg-danger/10"
                >
                  <Trash2 className="size-4.5" />
                  Konto löschen
                </button>
              ))}
          </div>
        </Section>
      </div>
    </Sheet>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      {children}
      {hint && <p className="mt-2 px-1 text-[13px] leading-relaxed text-muted">{hint}</p>}
    </section>
  )
}

function Locked({ locked, children }: { locked: boolean; children: ReactNode }) {
  return <div className={locked ? 'pointer-events-none opacity-50' : ''} aria-disabled={locked}>{children}</div>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  )
}
