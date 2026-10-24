import { m } from 'framer-motion'
import { LogOut, ShieldOff, UserX } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../auth/authContext'
import type { NoAccessReason } from '../../types/models'

const COPY: Record<NoAccessReason, { title: string; text: string; icon: typeof ShieldOff }> = {
  disabled: {
    title: 'Zugang gesperrt',
    text: 'Dein Konto wurde vom Admin deaktiviert. Wende dich an ihn, wenn du wieder trainieren möchtest.',
    icon: ShieldOff,
  },
  'missing-profile': {
    title: 'Kein Zugang',
    text: 'Für diesen Login gibt es kein aktives GymFlow-Konto. Zugänge werden ausschließlich vom Admin vergeben.',
    icon: UserX,
  },
}

export function NoAccessScreen({ email, reason }: { email: string | null; reason: NoAccessReason }) {
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const { title, text, icon: Icon } = COPY[reason]

  return (
    <div className="grid min-h-dvh place-items-center p-4">
      <m.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass w-full max-w-[420px] rounded-4xl p-8 text-center shadow-float"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-danger/12 text-danger">
          <Icon className="size-7" />
        </span>
        <h1 className="mt-5 text-[24px] font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{text}</p>
        {email && <p className="mt-4 rounded-2xl bg-sunken px-4 py-2.5 text-[14px] font-medium">{email}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void signOut()
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-fg py-3.5 text-[15px] font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
        >
          <LogOut className="size-4.5" />
          Abmelden
        </button>
      </m.div>
    </div>
  )
}
