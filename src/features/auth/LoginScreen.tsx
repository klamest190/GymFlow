import { AnimatePresence, m } from 'framer-motion'
import { ArrowLeft, ArrowRight, CircleUser, Eye, EyeOff, LoaderCircle, Lock, Mail, MailCheck } from 'lucide-react'
import { lazy, Suspense, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { Wordmark } from '../../components/ui/Wordmark'
import { GUEST_EXERCISE_IDS } from '../../data/guest'
import { fade } from '../../lib/motion'
import { repository } from '../../services/repository'
import { setLocale, useLocale, useT } from '../../i18n'

type Mode = 'login' | 'reset' | 'reset-sent'

// Loaded after the form, so the login screen itself stays light.
const ExerciseAnimation = lazy(() =>
  import('../exercises/animation/ExerciseAnimation').then((module) => ({ default: module.ExerciseAnimation })),
)

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  // Username or e-mail, shared by the login and reset forms.
  const [login, setLogin] = useState('')
  const { startGuest } = useAuth()
  const t = useT()

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-10">
        <BrandPanel />

        <main className="flex items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-[calc(env(safe-area-inset-top)+24px)] lg:px-0 lg:py-12">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 flex items-center gap-4 lg:hidden">
              <div className="glass size-24 shrink-0 overflow-hidden rounded-2xl">
                <div className="size-full bg-sunken">
                  <Suspense fallback={null}>
                    <ExerciseAnimation exerciseId="military-press" compact label={t.auth.figureLabel} />
                  </Suspense>
                </div>
              </div>
              <div className="min-w-0">
                <Wordmark size="lg" />
                <p className="mt-2 text-[15px] text-muted">{t.auth.tagline}</p>
              </div>
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

            <div className="mt-6 text-center">
              <p className="text-[13px] text-muted">{t.auth.noAccount}</p>
              <button
                type="button"
                onClick={startGuest}
                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3.5 text-[15px] font-semibold transition hover:bg-sunken active:scale-[0.98]"
              >
                {t.auth.tryAsGuest}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
              </button>
              <p className="mt-2 text-[12px] text-muted">
                {t.auth.guestHint(GUEST_EXERCISE_IDS.size)}
              </p>
            </div>
            {repository.mode === 'local' && (
              <p className="mt-3 rounded-xl bg-sunken px-4 py-3 text-center text-[12px] text-muted">
                {t.auth.demoHint}
              </p>
            )}
            <LanguageSwitch />
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
  const t = useT()
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
      <h1 className="headline text-[39px]">{t.auth.signIn}</h1>
      <p className="mt-1 text-[15px] text-muted">{t.auth.signInHint}</p>

      <div className="mt-7 space-y-3">
        <LoginField value={login} onChange={onLoginChange} />
        <Field icon={Lock} label={t.auth.password}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder={t.auth.password}
            required
            className="w-full bg-transparent py-3.5 text-[16px] outline-none placeholder:text-muted/70"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-solid hover:text-fg"
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
          >
            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </Field>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onForgot} className="text-[14px] font-semibold text-accent-fg transition hover:opacity-80">
          {t.auth.forgotPassword}
        </button>
      </div>

      <FormError message={error} />

      <button
        type="submit"
        disabled={busy || !login.trim() || !password}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-[16px] font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        {busy ? t.auth.signingIn : t.auth.signIn}
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
  const t = useT()
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
      <h1 className="headline mt-4 text-[39px]">{t.auth.resetTitle}</h1>
      <p className="mt-1 text-[15px] text-muted">
        {t.auth.resetHint}
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
        {t.auth.sendLink}
      </button>
    </form>
  )
}

function ResetSent({ login, onBack }: { login: string; onBack: () => void }) {
  const t = useT()
  return (
    <div className="text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-ink">
        <MailCheck className="size-7" strokeWidth={2.25} />
      </span>
      <h1 className="headline mt-5 text-[31px]">{t.auth.checkInbox}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        {t.auth.resetSentBefore}<span className="font-semibold text-fg">{login.trim()}</span>{t.auth.resetSentAfter}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 w-full rounded-xl bg-sunken py-3.5 text-[15px] font-semibold transition hover:bg-surface-solid"
      >
        {t.auth.backToSignIn}
      </button>
    </div>
  )
}

/** Username or e-mail. Plain text input, so mobile keyboards don't force e-mail mode or capitalize. */
function LoginField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useT()
  return (
    <Field icon={value.includes('@') ? Mail : CircleUser} label={t.auth.login}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder={t.auth.login}
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
  const t = useT()
  return (
    <button type="button" onClick={onClick} className="-ml-1 flex items-center gap-1 text-[14px] font-semibold text-muted transition hover:text-fg">
      <ArrowLeft className="size-4" strokeWidth={2.5} />
      {t.auth.back}
    </button>
  )
}

/** Desktop-only brand side: the dumbbell figure pressing overhead, and what the app is for. */
function BrandPanel() {
  const t = useT()
  return (
    <aside className="hidden flex-col justify-center py-12 lg:flex">
      <Wordmark />
      <div className="glass mt-10 aspect-[4/3] w-full max-w-[460px] overflow-hidden rounded-3xl">
        <div className="size-full bg-sunken">
          <Suspense fallback={null}>
            <ExerciseAnimation exerciseId="military-press" label={t.auth.figureLabel} />
          </Suspense>
        </div>
      </div>
      <h2 className="headline mt-10 text-[61px]">
        {t.auth.taglineFirst}
        <br />
        {t.auth.taglineSecond}
      </h2>
      <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-muted">
        {t.auth.pitch}
      </p>
    </aside>
  )
}

/** Before signing in there is no profile page yet, so the login screen offers the other language. */
function LanguageSwitch() {
  const t = useT()
  const locale = useLocale()
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
        lang={locale === 'de' ? 'en' : 'de'}
        aria-label={t.shell.switchLanguageLabel}
        className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-muted transition hover:bg-sunken hover:text-fg"
      >
        {t.shell.switchLanguage}
      </button>
    </div>
  )
}
