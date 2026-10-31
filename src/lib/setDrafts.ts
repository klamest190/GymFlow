/**
 * The set being entered but not yet logged, per workout entry. Kept in localStorage, so a draft
 * survives switching tabs during the rest and iOS reloading the app in the background.
 */
export interface StoredDraft {
  reps: number
  weightKg: number | null
  savedAt: number
}

export type SetDrafts = Record<string, StoredDraft>

/** A draft left this long belongs to a past workout and is dropped. */
export const DRAFT_MAX_AGE_MS = 12 * 60 * 60_000

export function parseSetDrafts(stored: string | null, now: number): SetDrafts {
  if (!stored) return {}
  try {
    const drafts: SetDrafts = {}
    for (const [entryId, value] of Object.entries(JSON.parse(stored) as Record<string, Partial<StoredDraft>>)) {
      const valid =
        typeof value.reps === 'number' &&
        (typeof value.weightKg === 'number' || value.weightKg === null) &&
        typeof value.savedAt === 'number' &&
        now - value.savedAt <= DRAFT_MAX_AGE_MS
      if (valid) drafts[entryId] = { reps: value.reps!, weightKg: value.weightKg!, savedAt: value.savedAt! }
    }
    return drafts
  } catch {
    return {}
  }
}

/** `drafts` with the entry's draft set to `values`, or removed for `null`. */
export function withDraft(drafts: SetDrafts, entryId: string, values: Omit<StoredDraft, 'savedAt'> | null, now: number): SetDrafts {
  const { [entryId]: _removed, ...rest } = drafts
  return values ? { ...rest, [entryId]: { ...values, savedAt: now } } : rest
}
