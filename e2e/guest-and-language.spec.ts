import { expect, test } from '@playwright/test'
import { EMPTY_DAY, openApp, skipTour } from './helpers.ts'

test('a guest can train with the free exercises, the rest stays locked', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Als Gast ausprobieren' }).click()
  await skipTour(page)

  // The picker offers the free exercises and locks the others.
  await page.getByRole('button', { name: EMPTY_DAY }).click()
  const picker = page.getByRole('dialog', { name: 'Übung hinzufügen' })
  await expect(picker.getByRole('button', { name: 'Bizeps Curls hinzufügen' })).toBeVisible()
  await expect(picker.getByRole('button', { name: 'Thrusters ist gesperrt' })).toBeVisible()
  await picker.getByRole('button', { name: 'Bizeps Curls hinzufügen' }).click()
  await picker.getByRole('button', { name: 'Fertig' }).click()
  await page.getByRole('button', { name: 'Satz 1 abhaken' }).click()
  await expect(page.getByRole('button', { name: /^Satz 1 bearbeiten/ })).toBeVisible()

  // Statistics explain what an account unlocks.
  await page.getByRole('navigation').getByRole('button', { name: /Statistik/ }).click()
  await expect(page.getByText('Dein Fortschritt auf einen Blick')).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Admin' })).toBeHidden()

  // A guest session survives a reload, like a signed-in one.
  await page.reload()
  await page.getByRole('navigation').getByRole('button', { name: 'Heute' }).click()
  await expect(page.getByRole('button', { name: /^Satz 1 bearbeiten/ })).toBeVisible()
})

test('the language switches on the login and stays after a reload', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Switch to English' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByLabel('Username or e-mail').fill('karsten')
  await page.getByLabel('Password', { exact: true }).fill('secret')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await skipTour(page, 'Skip')
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Exercises' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today', level: 1 })).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /track workouts/)
})
