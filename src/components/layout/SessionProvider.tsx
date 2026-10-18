import { useEffect, useState, type ReactNode } from 'react'
import { SessionContext, type SessionState } from '../../hooks/useSession'
import { repository } from '../../services/repository'

/** Signs the user in (anonymously in Firebase mode) and renders `fallback` until a uid is available. */
export function SessionProvider({ children, fallback }: { children: ReactNode; fallback: (state: SessionState) => ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' })

  useEffect(() => {
    let active = true
    repository
      .signIn()
      .then((userId) => active && setState({ status: 'ready', userId }))
      .catch((error: Error) => active && setState({ status: 'error', message: error.message }))
    return () => {
      active = false
    }
  }, [])

  if (state.status !== 'ready') return fallback(state)
  return <SessionContext.Provider value={state.userId}>{children}</SessionContext.Provider>
}
