import type { DianDocument } from '@/database/schemas'
import type { DateRange } from '@/components/ui/date-range-filter'
import { FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import { daysUntil, RESOLUTION_ALERT_RULE } from '@/lib/dian-resolutions'

export type DianTab = 'docs' | 'certificate' | 'stats'

export type DianDocTypeFilter = 'ALL' | 'FEDV' | 'POS' | 'DS' | 'NOM' | 'NOTES'

export type DianStatusFilter = 'ALL' | 'Aceptada' | 'Pendiente' | 'Rechazada'

export type DianEnvironmentKey = 'habilitacion' | 'produccion'

export interface DianBatchWorkerItem {
  documentNumber: string
  workerName: string
  workerId: string
  cune: string
  netAmountCOP: number
  dianStatus: string
}

export interface DianDocumentRecord extends DianDocument {
  resolucionDian?: string
  referencedDocument?: string
  batchItems?: DianBatchWorkerItem[]
}

export interface DianCertificateInfo {
  issuer: string
  holder: string
  holderNit: string
  serialNumber: string
  expirationDate: string
  algorithm: string
  fileName: string
  lastUpdatedAt?: string
}

export interface DianPingResult {
  latencyMs: number
  environment: DianEnvironmentKey
  checkedAt: string
  statusText: string
}

export interface DianEnvironmentConfig {
  key: DianEnvironmentKey
  label: string
  shortLabel: string
  description: string
  webServiceUrl: string
  testSetId?: string
  simulatedLatencyRangeMs: readonly [number, number]
}

export const DIAN_ENVIRONMENTS: Record<DianEnvironmentKey, DianEnvironmentConfig> = {
  habilitacion: {
    key: 'habilitacion',
    label: 'Habilitación (Set de Pruebas)',
    shortLabel: 'Habilitación',
    description: 'Ambiente de pruebas DIAN para validación previa con TestSetId antes de paso a producción',
    webServiceUrl: 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc',
    testSetId: 'set-pruebas-9014737044-2026',
    simulatedLatencyRangeMs: [125, 215],
  },
  produccion: {
    key: 'produccion',
    label: 'Producción',
    shortLabel: 'Producción (Habilitado)',
    description: 'Ambiente de Producción Habilitado Resolución 000042 — Transmisión oficial con validez fiscal',
    webServiceUrl: 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc',
    simulatedLatencyRangeMs: [95, 165],
  },
}

export const INITIAL_DIAN_CERTIFICATE: DianCertificateInfo = {
  issuer: 'Andes SCD S.A. / Certicámara',
  holder: 'Velas, Velones y Cirios San Isaac SAS',
  holderNit: '901.473.704-4',
  serialNumber: '7A:4F:9C:12:08:E4:31:88',
  expirationDate: '2026-11-12T23:59:59-05:00',
  algorithm: 'SHA-256 con RSA 2048 bits',
  fileName: 'certificado_san_isaac_2025.p12',
}

export const CERTIFICATE_MAX_FILE_SIZE_MB = 5
export const SIMULATED_PING_DELAY_MS = 850
export const SIMULATED_SYNC_DELAY_MS = 1000
export const DEFAULT_NEW_CERT_VALIDITY_YEARS = 1

export const DIAN_DOC_TYPE_OPTIONS: ReadonlyArray<{ value: DianDocTypeFilter; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'FEDV', label: 'Factura FEDV' },
  { value: 'POS', label: 'POS' },
  { value: 'DS', label: 'Doc. Soporte DS' },
  { value: 'NOM', label: 'Nómina NOM' },
  { value: 'NOTES', label: 'Notas Crédito/Débito' },
]

export const DIAN_STATUS_OPTIONS: ReadonlyArray<DianStatusFilter> = [
  'ALL',
  'Aceptada',
  'Pendiente',
  'Rechazada',
]

export function getDefaultDianDateRange(): DateRange {
  return {
    from: `${FISCAL_PARAMETERS.fiscalYear}-01-01`,
    to: `${FISCAL_PARAMETERS.fiscalYear}-12-31`,
  }
}

export function isDianTab(value: string): value is DianTab {
  return value === 'docs' || value === 'certificate' || value === 'stats'
}

export function isDianDocTypeFilter(value: string): value is DianDocTypeFilter {
  return DIAN_DOC_TYPE_OPTIONS.some((opt) => opt.value === value)
}

export function isDianEnvironmentKey(value: string): value is DianEnvironmentKey {
  return value === 'habilitacion' || value === 'produccion'
}

export function matchesDianDocType(doc: DianDocumentRecord, filter: DianDocTypeFilter): boolean {
  if (filter === 'ALL') return true
  const prefix = doc.prefix.toUpperCase()
  const typeLower = doc.documentType.toLowerCase()

  switch (filter) {
    case 'FEDV':
      return prefix === 'FEDV'
    case 'POS':
      return prefix === 'POS'
    case 'DS':
      return prefix === 'DS'
    case 'NOM':
      return prefix === 'NOM'
    case 'NOTES':
      return (
        prefix === 'NC' ||
        prefix === 'ND' ||
        typeLower.includes('nota crédito') ||
        typeLower.includes('nota débito') ||
        typeLower.includes('nota de ajuste')
      )
  }
}

export type CertificateStatusLevel = 'expired' | 'critical' | 'preventive' | 'ok'

export interface CertificateValidityStatus {
  remainingDays: number
  level: CertificateStatusLevel
  statusText: string
}

export function getCertificateValidity(
  expirationDate: string,
  today: Date = new Date()
): CertificateValidityStatus {
  const remainingDays = daysUntil(expirationDate, today)

  if (remainingDays <= 0) {
    return {
      remainingDays,
      level: 'expired',
      statusText: 'Vencido - Requiere Renovación',
    }
  }
  if (remainingDays <= RESOLUTION_ALERT_RULE.criticalDays) {
    return {
      remainingDays,
      level: 'critical',
      statusText: `Vence en ${remainingDays} ${remainingDays === 1 ? 'día' : 'días'}`,
    }
  }
  if (remainingDays <= RESOLUTION_ALERT_RULE.preventiveDays) {
    return {
      remainingDays,
      level: 'preventive',
      statusText: `Vence en ${remainingDays} días`,
    }
  }
  return {
    remainingDays,
    level: 'ok',
    statusText: `Vigente (${remainingDays} días restantes)`,
  }
}

export function toLocalDocumentRecord(doc: DianDocument): DianDocumentRecord {
  return doc as DianDocumentRecord
}

export function buildSimulatedSerialHex(fileName: string): string {
  let hash = 0
  for (let i = 0; i < fileName.length; i++) {
    hash = (hash * 31 + fileName.charCodeAt(i)) >>> 0
  }
  const bytes = Array.from({ length: 8 }, (_, idx) =>
    (((hash >> ((idx % 4) * 8)) ^ (idx * 37 + fileName.length)) & 0xff)
      .toString(16)
      .toUpperCase()
      .padStart(2, '0')
  )
  return bytes.join(':')
}

export function getFutureDateIso(yearsAhead: number): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + yearsAhead)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
