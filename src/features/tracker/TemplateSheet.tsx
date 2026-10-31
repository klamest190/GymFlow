import { AnimatePresence, m } from 'framer-motion'
import { BookmarkPlus, ChevronRight, LoaderCircle, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useUserId } from '../../auth/authContext'
import { authErrorMessage } from '../../auth/authErrors'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/toastContext'
import { getExercise } from '../../data/exercises'
import { BUILT_IN_TEMPLATES } from '../../data/templates'
import { useTemplates } from '../../hooks/useData'
import { repository } from '../../services/repository'
import type { WorkoutEntry, WorkoutTemplate } from '../../types/models'

const MAX_NAME_LENGTH = 40

interface TemplateSheetProps {
  open: boolean
  onClose: () => void
  /** The selected day's entries: the source for "save as template". */
  entries: WorkoutEntry[]
  onApply: (template: WorkoutTemplate) => void
}

/** Pick a template to fill the day, or save the current day as a new one. */
export function TemplateSheet({ open, onClose, entries, onApply }: TemplateSheetProps) {
  const userId = useUserId()
  const toast = useToast()
  const own = useTemplates(userId)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await repository.saveTemplate(userId, {
        name: trimmed,
        exercises: entries.map((entry) => ({
          exerciseId: entry.exerciseId,
          // An exercise without a logged set yet keeps the plan it came with.
          sets: entry.sets.length > 0 ? entry.sets.map(({ reps, weightKg }) => ({ reps, weightKg })) : (entry.plannedSets ?? []),
        })),
      })
      toast({ tone: 'success', title: 'Vorlage gespeichert', description: `„${trimmed}“ steht ab jetzt unter Vorlagen bereit.` })
      setNaming(false)
      setName('')
    } catch (error) {
      toast({ tone: 'error', title: 'Vorlage nicht gespeichert', description: authErrorMessage(error) })
    }
    setSaving(false)
  }

  const remove = (template: WorkoutTemplate) => {
    repository
      .deleteTemplate(userId, template.id)
      .then(() => toast({ tone: 'info', title: `„${template.name}“ gelöscht` }))
      .catch((error) => toast({ tone: 'error', title: 'Löschen fehlgeschlagen', description: authErrorMessage(error) }))
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Vorlagen"
      subtitle="Ein ganzes Training mit einem Tipp eintragen."
      footer={
        entries.length > 0 && (
          <AnimatePresence mode="wait" initial={false}>
            {naming ? (
              <m.form
                key="name"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void save()
                }}
              >
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name, z. B. „Push Montag“"
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus
                  className="min-w-0 flex-1 rounded-xl bg-sunken px-4 py-3 text-[16px] outline-none ring-fg/40 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={!name.trim() || saving}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-ink disabled:opacity-50"
                >
                  {saving && <LoaderCircle className="size-4 animate-spin" />}
                  Speichern
                </button>
              </m.form>
            ) : (
              <m.button
                key="start"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNaming(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sunken py-3.5 text-[15px] font-semibold transition hover:bg-surface"
              >
                <BookmarkPlus className="size-4.5" />
                Diesen Tag als Vorlage speichern
              </m.button>
            )}
          </AnimatePresence>
        )
      }
    >
      <div className="space-y-6 pb-2">
        <Section title="Eigene Vorlagen">
          {own === null ? (
            <div className="skeleton h-16 rounded-2xl" />
          ) : own.length === 0 ? (
            <p className="rounded-xl bg-sunken px-4 py-3.5 text-[14px] text-muted">
              Noch keine eigenen Vorlagen. Trag ein Training ein und speichere es unten als Vorlage.
            </p>
          ) : (
            <ul className="space-y-2">
              {own.map((template) => (
                <TemplateRow key={template.id} template={template} onApply={onApply} onDelete={() => remove(template)} />
              ))}
            </ul>
          )}
        </Section>
        <Section title="Von GymFlow">
          <ul className="space-y-2">
            {BUILT_IN_TEMPLATES.map((template) => (
              <TemplateRow key={template.id} template={template} onApply={onApply} />
            ))}
          </ul>
        </Section>
      </div>
    </Sheet>
  )
}

function TemplateRow({ template, onApply, onDelete }: { template: WorkoutTemplate; onApply: (template: WorkoutTemplate) => void; onDelete?: () => void }) {
  const names = template.exercises.map((item) => getExercise(item.exerciseId)?.name).filter(Boolean)
  const sets = template.exercises.reduce((sum, item) => sum + item.sets.length, 0)
  return (
    <li className="flex items-center gap-2 rounded-2xl bg-sunken p-1.5 pl-4">
      <button type="button" onClick={() => onApply(template)} className="group flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold tracking-tight">{template.name}</span>
          <span className="block truncate text-[13px] text-muted">
            {names.length} Übungen, {sets} Sätze: {names.join(', ')}
          </span>
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-solid transition group-hover:bg-accent group-hover:text-accent-ink">
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-danger/10 hover:text-danger"
          aria-label={`Vorlage „${template.name}“ löschen`}
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  )
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-muted">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  )
}
