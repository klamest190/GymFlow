import { LazyMotion, MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/ui/ToastProvider'
import { initPwa } from './lib/pwa'

initPwa()

// The animation engine is its own chunk: the app renders immediately with the small `m`
// components, and animations switch on once the features have arrived (a few ms later).
const loadMotionFeatures = () => import('./lib/motionFeatures').then((module) => module.default)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* `strict`: a full `motion.*` component would silently pull the whole engine back in. */}
    <LazyMotion features={loadMotionFeatures} strict>
      {/* Framer Motion ignores the CSS media query; this honors "reduce motion" for JS animations too. */}
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
