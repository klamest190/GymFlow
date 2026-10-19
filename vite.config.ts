import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
          ],
        },
      },
    },
  },
})
