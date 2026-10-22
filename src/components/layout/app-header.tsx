import { Breadcrumbs } from './breadcrumbs'
import { MobileNav } from './mobile-nav'
import { UserMenu } from './user-menu'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6 lg:px-8">
      <MobileNav />
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <UserMenu />
    </header>
  )
}
