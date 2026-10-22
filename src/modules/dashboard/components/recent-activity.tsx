import { History } from 'lucide-react'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecentActivity() {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-lg">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={History}
          title="Aún no hay movimientos"
          description="Cuando se registren producciones, compras o ventas, aparecerán aquí."
          className="py-10"
        />
      </CardContent>
    </Card>
  )
}
