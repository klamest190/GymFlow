import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ChartNoAxesColumn, Dumbbell, Eye, EyeOff, LoaderCircle, Lock, Mail, MailCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { repository } from '../../services/repository'

type Mode = 'login' | 'reset' | 'reset-sent'

const FEATURES = [
  { icon: Dumbbell, title: 'Training in Sekunden erfasst', text: 'Sätze, Wiederholungen und Gewicht mit einem Tipp.' },
  { icon: ChartNoAxesColumn, title: 'Fortschritt, der motiviert', text: 'Wochenziele, Heatmap und Bestleistungen auf einen Blick.' },
  { icon: ShieldCheck, title: 'Privat & geschützt', text: 'Zugang nur auf Einladung, deine Daten gehören dir.' },
]

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 size-[620px] rounded-full bg-(--glow-a) blur-[130px]" />
        <div className="absolute -bottom-48 -right-40 size-[620px] rounded-full bg-(--glow-b) blur-[140px]" />
      </div>

      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-10">
        <BrandPanel />

        <main className="flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] lg:px-0 lg:py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <Logo size="lg" />
              <p className="mt-3 text-[15px] text-muted">Dein Training. Präzise erfasst.</p>
            </div>

            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className="glass overflow-hidden rounded-4xl p-6 shadow-float sm:p-8"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' && (
                  <Panel key="login">
                    <LoginForm email={email} onEmailChange={setEmail} onForgot={() => setMode('reset')} />
                  </Panel>
                )}
                {mode === 'reset' && (
                  <Panel key="reset">
                    <ResetForm email={email} onEmailChange={setEmail} onBack={() => setMode('login')} onSent={() => setMode('reset-sent')} />
                  </Panel>
                )}
                {mode === 'reset-sent' && (
                  <Panel key="sent">
                    <ResetSent email={email} onBack={() => setMode('login')} />
                  </Panel>
                )}
              </AnimatePresence>
            </motion.div>

            <p className="mt-6 text-center text-[13px] text-muted">
              Noch keinen Zugang? GymFlow ist ein geschlossenes System. Zugänge vergibt dein Admin.
            </p>
            {repository.mode === 'local' && (
              <p className="mt-3 rounded-2xl bg-sunken px-4 py-3 text-center text-[12px] text-muted">
                Demo-Modus: Die erste Anmeldung mit beliebiger E-Mail wird Admin. Passwörter werden nicht geprüft.
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
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
      {children}
    </motion.div>
  )
}

function LoginForm({ email, onEmailChange, onForgot }: { email: string; onEmailChange: (email: string) => void; onForgot: () => void }) {
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
      await signIn(email, password)
      // On success the AuthProvider switches to the app; nothing else to do here.
    } catch (signInError) {
      setError(authErrorMessage(signInError))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">Willkommen zurück</h1>
      <p className="mt-1 text-[15px] text-muted">Melde dich mit deinem GymFlow-Zugang an.</p>

      <div className="mt-7 space-y-3">
        <Field icon={Mail} label="E-Mail">
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="username"
            inputMode="email"
            placeholder="name@beispiel.de"
            required
            autoFocus
            className="w-full bg-transparent py-3.5 text-[16px] outline-none placeholder:text-muted/70"
          />
        </Field>
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
        disabled={busy || !email.trim() || !password}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        {busy ? 'Anmelden …' : 'Anmelden'}
      </button>
    </form>
  )
}

function ResetForm({
  email,
  onEmailChange,
  onBack,
  onSent,
}: {
  email: string
  onEmailChange: (email: string) => void
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
      await sendPasswordReset(email)
      onSent()
    } catch (resetError) {
      // Unknown e-mails are reported as success on purpose: no hints about which accounts exist.
      if ((resetError as { code?: string }).code === 'auth/user-not-found') onSent()
      else setError(authErrorMessage(resetError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <BackButton onClick={onBack} />
      <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight">Passwort zurücksetzen</h1>
      <p className="mt-1 text-[15px] text-muted">Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>
      <div className="mt-7">
        <Field icon={Mail} label="E-Mail">
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            autoComplete="username"
            inputMode="email"
            placeholder="name@beispiel.de"
            autoFocus
            className="w-full bg-transparent py-3.5 text-[16px] outline-none placeholder:text-muted/70"
          />
        </Field>
      </div>
      <FormError message={error} />
      <button
        type="submit"
        disabled={busy || !email.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-[16px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        Link senden
      </button>
    </form>
  )
}

function ResetSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-ink shadow-accent">
        <MailCheck className="size-7" strokeWidth={2.25} />
      </span>
      <h1 className="mt-5 text-[24px] font-bold tracking-tight">Prüfe dein Postfach</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Falls für <span className="font-semibold text-fg">{email.trim()}</span> ein Zugang existiert, ist der Link unterwegs. Schau
        auch im Spam-Ordner nach.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 w-full rounded-2xl bg-sunken py-3.5 text-[15px] font-semibold transition hover:bg-surface-solid"
      >
        Zurück zur Anmeldung
      </button>
    </div>
  )
}

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-sunken px-4 ring-accent/70 transition focus-within:bg-surface-solid focus-within:ring-2">
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
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          role="alert"
          className="overflow-hidden"
        >
          <span className="mt-4 block rounded-2xl bg-danger/10 px-4 py-3 text-[14px] font-medium text-danger">{message}</span>
        </motion.p>
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

function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const large = size === 'lg'
  return (
    <div className="flex items-center gap-3">
      <div className={`grid place-items-center rounded-2xl bg-accent text-accent-ink shadow-accent ${large ? 'size-14' : 'size-11'}`}>
        <Dumbbell className={large ? 'size-7' : 'size-6'} strokeWidth={2.5} />
      </div>
      <span className={`font-bold tracking-tight ${large ? 'text-[30px]' : 'text-[24px]'}`}>
        Gym<span className="text-accent-fg">Flow</span>
      </span>
    </div>
  )
}

/** Desktop-only brand side: headline, feature list and a floating glass preview. */
function BrandPanel() {
  return (
    <aside className="hidden flex-col justify-center py-12 lg:flex">
      <Logo />
      <h2 className="mt-10 text-[52px] font-bold leading-[1.04] tracking-tight">
        Dein Training.
        <br />
        <span className="bg-gradient-to-r from-accent-fg to-accent-fg/60 bg-clip-text text-transparent">Präzise erfasst.</span>
      </h2>
      <ul className="mt-10 space-y-5">
        {FEATURES.map(({ icon: Icon, title, text }, index) => (
          <motion.li
            key={title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + index * 0.08, type: 'spring', stiffness: 260, damping: 28 }}
            className="flex items-start gap-4"
          >
            <span className="glass grid size-11 shrink-0 place-items-center rounded-2xl">
              <Icon className="size-5 text-accent-fg" />
            </span>
            <span>
              <span className="block text-[16px] font-semibold tracking-tight">{title}</span>
              <span className="block text-[14px] text-muted">{text}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 200, damping: 26 }}
        className="glass mt-12 flex w-fit items-center gap-4 rounded-3xl p-4 pr-6 shadow-float"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-ink">
          <Sparkles className="size-6" />
        </span>
        <span>
          <span className="block text-[13px] font-medium text-muted">Premium-Erlebnis</span>
          <span className="block text-[17px] font-semibold tracking-tight">Offline-fähig, auf jedem Gerät</span>
        </span>
      </motion.div>
    </aside>
  )
}
