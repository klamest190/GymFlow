import { getLocale, LOCALES, useLocale, type Locale } from './locale'
import { admin } from './messages/admin'
import { auth } from './messages/auth'
import { catalog } from './messages/catalog'
import { common } from './messages/common'
import { csv } from './messages/csv'
import { exercises } from './messages/exercises'
import { gamification } from './messages/gamification'
import { guest } from './messages/guest'
import { onboarding } from './messages/onboarding'
import { profile } from './messages/profile'
import { shell } from './messages/shell'
import { stats } from './messages/stats'
import { tracker } from './messages/tracker'

export { getLocale, LOCALES, setLocale, useLocale, type Locale } from './locale'

/** Every text of the app, by area. Each section holds German and English (see `define`). */
const SECTIONS = { common, auth, shell, catalog, tracker, exercises, gamification, stats, profile, guest, onboarding, admin, csv }

type Sections = typeof SECTIONS
export type Messages = { [K in keyof Sections]: Sections[K]['de'] }

const build = (locale: Locale) =>
  Object.fromEntries(Object.entries(SECTIONS).map(([name, section]) => [name, section[locale]])) as Messages

const MESSAGES = Object.fromEntries(LOCALES.map((locale) => [locale, build(locale)])) as Record<Locale, Messages>

/** The texts in the current language, for code outside components (toasts, CSV, lib helpers). */
export const messages = (locale: Locale = getLocale()) => MESSAGES[locale]

/** The texts in the current language; the component re-renders when the language changes. */
export const useT = () => MESSAGES[useLocale()]

/** Title and description of an achievement; `undefined` for an ID no longer in the catalog. */
export const achievementText = (texts: Messages, id: string): { title: string; description: string } | undefined =>
  (texts.gamification.achievements as Record<string, { title: string; description: string }>)[id]

/** Name of a rank as it fits the narrow rank ladder. */
export const ladderRankName = (texts: Messages, id: keyof Messages['gamification']['ranks']) =>
  texts.gamification.ladderRanks[id] ?? texts.gamification.ranks[id]
