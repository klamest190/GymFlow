/** German messages for the Firebase error codes users can actually run into. */
const MESSAGES: Record<string, string> = {
  // Sign-in
  'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
  'auth/wrong-password': 'E-Mail oder Passwort ist falsch.',
  'auth/user-not-found': 'E-Mail oder Passwort ist falsch.',
  'auth/invalid-email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
  'auth/user-disabled': 'Dieser Zugang wurde gesperrt.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.',
  'auth/network-request-failed': 'Keine Verbindung. Bitte prüfe deine Internetverbindung.',
  'auth/operation-not-allowed': 'Die Anmeldung per E-Mail ist in Firebase noch nicht aktiviert.',
  'auth/missing-password': 'Bitte gib dein Passwort ein.',
  // Account creation (admin)
  'auth/email-already-in-use':
    'Für diese E-Mail existiert bereits ein Login. Falls das Konto gelöscht wurde, entferne den Login zuerst in der Firebase Console (Authentication → Nutzer).',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  // Firestore
  'permission-denied': 'Dafür fehlen dir die Berechtigungen.',
  unavailable: 'Der Server ist gerade nicht erreichbar. Bitte versuche es später erneut.',
}

export function authErrorMessage(error: unknown, fallback = 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'): string {
  const code = (error as { code?: string } | null)?.code ?? ''
  return MESSAGES[code] ?? fallback
}
