import { expect, test } from '@playwright/test'
import { addExercises, EMPTY_DAY, exerciseCard, openApp, signIn, skipTour } from './helpers.ts'

// The core flow on the phone: sign in, take the tour, log sets, rest, and find everything again.
test('a whole training: sign in, log sets, rest, reload, statistics', async ({ page }) => {
  await openApp(page)
  await expect(page.getByText(/^Demo-Modus/)).toBeVisible()
  await signIn(page)

  // First start: the tour, with the weekly goal on its last step.
  await expect(page.getByRole('dialog', { name: 'Willkommen, karsten!' })).toBeVisible()
  for (let step = 0; step < 4; step++) await page.getByRole('dialog').getByRole('button', { name: 'Weiter' }).click()
  const goalStep = page.getByRole('dialog', { name: 'Dein Wochenziel' })
  await goalStep.getByRole('radio', { name: '4' }).check()
  await goalStep.getByRole('button', { name: 'Los geht’s' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()

  // An empty day is one invitation to add the first exercise.
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible()
  await addExercises(page, EMPTY_DAY, ['Bizeps Curls'])

  // A new exercise comes with set 1 open, started from the dumbbell weight in the profile.
  const curls = exerciseCard(page, 'Bizeps Curls')
  await expect(curls.getByRole('textbox', { name: 'Wiederholungen Satz 1' })).toHaveValue('10')
  await expect(curls.getByRole('textbox', { name: 'Gewicht je Hantel Satz 1' })).toHaveValue('5')
  await curls.getByRole('button', { name: 'Wiederholungen Satz 1 erhöhen' }).click()
  await curls.getByRole('button', { name: 'Gewicht je Hantel Satz 1 erhöhen' }).click()
  await curls.getByRole('button', { name: 'Satz 1 abhaken' }).click()
  await expect(curls.getByRole('button', { name: 'Satz 1 bearbeiten: 11 Wiederholungen, 6 kg' })).toBeVisible()

  // Logging a set starts the rest, shown above the tab bar; it can be stretched and ended early.
  const rest = page.getByRole('region', { name: 'Satzpause' })
  await expect(rest).toContainText('Pause nach Satz 1, Bizeps Curls')
  // The default rest is 90 seconds; the ranges leave room for a slow machine.
  await expect(rest.getByRole('timer', { name: 'Verbleibende Pause' })).toHaveText(/^1:(1\d|2\d|30)$/)
  await rest.getByRole('button', { name: '15 Sekunden mehr' }).click()
  await expect(rest.getByRole('timer')).toHaveText(/^1:(3[1-9]|4[0-5])$/)
  await rest.getByRole('button', { name: 'Pause beenden' }).click()
  await expect(rest).toBeHidden()

  // The next set starts with the values of the one before.
  await curls.getByRole('button', { name: 'Satz hinzufügen' }).click()
  await expect(curls.getByRole('textbox', { name: 'Wiederholungen Satz 2' })).toHaveValue('11')
  await expect(curls.getByRole('textbox', { name: 'Gewicht je Hantel Satz 2' })).toHaveValue('6')
  await curls.getByRole('button', { name: 'Wiederholungen Satz 2 verringern' }).click()
  await curls.getByRole('button', { name: 'Satz 2 abhaken' }).click()
  await expect(curls.getByRole('button', { name: 'Satz 2 bearbeiten: 10 Wiederholungen, 6 kg' })).toBeVisible()
  await expect(rest).toContainText('Pause nach Satz 2, Bizeps Curls')

  // The rest follows to other tabs.
  await page.getByRole('navigation').getByRole('button', { name: 'Übungen' }).click()
  await expect(rest).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'Heute' }).click()

  // The day summary adds both sets up: 21 reps, 21 × 6 kg × two dumbbells.
  const summary = page.getByRole('region', { name: 'Tagesübersicht' })
  await expect(summary).toContainText('Sätze2')
  await expect(summary).toContainText('Wiederholungen21')
  await expect(summary).toContainText('kg Volumen252')
  await expect(page.getByRole('button', { name: /heute, Training eingetragen/ })).toBeVisible()

  // Everything is still there after a reload, and the tour doesn't come back.
  await page.reload()
  await expect(curls.getByRole('button', { name: 'Satz 1 bearbeiten: 11 Wiederholungen, 6 kg' })).toBeVisible()
  await expect(curls.getByRole('button', { name: 'Satz 2 bearbeiten: 10 Wiederholungen, 6 kg' })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()

  // The statistics count the day against the weekly goal from the tour.
  await page.getByRole('navigation').getByRole('button', { name: 'Statistik' }).click()
  await expect(page.getByRole('heading', { name: 'Statistik', level: 1 })).toBeVisible()
  const stats = page.getByRole('main')
  await expect(stats).toContainText(/Diese Woche\s*1\s*\/\s*4\s*Trainingstage/)
  await expect(stats).toContainText(/Bestleistungen.*Bizeps Curls\s*Heute\s*6 kg/)
})


test('a rest counts on into overtime once it is over', async ({ page }) => {
  // A fake clock to jump to the end of the rest. The jump has to be the last step: the browser's
  // animation timeline (Web Animations, used by Framer Motion) doesn't jump along, so animations
  // started afterwards would wait out the jumped time. On a real phone both clocks run together.
  await page.clock.install()
  await openApp(page)
  await signIn(page)
  await skipTour(page)
  await addExercises(page, EMPTY_DAY, ['Bizeps Curls'])
  await exerciseCard(page, 'Bizeps Curls').getByRole('button', { name: 'Satz 1 abhaken' }).click()
  const rest = page.getByRole('region', { name: 'Satzpause' })
  await expect(rest.getByRole('timer', { name: 'Verbleibende Pause' })).toBeVisible()

  await page.clock.fastForward('01:32') // the default rest is 90 seconds
  await expect(rest.getByRole('timer', { name: 'Pause vorbei' })).toHaveText(/^\+0:0\d$/)
  await expect(rest).toContainText('Weiter geht’s')
})

test('a set logged for an earlier day: no rest, and the next training starts from it', async ({ page }) => {
  await openApp(page)
  await signIn(page)
  await skipTour(page)

  // A day of last week, logged afterwards.
  const week = page.getByRole('region', { name: 'Woche auswählen' })
  await week.getByRole('button', { name: 'Vorherige Woche' }).click()
  await week.getByRole('button', { name: /^\d+\. \S+ \d{4}$/ }).first().click()
  await addExercises(page, /An diesem Tag ist nichts eingetragen/, ['Bizeps Curls'])
  const curls = exerciseCard(page, 'Bizeps Curls')
  await curls.getByRole('button', { name: 'Gewicht je Hantel Satz 1 erhöhen' }).click()
  await curls.getByRole('button', { name: 'Satz 1 abhaken' }).click()
  await expect(curls.getByRole('button', { name: 'Satz 1 bearbeiten: 10 Wiederholungen, 6 kg' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Satzpause' })).toBeHidden()

  // Today the exercise remembers that training and starts from its values.
  await week.getByRole('button', { name: 'Nächste Woche' }).click()
  await week.getByRole('button', { name: /, heute/ }).click()
  await expect(curls).toBeHidden()
  await addExercises(page, EMPTY_DAY, ['Bizeps Curls'])
  await expect(curls).toContainText('Letztes Mal: 10 Wdh. mit 6 kg')
  await expect(curls.getByRole('textbox', { name: 'Gewicht je Hantel Satz 1' })).toHaveValue('6')
})
