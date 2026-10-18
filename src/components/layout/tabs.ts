import { ChartNoAxesColumn, CircleUser, Dumbbell, House, type LucideIcon } from 'lucide-react'

export type TabId = 'today' | 'exercises' | 'stats' | 'profile'

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Heute', icon: House },
  { id: 'exercises', label: 'Übungen', icon: Dumbbell },
  { id: 'stats', label: 'Statistik', icon: ChartNoAxesColumn },
  { id: 'profile', label: 'Profil', icon: CircleUser },
]
