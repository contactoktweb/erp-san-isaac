import type { Metadata } from 'next'
import { getModuleBySlug, getModules } from '@/lib/modules'
import { ModuleDataTable } from '@/modules/modules-view/components/module-data-table'
import { ModuleFunctions } from '@/modules/modules-view/components/module-functions'
import { ModuleHeader } from '@/modules/modules-view/components/module-header'
import { ModuleNotFound } from '@/modules/modules-view/components/module-not-found'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const currentModule = getModuleBySlug(slug)

  if (!currentModule) {
    return {
      title: 'Módulo no encontrado',
    }
  }

  return {
    title: currentModule.name,
    description: currentModule.shortDescription,
  }
}

export async function generateStaticParams() {
  return getModules().map((m) => ({
    slug: m.slug,
  }))
}

export default async function ModulePage({ params }: PageProps) {
  const { slug } = await params
  const currentModule = getModuleBySlug(slug)

  if (!currentModule) {
    return <ModuleNotFound slug={slug} />
  }

  return (
    <div className="flex flex-col gap-10">
      <ModuleHeader module={currentModule} />
      <ModuleDataTable slug={currentModule.slug} entityName={currentModule.entityName} />
      <ModuleFunctions functions={currentModule.functions} />
    </div>
  )
}
