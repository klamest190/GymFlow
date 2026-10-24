/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Unit tests only; tests/ holds the security rules tests, which need the emulator (npm run test:rules).
    include: ['src/**/*.test.{ts,tsx}'],
    // Fixed time zone, so date logic behaves the same locally and in CI (with DST changes).
    env: { TZ: 'Europe/Berlin' },
  },
  build: {
    // The Firestore SDK alone is ~565 kB (offline cache + realtime listeners) and can't be split
    // further; keep the warning for anything larger than that.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Large, rarely changing libraries get their own long-cacheable chunks, so an app update
        // doesn't force users to re-download Firebase. Recharts stays in the lazy stats chunk.
        codeSplitting: {
          groups: [
            { name: 'firestore', test: /node_modules[\\/]@firebase[\\/](firestore|webchannel-wrapper)[\\/]/, priority: 2 },
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth[\\/]/, priority: 2 },
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 1 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            // No group for framer-motion: its animation features are loaded lazily (LazyMotion in
            // main.tsx) and must stay in their own chunk instead of joining the startup bundle.
          ],
        },
      },
    },
  },
})
