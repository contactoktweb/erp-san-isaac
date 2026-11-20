/**
 * Tabla maestra de Resoluciones / Consecutivos DIAN.
 *
 * Fuente ÚNICA consumida por:
 *  - Administración → Pestaña "Consecutivos y Vigencia DIAN"
 *  - Documentos Electrónicos DIAN → Pestaña "Resolución y Rangos Autorizados"
 * En Fase 3 se reemplaza por la consulta a la tabla `resoluciones_dian`.
 */

export interface DianResolution {
  id: string
  documentType: string
  prefix: string
  resolutionNumber: string
  rangeFrom: number
  rangeTo: number
  /** Último número emitido / actual en uso */
  currentNumber: number
  issueDate: string
  expirationDate: string
}

export const DIAN_RESOLUTIONS: DianResolution[] = [
  {
    id: 'res-fedv',
    documentType: 'Factura Electrónica de Venta',
    prefix: 'FEDV',
    resolutionNumber: '18764084314318',
    rangeFrom: 135,
    rangeTo: 2000,
    currentNumber: 139,
    issueDate: '2025-11-28T00:00:00-05:00',
    expirationDate: '2026-11-28T23:59:59-05:00',
  },
  {
    id: 'res-ds',
    documentType: 'Documento Soporte a No Obligados',
    prefix: 'DS',
    resolutionNumber: '187640009941',
    rangeFrom: 1,
    rangeTo: 2000,
    currentNumber: 310,
    issueDate: '2026-01-20T00:00:00-05:00',
    expirationDate: '2027-01-20T23:59:59-05:00',
  },
  {
    id: 'res-pos',
    documentType: 'Documento Equivalente Electrónico POS',
    prefix: 'POS',
    resolutionNumber: '187640003310',
    rangeFrom: 1,
    rangeTo: 10000,
    currentNumber: 1450,
    issueDate: '2026-02-10T00:00:00-05:00',
    expirationDate: '2027-02-10T23:59:59-05:00',
  },
]

/**
 * Regla única de alerta temprana (acordada con San Isaac SAS):
 *  - Crítica:    ≤ 15 días para vencer  o  < 10 % de folios disponibles
 *  - Preventiva: ≤ 30 días para vencer  o  < 200 folios disponibles
 */
export const RESOLUTION_ALERT_RULE = {
  criticalDays: 15,
  criticalFolioPercent: 10,
  preventiveDays: 30,
  preventiveFolios: 200,
} as const

export type ResolutionAlertLevel = 'expired' | 'critical' | 'preventive' | 'ok'

const MS_PER_DAY = 86_400_000

export interface ResolutionStatus {
  totalFolios: number
  usedFolios: number
  remainingFolios: number
  remainingFolioPercent: number
  usedPercent: number
  remainingDays: number
  alertLevel: ResolutionAlertLevel
  formattedCurrent: string
}

/** Calcula días restantes (calendario) entre hoy y una fecha ISO. */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  return Math.ceil((new Date(isoDate).getTime() - today.getTime()) / MS_PER_DAY)
}

export function getResolutionStatus(res: DianResolution, today: Date = new Date()): ResolutionStatus {
  const totalFolios = res.rangeTo - res.rangeFrom + 1
  const usedFolios = Math.max(0, res.currentNumber - res.rangeFrom + 1)
  const remainingFolios = Math.max(0, res.rangeTo - res.currentNumber)
  const remainingFolioPercent = (remainingFolios / totalFolios) * 100
  const remainingDays = daysUntil(res.expirationDate, today)

  let alertLevel: ResolutionAlertLevel = 'ok'
  if (remainingDays <= 0 || remainingFolios === 0) alertLevel = 'expired'
  else if (
    remainingDays <= RESOLUTION_ALERT_RULE.criticalDays ||
    remainingFolioPercent < RESOLUTION_ALERT_RULE.criticalFolioPercent
  )
    alertLevel = 'critical'
  else if (
    remainingDays <= RESOLUTION_ALERT_RULE.preventiveDays ||
    remainingFolios < RESOLUTION_ALERT_RULE.preventiveFolios
  )
    alertLevel = 'preventive'

  return {
    totalFolios,
    usedFolios,
    remainingFolios,
    remainingFolioPercent,
    usedPercent: (usedFolios / totalFolios) * 100,
    remainingDays,
    alertLevel,
    formattedCurrent: `${res.prefix}-${res.currentNumber}`,
  }
}

export const RESOLUTION_ALERT_LABELS: Record<ResolutionAlertLevel, string> = {
  expired: 'Vencida / Agotada',
  critical: 'Alerta crítica',
  preventive: 'Alerta preventiva',
  ok: 'Vigente',
}

