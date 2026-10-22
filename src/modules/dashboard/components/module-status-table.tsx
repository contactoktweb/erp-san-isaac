import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { navigation } from '@/lib/navigation'

export function ModuleStatusTable() {
  const rows = navigation.map((group) => {
    const available = group.items.filter((item) => item.enabled).length
    return { title: group.title, total: group.items.length, available }
  })

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="gap-1 px-6 py-5">
        <CardTitle className="text-lg">Estado de los módulos</CardTitle>
        <CardDescription className="text-[0.9375rem]">
          Funciones previstas por área y su disponibilidad actual.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <table>
          <thead>
            <tr>
              <th scope="col">Módulo</th>
              <th scope="col" className="text-right">Funciones</th>
              <th scope="col" className="text-right">Disponibles</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.title}>
                <th scope="row" className="px-4 py-3 font-medium">{row.title}</th>
                <td className="text-right">{row.total}</td>
                <td className="text-right">{row.available}</td>
                <td>
                  {row.available === row.total ? (
                    <Badge variant="success">Disponible</Badge>
                  ) : row.available > 0 ? (
                    <Badge variant="info">Parcial</Badge>
                  ) : (
                    <Badge variant="muted">En construcción</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
