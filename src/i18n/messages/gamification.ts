import type { AchievementUnit, KnownAchievementId } from '../../data/achievements'
import type { RankId } from '../../types/models'
import { define } from '../define'

type AchievementTexts = Record<KnownAchievementId, { title: string; description: string }>

export const gamification = define(
  {
    ranks: {
      iron: 'Eisen',
      bronze: 'Bronze',
      silver: 'Silber',
      gold: 'Gold',
      platinum: 'Platin',
      diamond: 'Diamant',
      grandmaster: 'Grandmaster',
    } satisfies Record<RankId, string> as Record<RankId, string>,
    /** With a soft hyphen where a long name may break in the narrow rank ladder on phones. */
    ladderRanks: { grandmaster: 'Grand­master' } as Partial<Record<RankId, string>>,
    achievements: {
      'first-workout': { title: 'Erster Schritt', description: 'Dein erstes Workout geloggt' },
      'iron-will': { title: 'Eisenwille', description: '3 Tage in Folge trainiert' },
      'night-owl': { title: 'Nachteule', description: 'Workout nach 22:00 Uhr geloggt' },
      'volume-monster': { title: 'Volumen-Monster', description: 'Insgesamt 10.000 kg bewegt' },
      'consistency-king': { title: 'Konsistenz-König', description: '10 Workouts in einem Monat' },
      unstoppable: { title: 'Unaufhaltsam', description: '7 Tage in Folge trainiert' },
      'set-collector': { title: 'Satz-Sammler', description: '500 Sätze geloggt' },
      centurion: { title: 'Centurion', description: '100 Workouts abgeschlossen' },
    } satisfies AchievementTexts as AchievementTexts,
    units: { days: 'Tage', kg: 'kg', workouts: 'Workouts', sets: 'Sätze' } satisfies Record<AchievementUnit, string> as Record<
      AchievementUnit,
      string
    >,

    // Toasts
    achievementUnlocked: 'Erfolg freigeschaltet',
    newRank: 'Neuer Rang',
    welcomeToRank: (rank: string) => `Willkommen in ${rank}!`,
    rankReached: (level: number, rank: string) => `Level ${level} erreicht. Ab jetzt trainierst du in der ${rank}-Liga.`,
    levelUp: 'Level-Up',
    levelReached: (level: number) => `Level ${level} erreicht!`,
    xpToNext: (xp: string, level: number) => `Noch ${xp} XP bis Level ${level}.`,
    newRecord: 'Neue Bestleistung',
    recordBefore: (value: string) => `Vorher ${value}. Stark!`,

    // Badges
    noData: 'Noch keine Trainingsdaten synchronisiert',
    rankAndLevel: (rank: string, level: number) => `${rank} · Level ${level}`,
    levelShort: (level: number) => `Lv ${level}`,

    // Dashboard
    levelAndRank: 'Level und Rang',
    totalXP: ' XP gesamt',
    pendingXP: ' von heute, gutgeschrieben morgen',
    xpToLevel: (required: string, level: number) => ` / ${required} XP bis Level ${level}`,
    levelsToRank: (levels: number, rank: string) => `Noch ${levels} Level bis ${rank}`,
    topRank: 'Höchster Rang erreicht. Respekt!',
    sourceSets: 'Sätze',
    sourceWeight: 'Gewicht',
    sourceWorkouts: 'Workouts',
    sourceStreaks: 'Streaks',
    perSet: (xp: number) => `+${xp} je Satz`,
    perVolume: (kg: number, max: number) => `+1 je ${kg} kg bewegt, max. ${max} je Satz`,
    perWorkout: (xp: number) => `+${xp} je Workout`,
    perStreak: (xp: number, days: number) => `+${xp} je ${days} Tage am Stück`,
    progressToLevel: (level: number) => `Fortschritt zu Level ${level}`,
    ranksLabel: 'Ränge',
    rankFrom: (rank: string, level: number) => `${rank} ab Level ${level}`,
    achievementsTitle: 'Erfolge',
    achievementsText: 'Meilensteine, die du einmal freischaltest und für immer behältst.',
    stillLocked: 'Noch gesperrt',
    loading: 'Level wird geladen',
  },
  {
    ranks: {
      iron: 'Iron',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
      diamond: 'Diamond',
      grandmaster: 'Grandmaster',
    },
    ladderRanks: { grandmaster: 'Grand­master', platinum: 'Plati­num' },
    achievements: {
      'first-workout': { title: 'First Step', description: 'Logged your first workout' },
      'iron-will': { title: 'Iron Will', description: 'Trained 3 days in a row' },
      'night-owl': { title: 'Night Owl', description: 'Logged a workout after 10 pm' },
      'volume-monster': { title: 'Volume Monster', description: 'Moved 10,000 kg in total' },
      'consistency-king': { title: 'Consistency King', description: '10 workouts in one month' },
      unstoppable: { title: 'Unstoppable', description: 'Trained 7 days in a row' },
      'set-collector': { title: 'Set Collector', description: 'Logged 500 sets' },
      centurion: { title: 'Centurion', description: 'Finished 100 workouts' },
    },
    units: { days: 'days', kg: 'kg', workouts: 'workouts', sets: 'sets' },

    achievementUnlocked: 'Achievement unlocked',
    newRank: 'New rank',
    welcomeToRank: (rank: string) => `Welcome to ${rank}!`,
    rankReached: (level: number, rank: string) => `Level ${level} reached. From now on you train in the ${rank} league.`,
    levelUp: 'Level up',
    levelReached: (level: number) => `Level ${level} reached!`,
    xpToNext: (xp: string, level: number) => `${xp} XP to go until level ${level}.`,
    newRecord: 'New personal best',
    recordBefore: (value: string) => `Before: ${value}. Strong!`,

    noData: 'No training data synced yet',
    rankAndLevel: (rank: string, level: number) => `${rank} · Level ${level}`,
    levelShort: (level: number) => `Lv ${level}`,

    levelAndRank: 'Level and rank',
    totalXP: ' XP in total',
    pendingXP: ' from today, credited tomorrow',
    xpToLevel: (required: string, level: number) => ` / ${required} XP to level ${level}`,
    levelsToRank: (levels: number, rank: string) => `${levels} ${levels === 1 ? 'level' : 'levels'} to go until ${rank}`,
    topRank: 'Highest rank reached. Respect!',
    sourceSets: 'Sets',
    sourceWeight: 'Weight',
    sourceWorkouts: 'Workouts',
    sourceStreaks: 'Streaks',
    perSet: (xp: number) => `+${xp} per set`,
    perVolume: (kg: number, max: number) => `+1 per ${kg} kg moved, max. ${max} per set`,
    perWorkout: (xp: number) => `+${xp} per workout`,
    perStreak: (xp: number, days: number) => `+${xp} per ${days} days in a row`,
    progressToLevel: (level: number) => `Progress to level ${level}`,
    ranksLabel: 'Ranks',
    rankFrom: (rank: string, level: number) => `${rank} from level ${level}`,
    achievementsTitle: 'Achievements',
    achievementsText: 'Milestones you unlock once and keep forever.',
    stillLocked: 'Still locked',
    loading: 'Loading level',
  },
)
