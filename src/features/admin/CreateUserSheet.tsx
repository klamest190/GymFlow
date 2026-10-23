import { Check, Copy, Eye, EyeOff, LoaderCircle, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/toastContext'
import { generatePassword, isValidEmail, MIN_PASSWORD_LENGTH } from '../../lib/passwords'
import { isValidUsername, normalizeUsername, suggestUsername, USERNAME_RULES } from '../../lib/usernames'
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
          mailNote = ' Der Link zum Passwort-Setzen ist unterwegs.'
        } catch {
          mailNote = ' Die E-Mail konnte nicht gesendet werden. Teile die Zugangsdaten direkt.'
        }
      }
      setCreated(user)
      toast({ tone: 'success', title: `${user.displayName} wurde angelegt`, description: mailNote.trim() || undefined })
    } catch (createError) {
      setError(authErrorMessage(createError, 'Das Konto konnte nicht angelegt werden.'))
    } finally {
      setBusy(false)
    }
  }

  const copyCredentials = async () => {
    if (!created) return
    await navigator.clipboard.writeText(
      `GymFlow-Zugang\nBenutzername: ${created.username}\nE-Mail: ${created.email}\nPasswort: ${draft.password}\n${window.location.origin}`,
    )
    setCopied(true)
    toast({ tone: 'info', title: 'Zugangsdaten kopiert' })
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={created ? 'Nutzer angelegt' : 'Nutzer anlegen'}
      subtitle={created ? created.email : 'Neue Zugänge kann nur der Admin vergeben.'}
      footer={
        created ? (
          <div className="flex gap-2">
            <button type="button" onClick={copyCredentials} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sunken py-3.5 text-[15px] font-semibold">
              {copied ? <Check className="size-4.5" strokeWidth={3} /> : <Copy className="size-4.5" />}
              Zugangsdaten kopieren
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl bg-accent py-3.5 text-[15px] font-semibold text-accent-ink shadow-accent">
              Fertig
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {busy && <LoaderCircle className="size-4.5 animate-spin" />}
            Nutzer anlegen
          </button>
        )
      }
    >
      {created ? (
        <div className="space-y-4 pb-2">
          <p className="text-[15px] leading-relaxed text-fg/85">
            Das Konto ist sofort aktiv. Gib die Zugangsdaten sicher weiter, zum Beispiel persönlich oder über einen Messenger.
            {draft.sendResetMail && ' Zusätzlich wurde ein Link verschickt, mit dem der Nutzer ein eigenes Passwort festlegen kann.'}
          </p>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl bg-sunken text-[15px]">
            <Row label="Name">{created.displayName}</Row>
            <Row label="Benutzername">{created.username}</Row>
            <Row label="E-Mail">{created.email}</Row>
            <Row label="Passwort">
              <code className="font-mono text-[14px]">{draft.password}</code>
            </Row>
            <Row label="Rolle">{created.role === 'admin' ? 'Admin' : 'Nutzer'}</Row>
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
          <Field label="Name">
            <input
              value={draft.displayName}
              onChange={(event) => {
                const displayName = event.target.value
                patch(draft.usernameEdited ? { displayName } : { displayName, username: suggestUsername(displayName) })
              }}
              placeholder="Vor- und Nachname"
              maxLength={60}
              autoFocus
              className={inputClass}
            />
          </Field>
          <Field
            label="Benutzername"
            hint={draft.username && !usernameValid ? USERNAME_RULES : undefined}
            note={!draft.username || usernameValid ? 'Damit meldet sich der Nutzer an, alternativ zur E-Mail.' : undefined}
          >
            <input
              value={draft.username}
              onChange={(event) => patch({ username: event.target.value.toLowerCase(), usernameEdited: true })}
              placeholder="z. B. anna.schneider"
              maxLength={20}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={inputClass}
            />
          </Field>
          <Field label="E-Mail" hint={draft.email && !emailValid ? 'Bitte eine gültige E-Mail-Adresse eingeben.' : undefined}>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => patch({ email: event.target.value })}
              placeholder="name@beispiel.de"
              inputMode="email"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label="Rolle">
            <SegmentedControl<UserRole>
              label="Rolle"
              value={draft.role}
              onChange={(role) => patch({ role })}
              options={[
                { value: 'user', label: 'Nutzer' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            {draft.role === 'admin' && (
              <p className="mt-2 px-1 text-[13px] text-muted">Admins können alle Konten verwalten, aber keine Trainingsdaten bearbeiten.</p>
            )}
          </Field>
          <Field label="Startpasswort" hint={draft.password.length < MIN_PASSWORD_LENGTH ? `Mindestens ${MIN_PASSWORD_LENGTH} Zeichen.` : undefined}>
            <div className="flex items-center gap-1 rounded-2xl bg-sunken pr-1.5 ring-accent/70 focus-within:ring-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={draft.password}
                onChange={(event) => patch({ password: event.target.value })}
                autoComplete="new-password"
                className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-[15px] outline-none"
              />
              <IconButton label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </IconButton>
              <IconButton label="Neues Passwort erzeugen" onClick={() => patch({ password: generatePassword() })}>
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
              <span className="block text-[15px] font-medium">Link zum Passwort-Setzen senden</span>
              <span className="block text-[13px] text-muted">Der Nutzer bekommt eine E-Mail und legt sein eigenes Passwort fest.</span>
            </span>
          </label>
          {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">{error}</p>}
        </form>
      )}
    </Sheet>
  )
}

const inputClass =
  'w-full rounded-2xl bg-sunken px-4 py-3.5 text-[16px] outline-none ring-accent/70 placeholder:text-muted/70 focus:ring-2'

/** `hint` is a validation error (red), `note` neutral help text. */
function Field({ label, hint, note, children }: { label: string; hint?: string; note?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
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
