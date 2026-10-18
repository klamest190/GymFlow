import { createContext, useContext } from 'react'

export type SessionState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string }
  | { status: 'error'; message: string }

export const SessionContext = createContext<string | null>(null)

export function useUserId(): string {
  const userId = useContext(SessionContext)
  if (!userId) throw new Error('useUserId must be used inside <SessionProvider>')
  return userId
}
