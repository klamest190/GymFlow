import { FileSpreadsheet } from 'lucide-react'
import { useToast } from '../../components/ui/toastContext'
import { bodyWeightsToCsv, downloadFile, workoutsToCsv } from '../../lib/csv'
import { todayKey } from '../../lib/dates'
import type { BodyWeightEntry } from '../../types/models'
import { useGamification } from '../gamification/gamificationContext'
import { Card } from './ProfileCard'

/** Downloads the own data as CSV (for backups and Excel); nothing leaves the device otherwise. */
export function ExportCard({ bodyWeights }: { bodyWeights: BodyWeightEntry[] | null }) {
  const gamification = useGamification()
  const toast = useToast()
  const logs = gamification?.logs ?? null
  const sets = logs?.reduce((sum, log) => sum + log.totals.sets, 0) ?? 0

  const exportWorkouts = () => {
    if (!logs) return
    downloadFile(`gymflow-training-${todayKey()}.csv`, workoutsToCsv(logs))
    toast({ tone: 'success', title: 'Export erstellt', description: `${logs.length} Trainingstage mit ${sets} Sätzen.` })
  }

  const exportBodyWeights = () => {
    if (!bodyWeights) return
    downloadFile(`gymflow-koerpergewicht-${todayKey()}.csv`, bodyWeightsToCsv(bodyWeights))
    toast({ tone: 'success', title: 'Export erstellt', description: `${bodyWeights.length} Einträge.` })
  }

  return (
    <Card title="Daten exportieren" description="Als CSV-Datei, z. B. als Sicherung oder für Excel und Google Tabellen. Eine Zeile pro Satz.">
      <div className="grid gap-2 sm:grid-cols-2">
        <ExportButton onClick={exportWorkouts} disabled={!logs || logs.length === 0} label="Trainingsdaten" detail={logs ? `${logs.length} Tage` : '…'} />
        <ExportButton
          onClick={exportBodyWeights}
          disabled={!bodyWeights || bodyWeights.length === 0}
          label="Körpergewicht"
          detail={bodyWeights ? `${bodyWeights.length} Einträge` : '…'}
        />
      </div>
    </Card>
  )
}

function ExportButton({ onClick, disabled, label, detail }: { onClick: () => void; disabled: boolean; label: string; detail: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-2xl bg-sunken px-4 py-3 text-left transition hover:bg-surface-solid disabled:opacity-50"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-fg">
        <FileSpreadsheet className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-[12px] text-muted">CSV · {detail}</span>
      </span>
    </button>
  )
}
