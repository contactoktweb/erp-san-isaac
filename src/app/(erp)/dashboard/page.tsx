import type { Metadata } from 'next'
import { getModuleBySlug } from '@/lib/modules'
import { ForbiddenBanner } from '@/modules/dashboard/components/forbidden-banner'
import { ModuleIndex } from '@/modules/dashboard/components/module-index'
import { WelcomeHeader } from '@/modules/dashboard/components/welcome-header'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Panel principal',
  description: 'Índice de módulos operacionales y administrativos de Velas, Velones y Cirios San Isaac SAS.',
}

type DashboardPageProps = {
  searchParams?: Promise<{ forbidden?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : {}
  const forbiddenSlug = params.forbidden
  const moduleName = forbiddenSlug ? getModuleBySlug(forbiddenSlug)?.name || forbiddenSlug : null

  return (
    <div className="flex flex-col gap-10">
      {moduleName && <ForbiddenBanner moduleName={moduleName} />}
      <WelcomeHeader />
      <ModuleIndex />
    </div>
  )
}
