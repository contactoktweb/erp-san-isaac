import type { Metadata } from 'next'
import { ModuleIndex } from '@/modules/dashboard/components/module-index'
import { WelcomeHeader } from '@/modules/dashboard/components/welcome-header'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Panel principal',
  description: 'Índice de módulos operacionales y administrativos de Velas, Velones y Cirios San Isaac SAS.',
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-10">
      <WelcomeHeader />
      <ModuleIndex />
    </div>
  )
}
