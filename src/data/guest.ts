import { DEFAULT_DUMBBELL_KG, DEFAULT_WEEKLY_GOAL_DAYS, type UserProfile } from '../types/models'

/**
 * Guest mode: try GymFlow without an account. A guest session lives only in this browser's
 * localStorage (services/repository.ts routes every call for this uid to its own local store),
 * so it never reaches Firestore and needs no security rule.
 */
export const GUEST_UID = 'guest'

export const isGuestUid = (uid: string) => uid === GUEST_UID

/**
 * The exercises a guest can use: the top of the catalog order, easy and effective, covering
 * arms, back, legs, shoulders and chest. The rest of the catalog shows with a lock.
 */
export const GUEST_EXERCISE_IDS: ReadonlySet<string> = new Set([
  'bicep-curls',
  'one-arm-dumbbell-row',
  'lunges',
  'lateral-raises',
  'wide-grip-bench-press',
  'squats',
  'military-press',
  'romanian-deadlift',
])

/** The account document of a fresh guest session; it never leaves the device. */
export function createGuestProfile(now = Date.now()): UserProfile {
  return {
    id: GUEST_UID,
    email: '',
    username: null,
    displayName: 'Gast',
    role: 'user',
    status: 'active',
    weeklyGoalDays: DEFAULT_WEEKLY_GOAL_DAYS,
    dumbbellKg: DEFAULT_DUMBBELL_KG,
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    lastLoginAt: null,
    onboardingCompletedAt: null,
    gamification: null,
  }
}
