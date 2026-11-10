export interface RecordAuditParams {
  action: string
  entity: string
  entityId?: string | null
  details?: string | null
  userId?: string | null
  userName?: string | null
  ipAddress?: string | null
}

/**
 * Registra una acción en la bitácora inmutable de auditoría del sistema.
 * En producción (NODE_ENV === 'production') el log se omite silenciosamente
 * ya que no hay conexión a base de datos disponible.
 */
export async function recordAuditLog(params: RecordAuditParams): Promise<void> {
  // En producción no hay BD disponible; se omite sin lanzar error
  if (process.env.NODE_ENV === 'production') return

  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        details: params.details ?? null,
        ipAddress: params.ipAddress ?? '127.0.0.1 (Local)',
        userId: params.userId ?? null,
        userName: params.userName ?? 'Sistema ERP',
      },
    })
  } catch (error) {
    // Registro defensivo: la falla en auditoría nunca debe romper la operación de negocio
    console.warn('[AuditLogger] No se pudo guardar el registro de auditoría en base de datos:', error)
  }
}
