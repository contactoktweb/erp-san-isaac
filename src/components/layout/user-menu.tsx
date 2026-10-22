'use client'

import { Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { demoUser, getInitials } from '@/lib/site-config'
import { signOutUser } from '@/modules/auth/lib/sign-out'

export function UserMenu() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const initials = getInitials(demoUser.name)

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOutUser()
    router.replace('/login')
  }

  const avatar = (
    <Avatar className="size-9">
      <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <>
      <div className="hidden items-center gap-4 md:flex">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="flex flex-col leading-tight">
            <span className="text-[0.9375rem] font-semibold">{demoUser.name}</span>
            <span className="text-sm text-muted-foreground">{demoUser.role}</span>
          </div>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          Cerrar sesión
        </Button>
      </div>

      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`Cuenta de ${demoUser.name}`}>
              {avatar}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
              <span className="font-semibold">{demoUser.name}</span>
              <span className="text-sm text-muted-foreground">{demoUser.role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut}>
              <LogOut aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
