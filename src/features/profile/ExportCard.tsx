import { FileSpreadsheet } from 'lucide-react'
import { useToast } from '../../components/ui/toastContext'
import { bodyWeightsToCsv, downloadFile, workoutsToCsv } from '../../lib/csv'
import { todayKey } from '../../lib/dates'
import type { BodyWeightEntry } from '../../types/models'
import { useGamification } from '../gamification/gamificationContext'
import { SettingRow } from './ProfileCard'
import { useT } from '../../i18n'

/** Downloads the own data as CSV (for backups and Excel); nothing leaves the device otherwise. */
export function ExportRow({ bodyWeights }: { bodyWeights: BodyWeightEntry[] | null }) {
  const gamification = useGamification()
  const toast = useToast()
  const t = useT()
  const logs = gamification?.logs ?? null
  const sets = logs?.reduce((sum, log) => sum + log.totals.sets, 0) ?? 0

  const exportWorkouts = () => {
    if (!logs) return
    downloadFile(`${t.profile.workoutFile}-${todayKey()}.csv`, workoutsToCsv(logs))
    toast({ tone: 'success', title: t.profile.exportDone, description: t.profile.exportWorkoutsText(logs.length, sets) })
  }

  const exportBodyWeights = () => {
    if (!bodyWeights) return
    downloadFile(`${t.profile.bodyWeightFile}-${todayKey()}.csv`, bodyWeightsToCsv(bodyWeights))
    toast({ tone: 'success', title: t.profile.exportDone, description: t.profile.exportEntriesText(bodyWeights.length) })
  }

  return (
    <SettingRow title={t.profile.exportData} description={t.profile.exportText}>
      <div className="grid gap-2 sm:grid-cols-2">
        <ExportButton onClick={exportWorkouts} disabled={!logs || logs.length === 0} label={t.profile.trainingData} detail={logs ? t.common.days(logs.length) : '…'} />
        <ExportButton
          onClick={exportBodyWeights}
          disabled={!bodyWeights || bodyWeights.length === 0}
          label={t.profile.bodyWeight}
          detail={bodyWeights ? t.profile.entries(bodyWeights.length) : '…'}
        />
      </div>
    </SettingRow>
  )
}

function ExportButton({ onClick, disabled, label, detail }: { onClick: () => void; disabled: boolean; label: string; detail: string }) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-xl bg-sunken px-4 py-3 text-left transition hover:bg-surface-solid disabled:opacity-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-solid text-fg">
        <FileSpreadsheet className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-[12px] text-muted">{t.profile.csvFile(detail)}</span>
      </span>
    </button>
  )
}
