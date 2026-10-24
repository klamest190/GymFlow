import { describe, expect, it } from 'vitest'
import { entry, log } from '../test/fixtures'
import { detectNewRecords, formatRecordValue, personalRecords, recordImprovements } from './records'

const logs = [
  log('2026-10-12', [entry('bench', 3, 10, 60), entry('crunches', 3, 15)]),
  log('2026-10-14', [entry('bench', 3, 8, 62.5), entry('crunches', 3, 15)]),
  log('2026-10-16', [entry('bench', 3, 8, 62.5), entry('crunches', 3, 20)]),
  log('2026-10-20', [entry('bench', 3, 6, 65)]),
]

describe('personalRecords', () => {
  it('keeps the heaviest set (weighted) or most reps (bodyweight), first day reached', () => {
    const records = personalRecords(logs)
    expect(records.get('bench')).toMatchObject({ kind: 'weight', value: 65, date: '2026-10-20' })
    expect(records.get('crunches')).toMatchObject({ kind: 'reps', value: 20, date: '2026-10-16' })
  })
})

describe('recordImprovements', () => {
  it('lists each day a best was beaten, not the first session or equal values', () => {
    expect(recordImprovements(logs).map(({ exerciseId, date, value, previous }) => [exerciseId, date, value, previous])).toEqual([
      ['bench', '2026-10-14', 62.5, 60],
      ['crunches', '2026-10-16', 20, 15],
      ['bench', '2026-10-20', 65, 62.5],
    ])
  })

  it('is independent of the log order', () => {
    expect(recordImprovements([...logs].reverse())).toEqual(recordImprovements(logs))
  })
})

describe('detectNewRecords', () => {
  it('reports raised records only', () => {
    const before = personalRecords(logs.slice(0, 3))
    const after = personalRecords(logs)
    expect(detectNewRecords(before, after)).toEqual([{ record: after.get('bench'), previous: 62.5 }])
  })

  it('ignores exercises trained for the first time', () => {
    const before = personalRecords(logs.slice(0, 1))
    const after = personalRecords([...logs.slice(0, 1), log('2026-10-13', [entry('squats', 3, 5, 100)])])
    expect(detectNewRecords(before, after)).toEqual([])
  })
})

it('formats record values', () => {
  expect(formatRecordValue('weight', 62.5)).toBe('62,5 kg')
  expect(formatRecordValue('reps', 20)).toBe('20 Wdh.')
})
