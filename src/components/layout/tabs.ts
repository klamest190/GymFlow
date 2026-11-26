import { DumbbellIcon, PlateIcon, PlateStackIcon, ProfileIcon, ShieldIcon, type TabIcon } from '../icons/TabIcons'

export type TabId = 'today' | 'exercises' | 'stats' | 'profile' | 'admin'

/** The tab's label is `messages().shell.tabs[id]`. */
interface Tab {
  id: TabId
  icon: TabIcon
  /** Only shown to admins (the security rules guard the data regardless). */
  adminOnly?: boolean
}

const TABS: Tab[] = [
  { id: 'today', icon: PlateIcon },
  { id: 'exercises', icon: DumbbellIcon },
  { id: 'stats', icon: PlateStackIcon },
  { id: 'admin', icon: ShieldIcon, adminOnly: true },
  { id: 'profile', icon: ProfileIcon },
]

export const tabsFor = (isAdmin: boolean) => TABS.filter((tab) => isAdmin || !tab.adminOnly)
