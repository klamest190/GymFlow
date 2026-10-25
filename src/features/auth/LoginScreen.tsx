import { AnimatePresence, m } from 'framer-motion'
import { ArrowLeft, CircleUser, Eye, EyeOff, LoaderCircle, Lock, Mail, MailCheck } from 'lucide-react'
import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { Wordmark } from '../../components/ui/Wordmark'
import { fade } from '../../lib/motion'
import { repository } from '../../services/repository'

type Mode = 'login' | 'reset' | 'reset-sent'

// Loaded on desktop only, and after the form: the login screen stays light.
const ExerciseAnimation = lazy(() =>
  import('../exercises/animation/ExerciseAnimation').then((module) => ({ default: module.ExerciseAnimation })),
)

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  // Username or e-mail, shared by the login and reset forms.
  const [login, setLogin] = useState('')

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-10">
        <BrandPanel />

        <main className="flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] lg:px-0 lg:py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <Wordmark size="lg" />
              <p className="mt-3 text-[15px] text-muted">Dein Training. Präzise erfasst.</p>
            </div>

            <div className="glass overflow-hidden rounded-4xl p-6 sm:p-8">
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' && (
                  <Panel key="login">
                    <LoginForm login={login} onLoginChange={setLogin} onForgot={() => setMode('reset')} />
                  </Panel>
                )}
                {mode === 'reset' && (
                  <Panel key="reset">
                    <ResetForm login={login} onLoginChange={setLogin} onBack={() => setMode('login')} onSent={() => setMode('reset-sent')} />
                  </Panel>
                )}
                {mode === 'reset-sent' && (
                  <Panel key="sent">
                    <ResetSent login={login} onBack={() => setMode('login')} />
                  </Panel>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-6 text-center text-[13px] text-muted">
              Noch keinen Zugang? GymFlow ist ein geschlossenes System. Zugänge vergibt dein Admin.
            </p>
            {repository.mode === 'local' && (
              <p className="mt-3 rounded-xl bg-sunken px-4 py-3 text-center text-[12px] text-muted">
                Demo-Modus: Die erste Anmeldung mit beliebigem Benutzernamen oder E-Mail wird Admin. Passwörter werden nicht geprüft.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={fade}>
      {children}
    </m.div>
  )
}

function LoginForm({ login, onLoginChange, onForgot }: { login: string; onLoginChange: (login: string) => void; onForgot: () => void }) {
  const { signIn } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await signIn(login, password)
      // On success the AuthProvider switches to the app; nothing else to do here.
    } catch (signInError) {
      setError(authErrorMessage(signInError))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="headline text-[39px]">Willkommen zurück</h1>
      <p className="mt-1 text-[15px] text-muted">Melde dich mit deinem GymFlow-Zugang an.</p>

      <div className="mt-7 space-y-3">
        <LoginField value={login} onChange={onLoginChange} />
        <Field icon={Lock} label="Passwort">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Passwort"
            required
            className="w-full bg-transparent py-3.5 text-[16px] outline-none placeholder:text-muted/70"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-solid hover:text-fg"
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
          >
            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onForgot} className="text-[14px] font-semibold text-accent-fg transition hover:opacity-80">
          Passwort vergessen?
        </button>
      </div>

      <FormError message={error} />

      <button
        type="submit"
        disabled={busy || !login.trim() || !password}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        {busy ? 'Anmelden …' : 'Anmelden'}
      </button>
    </form>
  )
}

function ResetForm({
  login,
  onLoginChange,
  onBack,
  onSent,
}: {
  login: string
  onLoginChange: (login: string) => void
  onBack: () => void
  onSent: () => void
}) {
  const { sendPasswordReset } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await sendPasswordReset(login)
      onSent()
    } catch (resetError) {
      // Unknown accounts are reported as success on purpose: no hints about which accounts exist.
      if ((resetError as { code?: string }).code === 'auth/user-not-found') onSent()
      else setError(authErrorMessage(resetError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <BackButton onClick={onBack} />
      <h1 className="headline mt-4 text-[39px]">Passwort zurücksetzen</h1>
      <p className="mt-1 text-[15px] text-muted">
        Wir schicken einen Link an die hinterlegte E-Mail-Adresse, mit dem du ein neues Passwort festlegst.
      </p>
      <div className="mt-7">
        <LoginField value={login} onChange={onLoginChange} />
      </div>
      <FormError message={error} />
      <button
        type="submit"
        disabled={busy || !login.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        Link senden
      </button>
    </form>
  )
}

function ResetSent({ login, onBack }: { login: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-ink">
        <MailCheck className="size-7" strokeWidth={2.25} />
      </span>
      <h1 className="headline mt-5 text-[31px]">Prüfe dein Postfach</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Falls für <span className="font-semibold text-fg">{login.trim()}</span> ein Zugang existiert, ist der Link an die
        hinterlegte E-Mail-Adresse unterwegs. Schau auch im Spam-Ordner nach.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 w-full rounded-xl bg-sunken py-3.5 text-[15px] font-semibold transition hover:bg-surface-solid"
      >
        Zurück zur Anmeldung
      </button>
    </div>
  )
}

/** Username or e-mail. Plain text input, so mobile keyboards don't force e-mail mode or capitalize. */
function LoginField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Field icon={value.includes('@') ? Mail : CircleUser} label="Benutzername oder E-Mail">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Benutzername oder E-Mail"
        required
        autoFocus
        className="w-full bg-transparent py-3.5 text-[16px] outline-none placeholder:text-muted/70"
      />
    </Field>
  )
}

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-sunken px-4 ring-fg/40 transition focus-within:bg-surface-solid focus-within:ring-2">
      <Icon className="size-4.5 shrink-0 text-muted" aria-hidden />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  )
}

function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <m.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="alert"
          className="overflow-hidden"
        >
          <span className="mt-4 block rounded-2xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">{message}</span>
        </m.p>
      )}
    </AnimatePresence>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="-ml-1 flex items-center gap-1 text-[14px] font-semibold text-muted transition hover:text-fg">
      <ArrowLeft className="size-4" strokeWidth={2.5} />
      Zurück
    </button>
  )
}

/** Desktop-only brand side: the dumbbell figure pressing overhead, and what the app is for. */
function BrandPanel() {
  return (
    <aside className="hidden flex-col justify-center py-12 lg:flex">
      <Wordmark />
      <div className="glass mt-10 aspect-[4/3] w-full max-w-[460px] overflow-hidden rounded-3xl">
        <div className="size-full bg-sunken">
          <Suspense fallback={null}>
            <ExerciseAnimation exerciseId="military-press" label="Schulterdrücken mit zwei Kurzhanteln" />
          </Suspense>
        </div>
      </div>
      <h2 className="headline mt-10 text-[61px]">
        Dein Training.
        <br />
        Präzise erfasst.
      </h2>
      <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
        Sätze, Wiederholungen und Gewicht je Hantel festhalten und sehen, wie du stärker wirst. Zugang nur auf Einladung.
      </p>
    </aside>
  )
}
