import { AnimatePresence, motion } from 'framer-motion'
import { Check, Download, HardDrive, LoaderCircle, LogOut, Share, ShieldAlert, ShieldCheck, Smartphone, UserRound } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { EXERCISES } from '../../data/exercises'
import { useAccount, useProfile } from '../../hooks/useData'
import { useUserId } from '../../hooks/useSession'
import { haptic, useTheme, type ThemePreference } from '../../hooks/useUi'
import { useInstallState } from '../../lib/pwa'
import { repository } from '../../services/repository'
import type { AccountInfo, LinkResult } from '../../types/models'

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export function ProfilePage() {
  const userId = useUserId()
  const profile = useProfile(userId)
  const { preference, setPreference } = useTheme()

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    void repository.saveProfile(userId, { weeklyGoalDays })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Einstellungen</p>
        <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Profil</h1>
      </header>

      <div className="mt-6 space-y-4 lg:mt-8">
        <AccountCard />

        <Card title="Wochenziel" description="An wie vielen Tagen pro Woche willst du trainieren? Der Fortschritt erscheint als Ring in der Statistik.">
          <div className="grid grid-cols-7 gap-1.5 rounded-2xl bg-sunken p-1.5" role="radiogroup" aria-label="Trainingstage pro Woche">
            {GOAL_OPTIONS.map((days) => {
              const active = profile.weeklyGoalDays === days
              return (
                <button
                  key={days}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setGoal(days)}
                  className={`relative rounded-xl py-2.5 text-[16px] font-bold tabular-nums transition-colors ${
                    active ? 'text-accent-ink' : 'text-muted hover:text-fg'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="goal-active"
                      className="absolute inset-0 rounded-xl bg-accent shadow-accent"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                    />
                  )}
                  <span className="relative">{days}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[13px] text-muted">
            {profile.weeklyGoalDays} {profile.weeklyGoalDays === 1 ? 'Trainingstag' : 'Trainingstage'} pro Woche
          </p>
        </Card>

        <Card title="Darstellung" description="„System“ folgt automatisch der Einstellung deines Geräts.">
          <SegmentedControl<ThemePreference>
            label="Farbschema"
            value={preference}
            onChange={setPreference}
            options={[
              { value: 'light', label: 'Hell' },
              { value: 'dark', label: 'Dunkel' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Card>

        <InstallCard />

        <p className="px-1 pt-2 text-center text-[12px] text-muted">
          GymFlow · {EXERCISES.length} Übungen im Katalog ·{' '}
          {repository.mode === 'firebase' ? 'Cloud-Sync aktiv' : 'Demo-Modus (lokal)'}
        </p>
      </div>
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

type Pending = Extract<LinkResult, { status: 'account-exists' }>

/** Friendly messages for the setup errors that are most likely right after enabling Google sign-in. */
function linkErrorMessage(error: unknown): string {
  const code = (error as { code?: string }).code ?? ''
  if (code === 'auth/operation-not-allowed') return 'Google-Anmeldung ist in der Firebase Console noch nicht aktiviert.'
  if (code === 'auth/unauthorized-domain') return 'Diese Domain ist in Firebase nicht freigegeben (Authentication → Einstellungen → Autorisierte Domains).'
  if (code === 'auth/popup-blocked') return 'Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.'
  if (code === 'auth/network-request-failed') return 'Keine Verbindung. Bitte später erneut versuchen.'
  return error instanceof Error ? error.message : 'Verknüpfen fehlgeschlagen.'
}

function AccountCard() {
  const account = useAccount()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const link = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await repository.linkWithGoogle()
      if (result.status === 'account-exists') setPending(result)
    } catch (linkError) {
      setError(linkErrorMessage(linkError))
    } finally {
      setBusy(false)
    }
  }

  const switchAccount = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await pending.switchAccount()
      // The uid changed: restart the app so every subscription picks up the other account.
      window.location.reload()
    } catch (switchError) {
      setError(linkErrorMessage(switchError))
      setBusy(false)
    }
  }

  const signOut = async () => {
    setBusy(true)
    await repository.signOut()
    window.location.reload()
  }

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <Avatar account={account} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{accountTitle(account)}</h2>
          <p className="truncate text-[13px] text-muted">{accountSubtitle(account)}</p>
        </div>
        <StatusBadge account={account} />
      </div>

      {account?.provider === 'anonymous' && (
        <div className="mt-4 rounded-2xl bg-sunken p-4">
          <p className="text-[14px] leading-relaxed text-fg/85">
            Du trainierst gerade als Gast. Verknüpfe dein Google-Konto, damit deine Trainings auch bei einem neuen Handy oder
            nach dem Löschen der Browserdaten erhalten bleiben.
          </p>
          <button
            type="button"
            onClick={link}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-fg py-3 text-[15px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <LoaderCircle className="size-4.5 animate-spin" /> : <GoogleMark />}
            Mit Google sichern
          </button>
        </div>
      )}

      {account?.provider === 'google' && (
        <div className="mt-4">
          {confirmSignOut ? (
            <div className="rounded-2xl bg-sunken p-4 text-[14px]">
              <p className="text-fg/85">
                Nach dem Abmelden startest du als neuer Gast. Deine Daten bleiben in deinem Google-Konto und sind nach erneuter
                Anmeldung wieder da.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setConfirmSignOut(false)} className="flex-1 rounded-xl bg-surface-solid py-2.5 font-semibold">
                  Abbrechen
                </button>
                <button type="button" onClick={signOut} disabled={busy} className="flex-1 rounded-xl bg-danger py-2.5 font-semibold text-white">
                  Abmelden
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSignOut(true)}
              className="flex items-center gap-2 rounded-xl px-1 py-1 text-[14px] font-semibold text-danger"
            >
              <LogOut className="size-4" />
              Abmelden
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl bg-accent/12 p-4 text-[14px] ring-1 ring-accent/40">
              <p className="font-semibold">Dieses Google-Konto nutzt GymFlow bereits.</p>
              <p className="mt-1 text-fg/80">
                Zu diesem Konto wechseln? Was du auf diesem Gerät als Gast eingetragen hast, wird dabei nicht übernommen.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setPending(null)} className="flex-1 rounded-xl bg-surface-solid py-2.5 font-semibold">
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={switchAccount}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-accent py-2.5 font-semibold text-accent-ink"
                >
                  Konto wechseln
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-[13px] font-medium text-danger">{error}</p>}
    </section>
  )
}

function accountTitle(account: AccountInfo | null) {
  if (!account) return 'Konto'
  if (account.provider === 'google') return account.displayName ?? account.email ?? 'Google-Konto'
  if (account.provider === 'local') return 'Demo-Modus'
  return 'Gast'
}

function accountSubtitle(account: AccountInfo | null) {
  if (!account) return 'Wird geladen …'
  if (account.provider === 'google') return account.email ?? 'Mit Google angemeldet'
  if (account.provider === 'local') return 'Daten liegen nur in diesem Browser'
  return 'Daten sind an dieses Gerät gebunden'
}

function Avatar({ account }: { account: AccountInfo | null }) {
  if (account?.photoURL) {
    return <img src={account.photoURL} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full object-cover" />
  }
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-ink shadow-accent">
      <UserRound className="size-7" strokeWidth={2.25} />
    </span>
  )
}

function StatusBadge({ account }: { account: AccountInfo | null }) {
  if (!account) return null
  const config = {
    google: { icon: ShieldCheck, label: 'Gesichert', className: 'bg-accent/15 text-accent-fg' },
    anonymous: { icon: ShieldAlert, label: 'Nicht gesichert', className: 'bg-sunken text-muted' },
    local: { icon: HardDrive, label: 'Lokal', className: 'bg-sunken text-muted' },
  }[account.provider]
  const Icon = config.icon
  return (
    <span className={`hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold sm:flex ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}
    </span>
  )
}

function InstallCard() {
  const install = useInstallState()
  const [installing, setInstalling] = useState(false)

  return (
    <Card title="App installieren" description="GymFlow läuft auch als App vom Homescreen, im Vollbild und offline.">
      {install.kind === 'installed' && (
        <p className="flex items-center gap-2 text-[14px] font-medium text-accent-fg">
          <Check className="size-4" strokeWidth={3} />
          GymFlow ist als App installiert.
        </p>
      )}
      {install.kind === 'prompt' && (
        <button
          type="button"
          disabled={installing}
          onClick={async () => {
            setInstalling(true)
            await install.install()
            setInstalling(false)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-[15px] font-semibold text-accent-ink shadow-accent transition active:scale-[0.98]"
        >
          <Download className="size-4.5" strokeWidth={2.5} />
          Als App installieren
        </button>
      )}
      {install.kind === 'ios' && (
        <p className="flex items-start gap-2 rounded-2xl bg-sunken p-4 text-[14px] leading-relaxed">
          <Share className="mt-0.5 size-4 shrink-0 text-accent-fg" />
          In Safari unten auf „Teilen“ tippen und dann „Zum Home-Bildschirm“ wählen.
        </p>
      )}
      {install.kind === 'unavailable' && (
        <p className="flex items-start gap-2 rounded-2xl bg-sunken p-4 text-[14px] leading-relaxed text-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          Öffne GymFlow in Chrome, Edge oder Safari auf dem Handy, um es zum Homescreen hinzuzufügen.
        </p>
      )}
    </Card>
  )
}

/** Google "G" logo (brand colors are required by Google's sign-in guidelines). */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
    </svg>
  )
}
