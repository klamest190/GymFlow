import { describe, expect, it } from 'vitest'
import rules from '../../firestore.rules?raw'
import { isEmailLogin, isValidUsername, normalizeUsername, suggestUsername } from './usernames'

describe('isValidUsername', () => {
  it.each(['anna', 'anna.schneider', 'max_1', 'a-b', '123', 'a'.repeat(20)])('accepts %s', (name) => {
    expect(isValidUsername(name)).toBe(true)
  })

  it.each(['ab', 'a'.repeat(21), 'Anna', 'anna schneider', '.anna', '-anna', 'anna@x', 'jürgen', ''])('rejects %j', (name) => {
    expect(isValidUsername(name)).toBe(false)
  })

  it('matches the pattern in firestore.rules', () => {
    // The rules must accept exactly what the app accepts; a drift would lock out new accounts.
    expect(rules).toContain(`name.matches('^[a-z0-9][a-z0-9._-]{2,19}$')`)
  })
})

describe('normalizeUsername / isEmailLogin', () => {
  it('trims and lower-cases', () => expect(normalizeUsername('  Anna.Schneider ')).toBe('anna.schneider'))
  it('treats anything with @ as e-mail', () => {
    expect(isEmailLogin('anna@example.de')).toBe(true)
    expect(isEmailLogin('anna')).toBe(false)
  })
})

describe('suggestUsername', () => {
  it.each([
    ['Anna Schneider', 'anna.schneider'],
    ['Jürgen Müller', 'juergen.mueller'],
    ['René  Côté', 'rene.cote'],
    ['  _Max ', 'max'],
    ["O'Brien", 'obrien'],
  ])('%s → %s', (name, expected) => {
    expect(suggestUsername(name)).toBe(expected)
    expect(isValidUsername(suggestUsername(name))).toBe(true)
  })

  it('cuts long names to 20 characters', () => expect(suggestUsername('Maximilian Alexander Mustermann')).toHaveLength(20))
})
