import { m } from 'framer-motion'
import { Check, Download, KeyRound, LoaderCircle, Lock, LogIn, LogOut, PlayCircle, Share, Smartphone, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { snap } from '../../lib/motion'
import { useBodyWeights } from '../../hooks/useData'
import { useAuth, useSession } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { NumberStepper } from '../../components/ui/NumberStepper'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useToast } from '../../components/ui/toastContext'
import { EXERCISE_COUNT } from '../../data/exercises'
import { LOCALES, setLocale, useLocale, useT, type Locale } from '../../i18n'
import { haptic, useTheme, type ThemePreference } from '../../hooks/useUi'
import { useInstallState } from '../../lib/pwa'
import { formatRestClock, MAX_REST_SECONDS, MIN_REST_SECONDS, REST_STEP_SECONDS } from '../../lib/restTimer'
import { MAX_TEMPO_SECONDS, MIN_TEMPO_SECONDS } from '../../lib/tempoWave'
import { useRestTimer } from '../rest/restTimerContext'
import { useWaveTempo } from '../tracker/useWaveTempo'
import { repository } from '../../services/repository'
import { RoleBadge, UserAvatar } from '../admin/UserBadges'
import { GamificationDashboard } from '../gamification/GamificationDashboard'
import { useGuestGate } from '../guest/guestGate'
import { useReplayOnboarding } from '../onboarding/onboardingContext'
import { BodyWeightCard } from './BodyWeightCard'
import { ExportRow } from './ExportCard'
import { ProfileSection, SettingRow, SettingsList } from './ProfileCard'

const GOAL_OPTIONS = [1, 2, 3, 4, 5, 6, 7]

