'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNav } from './sidebar-nav'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[18rem] max-w-[85vw] flex-col gap-0 bg-sidebar p-0">
        <SheetHeader className="h-16 justify-center border-b border-sidebar-border px-4 py-0">
          <SheetTitle className="sr-only">Menú principal</SheetTitle>
          <SheetDescription className="sr-only">Navega entre los módulos del ERP</SheetDescription>
          <SidebarBrand />
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
