import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint para monitoreo y verificación de estado.
 * Ejecuta una consulta básica a la base de datos PostgreSQL.
 * Devuelve 200 con { status: "ok" } si la base de datos está accesible.
 * Devuelve 503 con { status: "error" } si falla la conexión, protegiendo la
 * infraestructura al no exponer detalles internos del error.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('[HealthCheck] Error de conexión a la base de datos:', error)
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
