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
    'relative flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-[0.9375rem] leading-snug transition-colors',
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
      <Icon className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
      <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>{item.title}</span>
      {item.status ? (
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none tracking-tight',
            item.status === 'En desarrollo'
              ? 'border border-amber-300 bg-amber-50 text-amber-900'
              : 'border border-border/60 bg-muted/70 text-muted-foreground',
            collapsed && 'sr-only',
          )}
        >
          {item.status}
        </span>
      ) : null}
    </>
  )

  const element = (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        baseClass,
        'group',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-muted',
      )}
    >
      {content}
    </Link>
  )

  if (!collapsed) return element

  return (
    <Tooltip>
      <TooltipTrigger asChild>{element}</TooltipTrigger>
      <TooltipContent side="right">
        {item.title}
        {item.status ? ` · ${item.status}` : ''}
      </TooltipContent>
    </Tooltip>
  )
}
