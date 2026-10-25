import { m } from 'framer-motion'
import { Check, Download, KeyRound, LoaderCircle, LogOut, PlayCircle, Share, Smartphone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { snap } from '../../lib/motion'
import { useBodyWeights } from '../../hooks/useData'
import { useAuth, useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useToast } from '../../components/ui/toastContext'
import { EXERCISES } from '../../data/exercises'
import { haptic, useTheme, type ThemePreference } from '../../hooks/useUi'
import { useInstallState } from '../../lib/pwa'
import { repository } from '../../services/repository'
import { RoleBadge, UserAvatar } from '../admin/UserBadges'
import { GamificationDashboard } from '../gamification/GamificationDashboard'
import { useReplayOnboarding } from '../onboarding/onboardingContext'
import { BodyWeightCard } from './BodyWeightCard'
import { ExportRow } from './ExportCard'
import { ProfileSection, SettingRow, SettingsList } from './ProfileCard'

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export function ProfilePage() {
  const { user, profile } = useSession()
  const { preference, setPreference } = useTheme()
  const toast = useToast()
  const replayOnboarding = useReplayOnboarding()
  // One subscription for the weight card and the export.
  const bodyWeights = useBodyWeights(user.uid)

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    repository.saveProfile(user.uid, { weeklyGoalDays }).catch((error) =>
      toast({ tone: 'error', title: 'Wochenziel nicht gespeichert', description: authErrorMessage(error) }),
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="headline text-[39px] lg:text-[49px]">Profil</h1>
      </header>

      <div className="mt-6 space-y-4 lg:mt-8">
        <AccountCard />

        <GamificationDashboard />

        <ProfileSection title="Training">
          <SettingsList>
            <SettingRow title="Wochenziel" description="Trainingstage pro Woche. Deinen Fortschritt zeigt die Statistik.">
              <div className="grid grid-cols-7 gap-1.5 rounded-xl bg-sunken p-1" role="radiogroup" aria-label="Trainingstage pro Woche">
                {GOAL_OPTIONS.map((days) => {
                  const active = profile.weeklyGoalDays === days
                  return (
                    <button
                      key={days}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${days} ${days === 1 ? 'Tag' : 'Tage'}`}
                      onClick={() => setGoal(days)}
                      className={`numeral relative rounded-lg py-2 text-[20px] transition-colors ${active ? 'text-bg' : 'text-muted hover:text-fg'}`}
                    >
                      {active && <m.span layoutId="goal-active" className="absolute inset-0 rounded-lg bg-fg" transition={snap} />}
                      <span className="relative">{days}</span>
                    </button>
                  )
                })}
              </div>
            </SettingRow>
            <DumbbellRow />
          </SettingsList>
          <BodyWeightCard entries={bodyWeights} />
        </ProfileSection>

        <ProfileSection title="App">
          <SettingsList>
            <SettingRow title="Darstellung" description="„System“ folgt deinem Gerät." inline>
              <div className="w-64">
                <SegmentedControl<ThemePreference>
                  label="Farbschema"
                  size="sm"
                  value={preference}
                  onChange={setPreference}
                  options={[
                    { value: 'light', label: 'Hell' },
                    { value: 'dark', label: 'Dunkel' },
                    { value: 'system', label: 'System' },
                  ]}
                />
              </div>
            </SettingRow>
            <ExportRow bodyWeights={bodyWeights} />
            <InstallRow />
            <SettingRow title="Einführung" description="Die kurze Tour zu Tracker, Übungen, Level und Wochenziel." inline>
              <button
                type="button"
                onClick={replayOnboarding}
                className="flex items-center gap-2 rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold transition hover:bg-fg hover:text-bg"
              >
                <PlayCircle className="size-4" />
                Ansehen
              </button>
            </SettingRow>
          </SettingsList>
        </ProfileSection>

        <p className="px-1 pt-2 text-center text-[12px] text-muted">
          GymFlow mit {EXERCISES.length} Übungen im Katalog.{' '}
          {repository.mode === 'firebase' ? 'Cloud-Sync aktiv' : 'Demo-Modus (lokal)'}
        </p>
      </div>
    </div>
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
          {profile.username && <p className="truncate text-[14px] font-medium text-fg/80">@{profile.username}</p>}
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
      className={`flex items-center justify-center gap-2 rounded-xl bg-sunken py-3 text-[15px] font-semibold transition hover:bg-surface-solid disabled:opacity-60 ${
        danger ? 'text-danger' : ''
      }`}
    >
      {busy ? <LoaderCircle className="size-4.5 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/** The user's dumbbell weight: where new exercises start, so it needn't be typed every time. */
function DumbbellRow() {
  const { user, profile } = useSession()
  const toast = useToast()

  const save = (dumbbellKg: number | null) => {
    if (dumbbellKg === null || dumbbellKg === profile.dumbbellKg) return
    repository.saveProfile(user.uid, { dumbbellKg }).catch((error) =>
      toast({ tone: 'error', title: 'Hantelgewicht nicht gespeichert', description: authErrorMessage(error) }),
    )
  }

  return (
    <SettingRow title="Meine Kurzhanteln" description="Kilo je Hantel, mit denen neue Übungen starten. Pro Satz änderst du es im Tracker." inline>
      <div className="flex items-center gap-2">
        <NumberStepper label="Gewicht je Hantel" value={profile.dumbbellKg} step={1} min={0.5} max={50} onChange={save} />
        <span className="text-[14px] font-medium text-muted">kg</span>
      </div>
    </SettingRow>
  )
}

function InstallRow() {
  const install = useInstallState()
  const [installing, setInstalling] = useState(false)

  return (
    <SettingRow title="App installieren" description="GymFlow läuft auch als App vom Homescreen, im Vollbild und offline.">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[15px] font-semibold text-accent-ink transition active:scale-[0.98]"
        >
          <Download className="size-4.5" strokeWidth={2.5} />
          Als App installieren
        </button>
      )}
      {install.kind === 'ios' && (
        <p className="flex items-start gap-2 rounded-xl bg-sunken p-4 text-[14px] leading-relaxed">
          <Share className="mt-0.5 size-4 shrink-0 text-accent-fg" />
          In Safari unten auf „Teilen“ tippen und dann „Zum Home-Bildschirm“ wählen.
        </p>
      )}
      {install.kind === 'unavailable' && (
        <p className="flex items-start gap-2 rounded-xl bg-sunken p-4 text-[14px] leading-relaxed text-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          Öffne GymFlow in Chrome, Edge oder Safari auf dem Handy, um es zum Homescreen hinzuzufügen.
        </p>
      )}
    </SettingRow>
  )
}
