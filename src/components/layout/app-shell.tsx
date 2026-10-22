'use client'

import { useState, type ReactNode } from 'react'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main id="contenido" tabIndex={-1} className="flex-1 px-4 py-8 outline-none sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