export function ProfilePage() {
  const { user, profile, isGuest } = useSession()
  const { preference, setPreference } = useTheme()
  const gate = useGuestGate()
  const toast = useToast()
  const replayOnboarding = useReplayOnboarding()
  const t = useT()
  // One subscription for the weight card and the export.
  const bodyWeights = useBodyWeights(user.uid)

  const setGoal = (weeklyGoalDays: number) => {
    haptic()
    repository.saveProfile(user.uid, { weeklyGoalDays }).catch((error) =>
      toast({ tone: 'error', title: t.profile.goalNotSaved, description: authErrorMessage(error) }),
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="headline text-[39px] lg:text-[49px]">{t.profile.title}</h1>
      </header>

      <div className="mt-6 space-y-4 lg:mt-8">
        {isGuest ? <GuestCard /> : <AccountCard />}

        <GamificationDashboard />

        <ProfileSection title={t.profile.training}>
          <SettingsList>
            <SettingRow title={t.profile.weeklyGoal} description={t.profile.weeklyGoalText}>
              <div className="grid grid-cols-7 gap-1.5 rounded-xl bg-sunken p-1" role="radiogroup" aria-label={t.profile.daysPerWeek}>
                {GOAL_OPTIONS.map((days) => {
                  const active = profile.weeklyGoalDays === days
                  return (
                    <button
                      key={days}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={t.common.days(days)}
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
            <RestRow />
            <WaveTempoRow />
          </SettingsList>
          <BodyWeightCard entries={bodyWeights} />
        </ProfileSection>

        <ProfileSection title={t.profile.app}>
          <SettingsList>
            <SettingRow title={t.profile.appearance} description={t.profile.appearanceText} inline>
              <div className="w-64">
                <SegmentedControl<ThemePreference>
                  label={t.profile.colorScheme}
                  size="sm"
                  value={preference}
                  onChange={setPreference}
                  options={[
                    { value: 'light', label: t.profile.light },
                    { value: 'dark', label: t.profile.dark },
                    { value: 'system', label: t.profile.system },
                  ]}
                />
              </div>
            </SettingRow>
            {isGuest ? (
              <SettingRow title={t.profile.exportData} description={t.profile.exportGuestText} inline>
                <button
                  type="button"
                  onClick={() => gate.showUpgrade({ kind: 'export' })}
                  className="flex items-center gap-2 rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold text-muted transition hover:text-fg"
                >
                  <Lock className="size-4" />
                  {t.profile.locked}
                </button>
              </SettingRow>
            ) : (
              <ExportRow bodyWeights={bodyWeights} />
            )}
            <LanguageRow />
            <InstallRow />
            <SettingRow title={t.profile.intro} description={t.profile.introText} inline>
              <button
                type="button"
                onClick={replayOnboarding}
                className="flex items-center gap-2 rounded-xl bg-sunken px-4 py-2.5 text-[14px] font-semibold transition hover:bg-fg hover:text-bg"
              >
                <PlayCircle className="size-4" />
                {t.profile.watch}
              </button>
            </SettingRow>
          </SettingsList>
        </ProfileSection>

        <p className="px-1 pt-2 text-center text-[12px] text-muted">
          {t.profile.footer(EXERCISE_COUNT)}{' '}
          {isGuest ? t.profile.footerGuest : repository.mode === 'firebase' ? t.profile.footerCloud : t.profile.footerDemo}
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
  const t = useT()

  const changePassword = async () => {
    setBusy('reset')
    try {
      await sendPasswordReset(profile.email)
      toast({
        tone: 'success',
        title: t.profile.mailSent,
        description: t.profile.mailSentText(profile.email),
      })
    } catch (error) {
      toast({ tone: 'error', title: t.profile.mailNotSent, description: authErrorMessage(error) })
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
          {t.profile.changePassword}
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
          {t.profile.signOut}
        </ActionButton>
      </div>
    </section>
  )
}

/**
 * The guest's account card: what the mode is, the way to an account, and leaving it. Leaving keeps
 * the data on this device for the next guest visit; deleting takes a second tap.
 */
function GuestCard() {
  const { profile } = useSession()
  const { signOut, resetGuest } = useAuth()
  const gate = useGuestGate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const t = useT()

  return (
    <section className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <UserAvatar user={profile} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[19px] font-semibold tracking-tight">{t.profile.guestMode}</h2>
          <p className="text-[14px] text-muted">{t.profile.guestModeText}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => gate.showUpgrade({ kind: 'all' })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[15px] font-semibold text-accent-ink transition active:scale-[0.98]"
      >
        <LogIn className="size-4.5" strokeWidth={2.5} />
        {t.profile.unlockAll}
      </button>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <ActionButton onClick={() => void signOut()} busy={false} icon={<LogOut className="size-4.5" />}>
          {t.profile.endGuest}
        </ActionButton>
        <ActionButton
          onClick={() => (confirmDelete ? resetGuest() : setConfirmDelete(true))}
          busy={false}
          icon={<Trash2 className="size-4.5" />}
          danger
        >
          {confirmDelete ? t.profile.confirmDeleteGuest : t.profile.deleteGuestData}
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
  const t = useT()
  const toast = useToast()

  const save = (dumbbellKg: number | null) => {
    if (dumbbellKg === null || dumbbellKg === profile.dumbbellKg) return
    repository.saveProfile(user.uid, { dumbbellKg }).catch((error) =>
      toast({ tone: 'error', title: t.profile.dumbbellNotSaved, description: authErrorMessage(error) }),
    )
  }

  return (
    <SettingRow title={t.profile.myDumbbells} description={t.profile.myDumbbellsText} inline>
      <div className="flex items-center gap-2">
        <NumberStepper label={t.profile.weightPerDumbbell} value={profile.dumbbellKg} step={1} min={0.5} max={50} onChange={save} />
        <span className="text-[14px] font-medium text-muted">kg</span>
      </div>
    </SettingRow>
  )
}

/** Rest between sets; stored per device like the theme, so it needs no account field. */
function RestRow() {
  const { restSeconds, setRestSeconds } = useRestTimer()
  const t = useT()
  return (
    <SettingRow title={t.profile.restTime} description={t.profile.restTimeText} inline>
      <div className="flex items-center gap-2">
        <NumberStepper
          label={t.profile.restTimeSeconds}
          value={restSeconds}
          step={REST_STEP_SECONDS}
          min={MIN_REST_SECONDS}
          max={MAX_REST_SECONDS}
          onChange={(seconds) => seconds !== null && setRestSeconds(seconds)}
        />
        <span className="w-14 text-[14px] font-medium text-muted tabular-nums">{formatRestClock(restSeconds * 1000)} min</span>
      </div>
    </SettingRow>
  )
}

/** Pace of the training wave; stored per device like the rest time. */
function WaveTempoRow() {
  const [tempo, setTempo] = useWaveTempo()
  const t = useT()
  const phases = [
    { key: 'liftSeconds', label: t.profile.lift },
    { key: 'lowerSeconds', label: t.profile.lower },
  ] as const
  return (
    <SettingRow title={t.profile.wave} description={t.profile.waveText} inline>
      <div className="grid gap-2">
        {phases.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 text-[14px] font-medium text-muted">{label}</span>
            <NumberStepper
              label={t.profile.inSeconds(label)}
              value={tempo[key]}
              step={1}
              min={MIN_TEMPO_SECONDS}
              max={MAX_TEMPO_SECONDS}
              onChange={(seconds) => seconds !== null && setTempo({ ...tempo, [key]: seconds })}
            />
            <span className="text-[14px] font-medium text-muted">s</span>
          </div>
        ))}
      </div>
    </SettingRow>
  )
}

function InstallRow() {
  const install = useInstallState()
  const [installing, setInstalling] = useState(false)
  const t = useT()

  return (
    <SettingRow title={t.profile.installApp} description={t.profile.installAppText}>
      {install.kind === 'installed' && (
        <p className="flex items-center gap-2 text-[14px] font-medium text-accent-fg">
          <Check className="size-4" strokeWidth={3} />
          {t.profile.installed}
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
          {t.profile.installAsApp}
        </button>
      )}
      {install.kind === 'ios' && (
        <p className="flex items-start gap-2 rounded-xl bg-sunken p-4 text-[14px] leading-relaxed">
          <Share className="mt-0.5 size-4 shrink-0 text-accent-fg" />
          {t.profile.installIos}
        </p>
      )}
      {install.kind === 'unavailable' && (
        <p className="flex items-start gap-2 rounded-xl bg-sunken p-4 text-[14px] leading-relaxed text-muted">
          <Smartphone className="mt-0.5 size-4 shrink-0" />
          {t.profile.installUnavailable}
        </p>
      )}
    </SettingRow>
  )
}

/** Each language in its own name, so it can be found whichever one is showing. */
const LANGUAGE_NAMES: Record<Locale, string> = { de: 'Deutsch', en: 'English' }

/** App language; stored per device like the theme. */
function LanguageRow() {
  const t = useT()
  const locale = useLocale()
  return (
    <SettingRow title={t.profile.language} description={t.profile.languageText} inline>
      <div className="w-64">
        <SegmentedControl<Locale>
          label={t.profile.language}
          size="sm"
          value={locale}
          onChange={setLocale}
          options={LOCALES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }))}
        />
      </div>
    </SettingRow>
  )
}
