import { DumbbellIcon, PlateIcon, PlateStackIcon, ProfileIcon, ShieldIcon, type TabIcon } from '../icons/TabIcons'

export type TabId = 'today' | 'exercises' | 'stats' | 'profile' | 'admin'

interface Tab {
  id: TabId
  label: string
  icon: TabIcon
  /** Only shown to admins (the security rules guard the data regardless). */
  adminOnly?: boolean
}

const TABS: Tab[] = [
  { id: 'today', label: 'Heute', icon: PlateIcon },
  { id: 'exercises', label: 'Übungen', icon: DumbbellIcon },
  { id: 'stats', label: 'Statistik', icon: PlateStackIcon },
  { id: 'admin', label: 'Admin', icon: ShieldIcon, adminOnly: true },
  { id: 'profile', label: 'Profil', icon: ProfileIcon },
]

export const tabsFor = (isAdmin: boolean) => TABS.filter((tab) => isAdmin || !tab.adminOnly)
