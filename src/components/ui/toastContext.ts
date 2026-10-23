import type { LucideIcon } from 'lucide-react'
import { createContext, useContext } from 'react'

/** `reward` celebrates progress (level-up, achievement) with a glow and a light sweep. */
export type ToastTone = 'success' | 'error' | 'info' | 'reward'

export interface Toast {
  id: string
  tone: ToastTone
  title: string
  description?: string
  /** Small caps line above the title, e.g. "Level-Up". */
  eyebrow?: string
  /** Replaces the tone's default icon. */
  icon?: LucideIcon
}

export type ShowToast = (toast: Omit<Toast, 'id'>) => void

export const ToastContext = createContext<ShowToast | null>(null)

export function useToast(): ShowToast {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
