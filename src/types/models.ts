/**
 * GymFlow domain model.
 *
 * Firestore layout (see README.md for the full schema):
 *   users/{uid}                           → UserProfile
 *   users/{uid}/workout_logs/{YYYY-MM-DD} → WorkoutLog (exactly one document per day)
 *
 * Exercises are a fixed, curated catalog hardcoded in `data/exercises.ts` (never stored in
 * Firestore, not user-editable), so every logged set maps to precisely defined muscle groups.
 *
 * Timestamps are Firestore `Timestamp`s in the database and epoch milliseconds in the app;
 * the converters in `services/firestoreRepository.ts` translate between the two.
 */

/** Calendar day in the user's local time zone, formatted as `YYYY-MM-DD` (sorts lexicographically). */
export type DateKey = string

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'obliques',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'band', 'other'] as const
export type Equipment = (typeof EQUIPMENT)[number]

export type ExerciseCategory = 'strength' | 'core' | 'cardio' | 'mobility'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

// ─── Exercise catalog (data/exercises.ts) ───────────────────────────────────

export interface Exercise {
  /** Stable slug (e.g. `bicep-curls`). Logs reference it forever, so never rename an existing ID. */
  id: string
  name: string
  /** One-sentence summary shown in lists and cards. */
  description: string
  /** Short, professional explanation of correct execution. */
  instructions: string
  /** Key coaching cues, rendered as a checklist. */
  formCues: string[]
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  category: ExerciseCategory
  equipment: Equipment
  difficulty: Difficulty
  /** Whether the tracker shows a weight field for this exercise. */
  usesWeight: boolean
  /** Pre-filled values when the exercise is added to a day. */
  defaultSets: number
  defaultReps: number
  /** Lower-cased name + aliases, used for client-side search. */
  searchTerms: string[]
}

// ─── users/{uid}/workout_logs/{YYYY-MM-DD} ──────────────────────────────────

export interface WorkoutSet {
  /** Client-generated ID, stable across edits (used as React key and for animations). */
  id: string
  reps: number
  /** `null` for bodyweight sets. */
  weightKg: number | null
}

/**
 * One exercise performed on a given day. Name and muscle data are denormalized
 * so the dashboard can aggregate logs without joining against `exercises`,
 * and history stays intact if a catalog exercise is later renamed.
 */
export interface WorkoutEntry {
  id: string
  exerciseId: string
  exerciseName: string
  primaryMuscle: MuscleGroup
  secondaryMuscles: MuscleGroup[]
  usesWeight: boolean
  sets: WorkoutSet[]
  /** Order in the day's list. */
  position: number
}

export interface WorkoutTotals {
  exercises: number
  sets: number
  reps: number
  /** Sum of reps × weight across all weighted sets. */
  volumeKg: number
}

export interface WorkoutLog {
  /** Equals `date`: deterministic, so a day can be read or written without a query. */
  id: string
  /** Redundant with the path, but enables collection-group queries (e.g. admin stats). */
  userId: string
  date: DateKey
  entries: WorkoutEntry[]
  /** Pre-aggregated on every write, so weekly charts and heatmaps only read these numbers. */
  totals: WorkoutTotals
  /** Reps per muscle group (primary muscle only), feeds the muscle distribution chart. */
  muscleGroupReps: Partial<Record<MuscleGroup, number>>
  note?: string
  createdAt: number
  updatedAt: number
}

// ─── users/{uid} ─────────────────────────────────────────────────────────────
// The account document is the single source of truth for access control: Firebase Auth only
// proves identity, the security rules grant access only while this document says 'active'.

export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'disabled'

export interface UserProfile {
  /** Firebase Auth uid (= document ID). */
  id: string
  /** Login e-mail, copied from Auth when the admin creates the account (informational, immutable). */
  email: string
  displayName: string
  /** Only admins can change roles; nobody can change their own. */
  role: UserRole
  /** 'disabled' locks the user out of all data immediately (enforced by the security rules). */
  status: UserStatus
  /** Target number of training days per week (1–7), shown as goal ring on the dashboard. */
  weeklyGoalDays: number
  createdAt: number
  /** uid of the admin who created the account; `null` for the bootstrap admin created in the console. */
  createdBy: string | null
  updatedAt: number
  lastLoginAt: number | null
}

export const DEFAULT_WEEKLY_GOAL_DAYS = 3

/** What an admin enters to create an account. */
export interface NewUserInput {
  email: string
  displayName: string
  password: string
  role: UserRole
}

/** Fields an admin may change on an existing account. */
export type UserUpdate = Partial<Pick<UserProfile, 'displayName' | 'role' | 'status'>>

// ─── Auth state (client only) ───────────────────────────────────────────────

/** Identity as reported by Firebase Auth, before the account document is checked. */
export interface AuthUser {
  uid: string
  email: string | null
}

export type NoAccessReason = 'missing-profile' | 'disabled'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  /** Signed in, but without an active account document: deleted or disabled by an admin, or never provisioned. */
  | { status: 'no-access'; user: AuthUser; reason: NoAccessReason }
  | { status: 'signed-in'; user: AuthUser; profile: UserProfile; isAdmin: boolean }
