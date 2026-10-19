// Without visually ambiguous characters (0/O, 1/l/I), so a password can be read out or typed from a note.
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!#$%&*+-?@'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

export const MIN_PASSWORD_LENGTH = 8

function randomIndex(max: number): number {
  // Rejection sampling avoids modulo bias.
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const buffer = new Uint32Array(1)
  do crypto.getRandomValues(buffer)
  while (buffer[0] >= limit)
  return buffer[0] % max
}

const pick = (chars: string) => chars[randomIndex(chars.length)]

/** Cryptographically random password with at least one character of every class. */
export function generatePassword(length = 14): string {
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)]
  while (chars.length < length) chars.push(pick(ALL))
  // Fisher–Yates shuffle so the guaranteed classes aren't always at the start.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1)
    ;[chars[index], chars[swap]] = [chars[swap], chars[index]]
  }
  return chars.join('')
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
