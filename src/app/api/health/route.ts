import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint para monitoreo y verificación de estado.
 * En desarrollo: ejecuta una consulta básica a PostgreSQL/Supabase.
 * En producción: responde siempre con { status: "ok" } (modo mock, sin BD).
 */
export async function GET() {
  // En producción no hay BD; retornar ok para no bloquear el monitoreo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ status: 'ok', mode: 'mock' }, { status: 200 })
  }

  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', mode: 'prisma' }, { status: 200 })
  } catch (error) {
    console.error('[HealthCheck] Error de conexión a la base de datos:', error)
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
