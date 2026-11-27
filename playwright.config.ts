import { defineConfig, devices } from '@playwright/test'

const PORT = 4174

/**
 * End-to-end tests of the real app in a browser (`npm run test:e2e`). They run against a production
 * build in demo mode: emptying the Firebase keys here takes precedence over `.env.local`, so the
 * tests never reach the live Firestore and need no secrets, locally or in CI.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // A phone in German, the way GymFlow is used in training; the tests pick other languages themselves.
    ...devices['Pixel 7'],
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'phone', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_APP_ID: '', VITE_FIREBASE_MEASUREMENT_ID: '' },
  },
})
