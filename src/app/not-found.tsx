import { Compass } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/feedback/empty-state'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La dirección no existe o el módulo aún no está disponible."
        action={
          <Button asChild>
            <Link href="/dashboard">Volver al panel principal</Link>
          </Button>
        }
        className="w-full max-w-lg bg-card"
      />
    </main>
  )
}
