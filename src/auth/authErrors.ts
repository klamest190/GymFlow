import { messages, type Messages } from '../i18n'

type ErrorKey = Exclude<keyof Messages['auth']['errors'], 'generic' | 'withCode'>

/** Messages for the Firebase error codes users can actually run into. */
const CODES: Record<string, ErrorKey> = {
  // Sign-in
  'auth/invalid-credential': 'wrongCredentials',
  'auth/wrong-password': 'wrongCredentials',
  'auth/user-not-found': 'wrongCredentials',
  'auth/invalid-email': 'invalidEmail',
  'auth/user-disabled': 'userDisabled',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/network-request-failed': 'network',
  'auth/operation-not-allowed': 'notEnabled',
  'auth/missing-password': 'missingPassword',
  // Deployment configuration (e.g. missing or mistyped environment variables on the host)
  'auth/invalid-api-key': 'invalidApiKey',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'invalidApiKey',
  'auth/configuration-not-found': 'configurationNotFound',
  'auth/unauthorized-domain': 'unauthorizedDomain',
  // Account creation (admin)
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  'username-taken': 'usernameTaken',
  // Firestore
  'permission-denied': 'permissionDenied',
  unavailable: 'unavailable',
}

export function authErrorMessage(error: unknown, fallback?: string): string {
  const texts = messages().auth.errors
  const code = (error as { code?: string } | null)?.code ?? ''
  if (CODES[code]) return texts[CODES[code]]
  // An API key restricted to other websites (Google Cloud → API keys → website restrictions).
  if (code.startsWith('auth/requests-from-referer-')) return texts.refererBlocked
  console.error('[GymFlow] unmapped error', error)
  const message = fallback ?? texts.generic
  // Show the raw code so unexpected problems can be diagnosed without dev tools.
  return code ? texts.withCode(message, code) : message
}
