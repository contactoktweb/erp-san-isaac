import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { siteConfig } from '@/lib/site-config'
import { cn } from '@/lib/utils'

export function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn('flex items-center gap-3 rounded-md', collapsed && 'justify-center')}
    >
      <Logo size={40} priority decorative={!collapsed} />
      <span className={cn('flex flex-col leading-tight', collapsed && 'sr-only')}>
        <span className="text-base font-semibold text-primary">{siteConfig.shortName}</span>
        <span className="text-xs text-muted-foreground">Velas, velones y cirios</span>
      </span>
    </Link>
  )
}
