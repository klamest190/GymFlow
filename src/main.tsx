import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/ui/ToastProvider'
import { initPwa } from './lib/pwa'

initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Framer Motion ignores the CSS media query; this honors "reduce motion" for JS animations too. */}
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
)
