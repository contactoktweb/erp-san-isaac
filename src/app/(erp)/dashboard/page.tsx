import type { Metadata } from 'next'
import { ModuleStatusTable } from '@/modules/dashboard/components/module-status-table'
import { RecentActivity } from '@/modules/dashboard/components/recent-activity'
import { WelcomeHeader } from '@/modules/dashboard/components/welcome-header'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Panel principal',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <WelcomeHeader />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ModuleStatusTable />
        <RecentActivity />
      </div>
    </div>
  )
}
