import { Check, Copy, Eye, EyeOff, LoaderCircle, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/toastContext'
import { generatePassword, isValidEmail, MIN_PASSWORD_LENGTH } from '../../lib/passwords'
import { isValidUsername, normalizeUsername, suggestUsername } from '../../lib/usernames'
import { useT } from '../../i18n'
import { repository } from '../../services/repository'
import type { UserProfile, UserRole } from '../../types/models'

interface Draft {
  displayName: string
  username: string
  /** Until the admin edits the username, it follows the name ("Anna Schneider" → "anna.schneider"). */
  usernameEdited: boolean
  email: string
  role: UserRole
  password: string
  sendResetMail: boolean
}

const emptyDraft = (): Draft => ({
  displayName: '',
  username: '',
  usernameEdited: false,
  email: '',
  role: 'user',
  password: generatePassword(),
  sendResetMail: true,
})

export function CreateUserSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user: admin } = useSession()
  const toast = useToast()
  const [draft, setDraft] = useState(emptyDraft)
  const [showPassword, setShowPassword] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<UserProfile | null>(null)
  const [copied, setCopied] = useState(false)
  const t = useT()
  const a = t.admin

  // Fresh form on every open (state adjustment during render instead of an effect).
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(emptyDraft())
      setError(null)
      setCreated(null)
      setCopied(false)
    }
  }

  const patch = (changes: Partial<Draft>) => setDraft((current) => ({ ...current, ...changes }))
  const emailValid = isValidEmail(draft.email)
  const usernameValid = isValidUsername(normalizeUsername(draft.username))
  const canSubmit =
    draft.displayName.trim().length > 0 && usernameValid && emailValid && draft.password.length >= MIN_PASSWORD_LENGTH && !busy

  const submit = async () => {
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      const user = await repository.createUser(draft, admin.uid)
      let mailNote = ''
      if (draft.sendResetMail) {
        try {
          await repository.sendPasswordReset(user.email)
          mailNote = a.resetMailSent
        } catch {
          mailNote = a.resetMailFailed
        }
      }
      setCreated(user)
      toast({ tone: 'success', title: a.created(user.displayName), description: mailNote.trim() || undefined })
    } catch (createError) {
      setError(authErrorMessage(createError, a.createFailed))
    } finally {
      setBusy(false)
    }
  }

  const copyCredentials = async () => {
    if (!created) return
    await navigator.clipboard.writeText(
      a.credentials(created.username ?? '', created.email, draft.password, window.location.origin),
    )
    setCopied(true)
    toast({ tone: 'info', title: a.credentialsCopied })
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={created ? a.userCreated : a.createUser}
      subtitle={created ? created.email : a.onlyAdmin}
      footer={
        created ? (
          <div className="flex gap-2">
            <button type="button" onClick={copyCredentials} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sunken py-3.5 text-[15px] font-semibold">
              {copied ? <Check className="size-4.5" strokeWidth={3} /> : <Copy className="size-4.5" />}
              {a.copyCredentials}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-accent py-3.5 text-[15px] font-semibold text-accent-ink">
              {a.done}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {busy && <LoaderCircle className="size-4.5 animate-spin" />}
            {a.createUser}
          </button>
        )
      }
    >
      {created ? (
        <div className="space-y-4 pb-2">
          <p className="text-[15px] leading-relaxed text-fg/85">
            {a.accountActive}
            {draft.sendResetMail && a.linkSentToo}
          </p>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken text-[15px]">
            <Row label={a.name}>{created.displayName}</Row>
            <Row label={a.username}>{created.username}</Row>
            <Row label={a.email}>{created.email}</Row>
            <Row label={a.password}>
              <code className="font-mono text-[14px]">{draft.password}</code>
            </Row>
            <Row label={a.role}>{created.role === 'admin' ? a.roleAdmin : a.roleUser}</Row>
          </dl>
        </div>
      ) : (
        <form
          className="space-y-5 pb-2 pt-1"
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          <Field label={a.name}>
            <input
              value={draft.displayName}
              onChange={(event) => {
                const displayName = event.target.value
                patch(draft.usernameEdited ? { displayName } : { displayName, username: suggestUsername(displayName) })
              }}
              placeholder={a.namePlaceholder}
              maxLength={60}
              autoFocus
              className={inputClass}
            />
          </Field>
          <Field
            label={a.username}
            hint={draft.username && !usernameValid ? a.usernameRules : undefined}
            note={!draft.username || usernameValid ? a.usernameNote : undefined}
          >
            <input
              value={draft.username}
              onChange={(event) => patch({ username: event.target.value.toLowerCase(), usernameEdited: true })}
              placeholder={a.usernamePlaceholder}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <Field label={a.email} hint={draft.email && !emailValid ? a.invalidEmail : undefined}>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => patch({ email: event.target.value })}
              placeholder={a.emailPlaceholder}
              inputMode="email"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label={a.role}>
            <SegmentedControl<UserRole>
              label={a.role}
              value={draft.role}
              onChange={(role) => patch({ role })}
              options={[
                { value: 'user', label: a.roleUser },
                { value: 'admin', label: a.roleAdmin },
              ]}
            />
            {draft.role === 'admin' && (
              <p className="mt-2 px-1 text-[13px] text-muted">{a.adminNote}</p>
            )}
          </Field>
          <Field label={a.startPassword} hint={draft.password.length < MIN_PASSWORD_LENGTH ? a.minLength(MIN_PASSWORD_LENGTH) : undefined}>
            <div className="flex items-center gap-1 rounded-2xl bg-sunken pr-1.5 ring-fg/40 focus-within:ring-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={draft.password}
                onChange={(event) => patch({ password: event.target.value })}
                autoComplete="new-password"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-[15px] outline-none"
              />
              <IconButton label={showPassword ? a.hidePassword : a.showPassword} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </IconButton>
              <IconButton label={a.newPassword} onClick={() => patch({ password: generatePassword() })}>
                <RefreshCw className="size-4.5" />
              </IconButton>
            </div>
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sunken p-4">
            <input
              type="checkbox"
              checked={draft.sendResetMail}
              onChange={(event) => patch({ sendResetMail: event.target.checked })}
              className="mt-0.5 size-5 shrink-0 accent-[var(--accent-fg)]"
            />
            <span>
              <span className="block text-[15px] font-medium">{a.sendResetLink}</span>
              <span className="block text-[13px] text-muted">{a.sendResetLinkText}</span>
            </span>
          </label>
          {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">{error}</p>}
        </form>
      )}
    </Sheet>
  )
}

const inputClass =
  'w-full rounded-xl bg-sunken px-4 py-3.5 text-[16px] outline-none ring-fg/40 placeholder:text-muted/70 focus:ring-2'

/** `hint` is a validation error (red), `note` neutral help text. */
function Field({ label, hint, note, children }: { label: string; hint?: string; note?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 px-1 text-[13px] font-semibold text-muted">{label}</div>
      {children}
      {hint && <p className="mt-1.5 px-1 text-[13px] font-medium text-danger">{hint}</p>}
      {note && <p className="mt-1.5 px-1 text-[13px] text-muted">{note}</p>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-solid hover:text-fg"
    >
      {children}
    </button>
  )
}
