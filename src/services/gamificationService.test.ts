import { describe, expect, it } from 'vitest'
import { day, entry, log } from '../test/fixtures'
import type { GamificationState } from '../types/models'
import {
  XP_REWARDS,
  buildGamificationState,
  detectProgressEvents,
  evaluateProgress,
  isSameState,
  levelProgress,
  rankForLevel,
  summarizeProgress,
  volumeXP,
  xpForNextLevel,
} from './gamificationService'

describe('XP curve', () => {
  it('needs floor(100 · level^1.1) XP for the next level', () => {
    expect(xpForNextLevel(1)).toBe(100)
    expect(xpForNextLevel(2)).toBe(214)
    expect(xpForNextLevel(10)).toBe(Math.floor(100 * 10 ** 1.1))
  })

  it('gets harder with every level', () => {
    for (let level = 1; level < 150; level++) expect(xpForNextLevel(level + 1)).toBeGreaterThan(xpForNextLevel(level))
  })

  it('splits total XP into level and progress', () => {
    expect(levelProgress(0)).toEqual({ level: 1, currentXP: 0, requiredXP: 100, ratio: 0 })
    expect(levelProgress(99).level).toBe(1)
    expect(levelProgress(100)).toMatchObject({ level: 2, currentXP: 0, requiredXP: 214 })
    expect(levelProgress(100 + 200)).toMatchObject({ level: 2, currentXP: 200 })
  })

  it('treats invalid input as 0 XP', () => {
    expect(levelProgress(-50)).toMatchObject({ level: 1, currentXP: 0 })
    expect(levelProgress(Number.NaN)).toMatchObject({ level: 1, currentXP: 0 })
  })
})

describe('ranks', () => {
  it.each([
    [1, 'iron'],
    [9, 'iron'],
    [10, 'bronze'],
    [19, 'bronze'],
    [20, 'silver'],
    [39, 'silver'],
    [40, 'gold'],
    [60, 'platinum'],
    [80, 'diamond'],
    [99, 'diamond'],
    [100, 'grandmaster'],
    [500, 'grandmaster'],
  ])('level %i is %s', (level, rank) => {
    expect(rankForLevel(level).id).toBe(rank)
  })
})

describe('summarizeProgress', () => {
  // Days 1–3 in a row (+ an empty day 4), then 6 days in a row.
  const logs = [
    // 10 sets × 10 reps × 40 kg = 4.000 kg per day: crosses 10.000 kg on day 3.
    day('2026-10-01', 10, 40),
    day('2026-10-02', 10, 40),
    day('2026-10-03', 10, 40, 23),
    log('2026-10-04', []),
    ...['10', '11', '12', '13', '14', '15'].map((d) => day(`2026-10-${d}`, 2)),
  ]
  const summary = summarizeProgress(logs)

  it('counts only days with sets as workouts', () => {
    expect(summary.metrics.workouts).toBe(9)
    expect(summary.metrics.sets).toBe(42)
  })

  it('pays XP per set, per workout and every 3rd day of a streak', () => {
    expect(summary.xp.sets).toBe(42 * XP_REWARDS.set)
    expect(summary.xp.workouts).toBe(9 * XP_REWARDS.workout)
    // Day 3 of the first streak, days 3 and 6 of the second.
    expect(summary.xp.streaks).toBe(3 * XP_REWARDS.streakBonus)
    // 400 kg sets hit the cap of 15; 200 kg sets earn 10.
    expect(summary.xp.volume).toBe(3 * 10 * 15 + 6 * 2 * 10)
    expect(summary.totalXP).toBe(summary.xp.sets + summary.xp.volume + summary.xp.workouts + summary.xp.streaks)
  })

  it('pays the volume bonus per 20 kg, capped per set, for both dumbbells', () => {
    expect([0, 19, 20, 120, 299, 300, 5000].map(volumeXP)).toEqual([0, 0, 1, 6, 14, 15, 15])
    // 12 reps with two 5 kg dumbbells move 120 kg.
    expect(summarizeProgress([log('2026-10-01', [entry('curls', 1, 12, 5, { perDumbbell: true })])]).xp.volume).toBe(6)
  })

  it('tracks streaks, months and volume', () => {
    expect(summary.metrics.longestStreak).toBe(6)
    expect(summary.metrics.bestMonthWorkouts).toBe(9)
    expect(summary.metrics.volumeKg).toBe(3 * 10 * 10 * 40 + 6 * 2 * 10 * 20)
  })

  it('records the day each achievement was reached', () => {
    expect(summary.reachedOn['first-workout']).toBe('2026-10-01')
    expect(summary.reachedOn['iron-will']).toBe('2026-10-03')
    expect(summary.reachedOn['volume-monster']).toBe('2026-10-03')
    expect(summary.reachedOn['night-owl']).toBe('2026-10-03')
    expect(summary.reachedOn['unstoppable']).toBeUndefined()
    expect(summary.reachedOn['consistency-king']).toBeUndefined()
  })

  it('does not count editing an old day late at night as a late workout', () => {
    const edited = { ...day('2026-10-01'), updatedAt: new Date('2026-10-05T23:15:00').getTime() }
    expect(summarizeProgress([edited]).metrics.lateWorkouts).toBe(0)
  })

  it('is independent of the order of the logs', () => {
    expect(summarizeProgress([...logs].reverse())).toEqual(summary)
  })
})

describe('state and events', () => {
  const before = evaluateProgress([day('2026-10-01')], null).state
  const after = evaluateProgress([day('2026-10-01'), day('2026-10-02'), day('2026-10-03', 20)], before).state

  it('celebrates a level-up and new achievements', () => {
    const events = detectProgressEvents(before, after)
    expect(events.some((event) => event.kind === 'level-up')).toBe(true)
    expect(events.filter((event) => event.kind === 'achievement').map((event) => event.achievement.id)).toContain('iron-will')
  })

  it('flags a rank change', () => {
    const iron: GamificationState = { ...before, level: 9, rank: 'iron' }
    const bronze: GamificationState = { ...before, level: 10, rank: 'bronze' }
    const [event] = detectProgressEvents(iron, bronze)
    expect(event).toMatchObject({ kind: 'level-up', level: 10, rankUp: true })
  })

  it('keeps achievements but not XP when logs are deleted, and stays silent', () => {
    const emptied = buildGamificationState(summarizeProgress([]), after)
    expect(emptied.totalXP).toBe(0)
    expect(emptied.level).toBe(1)
    expect(emptied.unlockedAchievements['iron-will']).toBe('2026-10-03')
    expect(detectProgressEvents(after, emptied)).toEqual([])
  })

  it('keeps the original unlock date', () => {
    const earlier = { ...after, unlockedAchievements: { ...after.unlockedAchievements, 'first-workout': '2026-09-01' } }
    expect(buildGamificationState(summarizeProgress([day('2026-10-01')]), earlier).unlockedAchievements['first-workout']).toBe('2026-09-01')
  })

  it('is stable: re-deriving from the stored state changes nothing', () => {
    const again = evaluateProgress([day('2026-10-01'), day('2026-10-02'), day('2026-10-03', 20)], after).state
    expect(isSameState(after, again)).toBe(true)
    expect(isSameState(after, { ...again, totalXP: again.totalXP + 1 })).toBe(false)
  })
})
