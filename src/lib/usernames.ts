/**
 * Usernames are an alternative login to the e-mail. Firebase Auth only knows e-mail/password, so
 * `usernames/{username}` maps each name to its login e-mail (see README → Benutzername-Login).
 *
 * Keep the pattern in sync with `validUsername()` in firestore.rules.
 */
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,19}$/

export const USERNAME_RULES = '3–20 Zeichen: Kleinbuchstaben, Ziffern, Punkt, Binde- oder Unterstrich.'

export const normalizeUsername = (value: string) => value.trim().toLowerCase()

export const isValidUsername = (value: string) => USERNAME_PATTERN.test(value)

/** Anything with an @ is treated as e-mail, everything else as username (usernames can't contain @). */
export const isEmailLogin = (login: string) => login.includes('@')

const UMLAUTS: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

/** "Anna Schneider" → "anna.schneider", as a starting point the admin can still edit. */
export function suggestUsername(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => UMLAUTS[char])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+/, '')
    .slice(0, 20)
}
