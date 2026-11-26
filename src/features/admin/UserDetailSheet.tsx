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
import { isValidUsername, normalizeUsername } from '../../lib/usernames'
import { useT } from '../../i18n'
import { dateFormat, formatNumber } from '../../i18n/format'
import type { UserProfile, UserRole, UserStatus, UserUpdate } from '../../types/models'
import { LevelBadge } from '../gamification/RankBadge'
import { RoleBadge, StatusBadge, UserAvatar } from './UserBadges'

const formatDateTime = (timestamp: number) =>
  dateFormat({ day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(timestamp)

export function UserDetailSheet({ user, onClose }: { user: UserProfile | null; onClose: () => void }) {
  const { user: me } = useSession()
  const toast = useToast()
  const [busy, setBusy] = useState<'name' | 'username' | 'reset' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const t = useT()
  const a = t.admin

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
      toast({ tone: 'error', title: a.changeFailed, description: authErrorMessage(error) })
    }
  }

  const saveName = async () => {
    if (!nameChanged) return
    setBusy('name')
    await update({ displayName: name.trim() }, a.nameSaved)
    setBusy(null)
  }

  const saveUsername = async () => {
    if (!usernameChanged) return
    setBusy('username')
    try {
      await repository.setUsername(shown, nextUsername)
      toast({ tone: 'success', title: a.usernameSaved, description: a.usernameSavedText(nextUsername) })
    } catch (error) {
      toast({ tone: 'error', title: a.usernameNotSaved, description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  const sendReset = async () => {
    setBusy('reset')
    try {
      await repository.sendPasswordReset(shown.email)
      toast({ tone: 'success', title: a.resetSent, description: shown.email })
    } catch (error) {
      toast({ tone: 'error', title: a.mailNotSent, description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  const deleteUser = async () => {
    setBusy('delete')
    try {
      await repository.deleteUser(shown.id)
      toast({
        tone: 'success',
        title: a.deleted(shown.displayName),
        description: a.deletedText,
      })
      onClose()
    } catch (error) {
      toast({ tone: 'error', title: a.deleteFailed, description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  return (
    <Sheet open={user !== null} onClose={onClose} title={a.manageUser} subtitle={isSelf ? a.thatsYou : undefined}>
      <div className="space-y-6 pb-2">
        <div className="flex items-center gap-4">
          <UserAvatar user={shown} size="lg" />
          <div className="min-w-0">
            <p className="headline truncate text-[25px]">{shown.displayName}</p>
            {shown.username && <p className="truncate text-[14px] font-medium text-fg/80">@{shown.username}</p>}
            <p className="truncate text-[14px] text-muted">{shown.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <RoleBadge role={shown.role} />
              <LevelBadge gamification={shown.gamification} />
              <StatusBadge status={shown.status} />
            </div>
          </div>
        </div>

        <Section title={a.name}>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void saveName()}
              maxLength={60}
              className="min-w-0 flex-1 rounded-xl bg-sunken px-4 py-3 text-[16px] outline-none ring-fg/40 focus:ring-2"
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
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink"
                >
                  {busy === 'name' && <LoaderCircle className="size-4 animate-spin" />}
                  {a.save}
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </Section>

        <Section
          title={a.username}
          hint={
            username && !usernameValid
              ? a.usernameRules
              : shown.username
                ? a.usernameHint
                : a.noUsername
          }
        >
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              onKeyDown={(event) => event.key === 'Enter' && void saveUsername()}
              placeholder={a.usernamePlaceholder}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-xl bg-sunken px-4 py-3 text-[16px] outline-none ring-fg/40 focus:ring-2"
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
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink"
                >
                  {busy === 'username' && <LoaderCircle className="size-4 animate-spin" />}
                  {a.save}
                </m.button>
              )}
            </AnimatePresence>
          </div>
        </Section>

        <Section title={a.role} hint={isSelf ? a.ownRole : undefined}>
          <Locked locked={isSelf}>
            <SegmentedControl<UserRole>
              label={a.role}
              value={shown.role}
              onChange={(role) => role !== shown.role && void update({ role }, role === 'admin' ? a.madeAdmin : a.adminRevoked)}
              options={[
                { value: 'user', label: a.roleUser },
                { value: 'admin', label: a.roleAdmin },
              ]}
            />
          </Locked>
        </Section>

        <Section
          title={a.access}
          hint={
            isSelf
              ? a.cannotLockSelf
              : a.lockHint
          }
        >
          <Locked locked={isSelf}>
            <SegmentedControl<UserStatus>
              label={a.access}
              value={shown.status}
              onChange={(status) => status !== shown.status && void update({ status }, status === 'active' ? a.accessEnabled : a.accessLocked)}
              options={[
                { value: 'active', label: a.active },
                { value: 'disabled', label: a.disabled },
              ]}
            />
          </Locked>
        </Section>

        <Section title={a.details}>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken text-[14px]">
            <Row label={a.createdAt}>{formatDateTime(shown.createdAt)}</Row>
            <Row label={a.lastActive}>{shown.lastLoginAt ? formatDateTime(shown.lastLoginAt) : a.neverSignedIn}</Row>
            <Row label={a.weeklyGoal}>{a.goalDays(shown.weeklyGoalDays)}</Row>
            {shown.gamification ? (
              <>
                <Row label={a.level}>
                  {shown.gamification.level} · {t.gamification.ranks[RANK_BY_ID[shown.gamification.rank].id]}
                </Row>
                <Row label={a.totalXP}>{formatNumber(shown.gamification.totalXP)}</Row>
                <Row label={a.achievements}>
                  {ACHIEVEMENTS.filter((achievement) => shown.gamification?.unlockedAchievements[achievement.id]).length} /{' '}
                  {ACHIEVEMENTS.length}
                </Row>
              </>
            ) : (
              <Row label={a.level}>{a.notSynced}</Row>
            )}
            <Row label={a.userId}>
              <code className="font-mono text-[12px] text-muted">{shown.id}</code>
            </Row>
          </dl>
        </Section>

        <Section title={a.actions}>
          <div className="space-y-2">
            <button
              type="button"
              onClick={sendReset}
              disabled={busy === 'reset'}
              className="flex w-full items-center gap-3 rounded-xl bg-sunken px-4 py-3.5 text-left text-[15px] font-medium transition hover:bg-surface-solid disabled:opacity-60"
            >
              {busy === 'reset' ? <LoaderCircle className="size-4.5 animate-spin text-muted" /> : <KeyRound className="size-4.5 text-muted" />}
              {a.sendPasswordReset}
            </button>

            {!isSelf &&
              (confirmDelete ? (
                <div className="rounded-2xl bg-danger/10 p-4">
                  <p className="text-[14px] font-semibold text-danger">{a.confirmDelete(shown.displayName)}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fg/80">
                    {a.deleteWarning}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-xl bg-surface-solid py-2.5 text-[14px] font-semibold">
                      {a.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={deleteUser}
                      disabled={busy === 'delete'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger-fill py-2.5 text-[14px] font-semibold text-white"
                    >
                      {busy === 'delete' && <LoaderCircle className="size-4 animate-spin" />}
                      {a.deleteForever}
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
                  {a.deleteAccount}
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
      <h3 className="mb-2 px-1 text-[13px] font-semibold text-muted">{title}</h3>
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
