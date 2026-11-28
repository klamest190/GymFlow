import { expect, type Page } from '@playwright/test'

/** Opens the login of the demo mode, where the first login becomes the admin. */
export async function openApp(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
}

/** Signs in to the demo mode; passwords aren't checked there. */
export async function signIn(page: Page, login = 'karsten') {
  await page.getByLabel('Benutzername oder E-Mail').fill(login)
  await page.getByLabel('Passwort', { exact: true }).fill('geheim')
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click()
}

/** Closes the first-run tour without going through it. */
export async function skipTour(page: Page, skip = 'Überspringen') {
  const tour = page.getByRole('dialog')
  await tour.getByRole('button', { name: skip }).click()
  await expect(tour).toBeHidden()
}

/** Adds exercises through the picker (the empty-day card, `EMPTY_DAY`, or "Übung hinzufügen" otherwise). */
export async function addExercises(page: Page, opener: string | RegExp, names: string[]) {
  await page.getByRole('main').getByRole('button', { name: opener, exact: typeof opener === 'string' }).click()
  const picker = page.getByRole('dialog', { name: 'Übung hinzufügen' })
  for (const name of names) await picker.getByRole('button', { name: `${name} hinzufügen` }).click()
  await picker.getByRole('button', { name: 'Fertig' }).click()
  await expect(picker).toBeHidden()
}

/** An empty day is one big button: "Bereit fürs Training? Füge deine erste Übung hinzu." */
export const EMPTY_DAY = /Füge deine erste Übung hinzu/

export const exerciseCard = (page: Page, name: string) =>
  page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) })
