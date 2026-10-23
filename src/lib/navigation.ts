import { LayoutDashboard, type LucideIcon } from 'lucide-react'
import {
  getModuleBySlug,
  MODULE_AREAS,
  MODULES,
  type ModuleStatus,
} from './modules'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  status?: ModuleStatus
  enabled: boolean
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

/**
 * Genera los grupos de navegación de la barra lateral organizados por áreas:
 * Inicio + Base del sistema, Operación, Finanzas y legal, Análisis.
 * Todos los 10 módulos son navegables.
 */
export function getNavigation(): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: 'Inicio',
      items: [
        {
          title: 'Panel principal',
          href: '/dashboard',
          icon: LayoutDashboard,
          enabled: true,
        },
      ],
    },
  ]

  for (const area of MODULE_AREAS) {
    const modulesInArea = MODULES.filter((m) => m.area === area)
    if (modulesInArea.length > 0) {
      groups.push({
        title: area,
        items: modulesInArea.map((m) => ({
          title: m.name,
          href: `/dashboard/${m.slug}`,
          icon: m.icon,
          status: m.status,
          enabled: true,
        })),
      })
    }
  }

  return groups
}

export const navigation = getNavigation()

export type Breadcrumb = { title: string; href?: string }

/**
 * Calcula las migas de pan según la ruta activa.
 */
export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === '/dashboard') {
    return [{ title: 'Inicio' }]
  }

  if (pathname.startsWith('/dashboard/')) {
    const slug = pathname.replace('/dashboard/', '').split('/')[0]
    const currentModule = getModuleBySlug(slug)

    if (currentModule) {
      return [
        { title: 'Inicio', href: '/dashboard' },
        { title: currentModule.name },
      ]
    }

    return [
      { title: 'Inicio', href: '/dashboard' },
      { title: 'Módulo no encontrado' },
    ]
  }

  return [{ title: 'Inicio', href: '/dashboard' }]
}

/**
 * Determina si un enlace de navegación está activo en la URL actual.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
