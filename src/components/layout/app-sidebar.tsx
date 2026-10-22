'use client'

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNav } from './sidebar-nav'

type AppSidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const label = collapsed ? 'Expandir menú' : 'Contraer menú'
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      aria-label="Menú lateral"
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        <SidebarBrand collapsed={collapsed} />
      </div>

      <div className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={onToggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? label : undefined}
              className={cn('text-muted-foreground hover:bg-muted hover:text-foreground', !collapsed && 'w-full justify-start')}
            >
              <ToggleIcon aria-hidden="true" />
              {collapsed ? null : <span>{label}</span>}
            </Button>
          </TooltipTrigger>
          {collapsed ? <TooltipContent side="right">{label}</TooltipContent> : null}
        </Tooltip>
      </div>
    </aside>
  )
}
