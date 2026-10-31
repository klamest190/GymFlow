import { describe, expect, it } from 'vitest'
import { DRAFT_MAX_AGE_MS, parseSetDrafts, withDraft } from './setDrafts'

const now = 1_000_000_000

describe('parseSetDrafts', () => {
  it('restores recent drafts and drops stale or malformed ones', () => {
    const stored = JSON.stringify({
      fresh: { reps: 10, weightKg: 8, savedAt: now - 60_000 },
      stale: { reps: 10, weightKg: 8, savedAt: now - DRAFT_MAX_AGE_MS - 1 },
      broken: { reps: 'x', weightKg: 8, savedAt: now },
      bodyweight: { reps: 20, weightKg: null, savedAt: now },
    })
    expect(parseSetDrafts(stored, now)).toEqual({
      fresh: { reps: 10, weightKg: 8, savedAt: now - 60_000 },
      bodyweight: { reps: 20, weightKg: null, savedAt: now },
    })
  })

  it('starts empty without or with unreadable storage', () => {
    expect(parseSetDrafts(null, now)).toEqual({})
    expect(parseSetDrafts('not json', now)).toEqual({})
  })
})

describe('withDraft', () => {
  it('sets, replaces and removes the draft of one entry', () => {
    const one = withDraft({}, 'a', { reps: 10, weightKg: 8 }, now)
    expect(one).toEqual({ a: { reps: 10, weightKg: 8, savedAt: now } })
    expect(withDraft(one, 'a', { reps: 9, weightKg: 8 }, now + 1).a.reps).toBe(9)
    expect(withDraft(one, 'a', null, now)).toEqual({})
  })
})
