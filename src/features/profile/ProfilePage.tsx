import { motion } from 'framer-motion'
import { Check, Download, KeyRound, LoaderCircle, LogOut, Share, Smartphone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth, useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useToast } from '../../components/ui/toastContext'
import { EXERCISES } from '../../data/exercises'
import { haptic, useTheme, type ThemePreference } from '../../hooks/useUi'
import { useInstallState } from '../../lib/pwa'
import { repository } from '../../services/repository'
import { RoleBadge, UserAvatar } from '../admin/UserBadges'
import { GamificationDashboard } from '../gamification/GamificationDashboard'

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export function ProfilePage() {
  const { user, profile } = useSession()
  const { preference, setPreference } = useTheme()
  const toast = useToast()

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    repository.saveProfile(user.uid, { weeklyGoalDays }).catch((error) =>
      toast({ tone: 'error', title: 'Wochenziel nicht gespeichert', description: authErrorMessage(error) }),
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">Einstellungen</p>
        <h1 className="mt-1 text-[34px] font-bold leading-none tracking-tight lg:text-[44px]">Profil</h1>
      </header>

      <div className="mt-6 space-y-4 lg:mt-8">
        <AccountCard />

        <GamificationDashboard />

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

function AccountCard() {
  const { profile } = useSession()
  const { signOut, sendPasswordReset } = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState<'reset' | 'signout' | null>(null)

  const changePassword = async () => {
    setBusy('reset')
    try {
      await sendPasswordReset(profile.email)
      toast({
        tone: 'success',
        title: 'E-Mail ist unterwegs',
        description: `Über den Link in der Mail an ${profile.email} legst du ein neues Passwort fest.`,
      })
    } catch (error) {
      toast({ tone: 'error', title: 'E-Mail nicht gesendet', description: authErrorMessage(error) })
    }
    setBusy(null)
  }

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <UserAvatar user={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[19px] font-semibold tracking-tight">{profile.displayName}</h2>
          <p className="truncate text-[14px] text-muted">{profile.email}</p>
        </div>
        {profile.role === 'admin' && <RoleBadge role="admin" />}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ActionButton onClick={changePassword} busy={busy === 'reset'} icon={<KeyRound className="size-4.5" />}>
          Passwort ändern
        </ActionButton>
        <ActionButton
          onClick={() => {
            setBusy('signout')
            void signOut()
          }}
          busy={busy === 'signout'}
          icon={<LogOut className="size-4.5" />}
          danger
        >
          Abmelden
        </ActionButton>
      </div>
    </section>
  )
}

function ActionButton({
  onClick,
  busy,
  icon,
  danger,
  children,
}: {
  onClick: () => void
  busy: boolean
  icon: ReactNode
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`flex items-center justify-center gap-2 rounded-2xl bg-sunken py-3 text-[15px] font-semibold transition hover:bg-surface-solid disabled:opacity-60 ${
        danger ? 'text-danger' : ''
      }`}
    >
      {busy ? <LoaderCircle className="size-4.5 animate-spin" /> : icon}
      {children}
    </button>
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
