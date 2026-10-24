import { describe, expect, it } from 'vitest'
import { entry, log } from '../test/fixtures'
import { bodyWeightsToCsv, toCsv, workoutsToCsv } from './csv'

const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n')

describe('toCsv', () => {
  it('starts with a BOM and uses semicolons and decimal commas', () => {
    const csv = toCsv(['A', 'B'], [[1.5, 'x']])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)).toEqual(['A;B', '1,5;x'])
  })

  it('quotes cells with separators, quotes or line breaks', () => {
    // Rows end with \r\n, so a bare \n inside a quoted cell stays part of that row.
    expect(lines(toCsv(['Notiz'], [['a;b'], ['sagt "hi"'], ['x\ny']]))).toEqual(['Notiz', '"a;b"', '"sagt ""hi"""', '"x\ny"'])
  })

  it('leaves empty cells for missing values', () => expect(lines(toCsv(['A', 'B'], [[null, 2]]))[1]).toBe(';2'))
})

describe('workoutsToCsv', () => {
  it('writes one row per set, oldest day first', () => {
    const csv = workoutsToCsv([
      log('2026-10-21', [entry('Crunches', 1, 20, null, { primary: 'core' })]),
      log('2026-10-20', [entry('Bankdrücken', 2, 10, 62.5, { primary: 'chest' })]),
      log('2026-10-22', [entry('Curls', 1, 12, 7.5, { primary: 'biceps', perDumbbell: true })]),
    ])
    expect(lines(csv)).toEqual([
      'Datum;Übung;Muskelgruppe;Satz;Wiederholungen;Gewicht (kg);Gewicht gilt;Volumen (kg)',
      '2026-10-20;Bankdrücken;Brust;1;10;62,5;gesamt;625',
      '2026-10-20;Bankdrücken;Brust;2;10;62,5;gesamt;625',
      '2026-10-21;Crunches;Bauch;1;20;;;',
      '2026-10-22;Curls;Bizeps;1;12;7,5;je Hantel;180',
    ])
  })
})

it('exports body weights chronologically', () => {
  const csv = bodyWeightsToCsv([
    { date: '2026-10-24', weightKg: 81.9, updatedAt: 0 },
    { date: '2026-10-20', weightKg: 82.4, updatedAt: 0 },
  ])
  expect(lines(csv)).toEqual(['Datum;Körpergewicht (kg)', '2026-10-20;82,4', '2026-10-24;81,9'])
})
