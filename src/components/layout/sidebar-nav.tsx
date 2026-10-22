'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isNavItemActive, navigation, type NavItem } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type SidebarNavProps = {
  collapsed?: boolean
  onNavigate?: () => void
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-6">
      {navigation.map((group) => {
        const headingId = `nav-${group.title.toLowerCase().replace(/\s+/g, '-')}`
        return (
          <section key={group.title} aria-labelledby={headingId} className="flex flex-col gap-1">
            <h2
              id={headingId}
              className={cn('eyebrow px-3 pb-1', collapsed && 'sr-only')}
            >
              {group.title}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarNavItem
                    item={item}
                    active={isNavItemActive(pathname, item.href)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}

type SidebarNavItemProps = {
  item: NavItem
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}

function SidebarNavItem({ item, active, collapsed, onNavigate }: SidebarNavItemProps) {
  const Icon = item.icon
  const baseClass = cn(
    'relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-[0.9375rem] leading-snug',
    collapsed && 'justify-center px-0',
  )

  const content = (
    <>
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-gold"
        />
      ) : null}
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>{item.title}</span>
      {!item.enabled ? (
        <span className={cn('text-xs text-muted-foreground', collapsed && 'sr-only')}>
          {collapsed ? '(próximamente)' : 'Pronto'}
        </span>
      ) : null}
    </>
  )

  const element = item.enabled ? (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        baseClass,
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-muted',
      )}
    >
      {content}
    </Link>
  ) : (
    <span
      aria-disabled="true"
      className={cn(baseClass, 'cursor-not-allowed text-muted-foreground')}
    >
      {content}
    </span>
  )

  if (!collapsed) return element

  return (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent side="right">
        {item.title}
        {!item.enabled ? ' · Próximamente' : ''}
      </TooltipContent>
    </Tooltip>
  )
}
