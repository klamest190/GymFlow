import { ChartNoAxesColumn, CircleUser, Dumbbell, House, ShieldCheck, type LucideIcon } from 'lucide-react'

export type TabId = 'today' | 'exercises' | 'stats' | 'profile' | 'admin'

interface Tab {
  id: TabId
  label: string
  icon: LucideIcon
  /** Only shown to admins (the security rules guard the data regardless). */
  adminOnly?: boolean
}

const TABS: Tab[] = [
  { id: 'today', label: 'Heute', icon: House },
  { id: 'exercises', label: 'Übungen', icon: Dumbbell },
  { id: 'stats', label: 'Statistik', icon: ChartNoAxesColumn },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
  { id: 'profile', label: 'Profil', icon: CircleUser },
]

export const tabsFor = (isAdmin: boolean) => TABS.filter((tab) => isAdmin || !tab.adminOnly)
