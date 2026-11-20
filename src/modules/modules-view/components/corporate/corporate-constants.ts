import type { ShareholderRecord } from '@/database/schemas'

export const CORPORATE_COMPANY = {
  legalName: 'Velas, Velones y Cirios San Isaac SAS',
  nit: '901.473.704-4',
  chamberName: 'Cámara de Comercio de Honda, Guaduas y Norte del Tolima',
  chamberAcronym: 'CCHG',
  mercantileRegistration: '71802',
  address: 'CR 5 # 6 - 107, Guaduas, Cundinamarca',
  ciiu: '3290',
  legalRepresentativeName: 'Edwin Mateo Ramírez Silva',
  legalRepresentativeDoc: 'CC 1.072.752.788',
  authorizedShares: 500,
  nominalValuePerShareCOP: 300_000,
  authorizedCapitalCOP: 150_000_000,
  maxPaymentYearsLey1258: 2,
} as const

export const PUC_EQUITY_ACCOUNTS = [
  {
    code: '310505',
    name: 'Capital Autorizado',
    nature: 'Crédito',
    description: 'Valor máximo de capital aprobado en estatutos (500 acciones a $300.000 c/u).',
  },
  {
    code: '310510',
    name: 'Capital por Suscribir',
    nature: 'Débito (Resta)',
    description: 'Acciones autorizadas en reserva pendientes de emisión o suscripción.',
  },
  {
    code: '310515',
    name: 'Capital Suscrito por Cobrar',
    nature: 'Débito (Resta)',
    description: 'Saldo pendiente de pago por accionistas (plazo máximo 2 años — Ley 1258 Art. 9).',
  },
] as const

export type ShareMovementType = 'Emisión' | 'Suscripción' | 'Cesión'

export interface ShareMovementRecord {
  id: string
  date: string
  movementType: ShareMovementType
  shareholderName: string
  counterpartyName?: string
  shares: number
  nominalTotalCOP: number
  paidCOP: number
  pendingCOP: number
  certificateNumber: string
  minuteReference: string
  pucSummary: string
}

export type MeetingType = 'Ordinaria' | 'Extraordinaria'
export type ChamberRegistryStatus = 'Registrada CCHG' | 'En Trámite CCHG' | 'No Requiere CCHG'

export interface AssemblyMinuteRecord {
  id: string
  minuteNumber: string
  title: string
  meetingType: MeetingType
  sessionDate: string
  decisionsSummary: string
  requiresChamberRegistry: boolean
  chamberStatus: ChamberRegistryStatus
  fileName: string
  fileSizeBytes?: number
  fileObjectUrl?: string
}

export interface CorporateBaseDocument {
  id: 'estatutos' | 'existencia'
  title: string
  subtitle: string
  fileName: string
  updatedAt: string
  statusLabel: string
  fileSizeBytes?: number
  fileObjectUrl?: string
}

export const INITIAL_ASSEMBLY_MINUTES: AssemblyMinuteRecord[] = [
  {
    id: 'min-001',
    minuteNumber: 'Acta No. 01',
    title: 'Constitución SAS',
    meetingType: 'Extraordinaria',
    sessionDate: '2021-11-09',
    decisionsSummary:
      'Constitución de Velas, Velones y Cirios San Isaac SAS (Ley 1258 de 2008), aprobación de estatutos sociales, capital autorizado de $150.000.000 (500 acciones), suscripción inicial de 50 acciones (TIT-001) y designación de Edwin Mateo Ramírez Silva como Representante Legal.',
    requiresChamberRegistry: true,
    chamberStatus: 'Registrada CCHG',
    fileName: 'Acta_01_Constitucion_SAS_CCHG_71802.pdf',
  },
  {
    id: 'min-004',
    minuteNumber: 'Acta No. 04',
    title: 'Asamblea Ordinaria 2024',
    meetingType: 'Ordinaria',
    sessionDate: '2024-03-22',
    decisionsSummary:
      'Aprobación de estados financieros bajo NIIF PyMES del ejercicio 2023, informe de gestión del Representante Legal y destinación de utilidades.',
    requiresChamberRegistry: true,
    chamberStatus: 'Registrada CCHG',
    fileName: 'Acta_04_Asamblea_Ordinaria_2024.pdf',
  },
  {
    id: 'min-007',
    minuteNumber: 'Acta No. 07',
    title: 'Asamblea Ordinaria 2025',
    meetingType: 'Ordinaria',
    sessionDate: '2025-03-28',
    decisionsSummary:
      'Aprobación de balances NIIF 2024 y plan de modernización de planta de velas y pailas térmicas en Guaduas.',
    requiresChamberRegistry: true,
    chamberStatus: 'Registrada CCHG',
    fileName: 'Acta_07_Asamblea_Ordinaria_2025.pdf',
  },
  {
    id: 'min-009',
    minuteNumber: 'Acta No. 09',
    title: 'Sesión Extraordinaria',
    meetingType: 'Extraordinaria',
    sessionDate: '2025-11-01',
    decisionsSummary:
      'Autorización para trámite de actualización de libros electrónicos societarios y lineamientos para colocación de acciones en reserva.',
    requiresChamberRegistry: true,
    chamberStatus: 'En Trámite CCHG',
    fileName: 'Acta_09_Sesion_Extraordinaria_2025.pdf',
  },
]

export const INITIAL_BASE_DOCUMENTS: CorporateBaseDocument[] = [
  {
    id: 'estatutos',
    title: 'Estatutos Sociales Vigentes (PDF)',
    subtitle: 'Documento constitutivo SAS • Ley 1258 de 2008 • Capital autorizado 500 acciones',
    fileName: 'Estatutos_Sociales_San_Isaac_SAS_Vigentes.pdf',
    updatedAt: '2021-11-09',
    statusLabel: 'Vigente • Registrado CCHG',
  },
  {
    id: 'existencia',
    title: 'Certificado de Existencia y Representación Legal Vigente (PDF)',
    subtitle: 'CCHG (Honda, Guaduas y Norte del Tolima) • Matrícula 71802 • NIT 901.473.704-4',
    fileName: 'Certificado_Existencia_CCHG_Mat_71802.pdf',
    updatedAt: '2026-10-15',
    statusLabel: 'Vigente • Matrícula 71802',
  },
]

export function buildInitialShareMovements(shareholders: ShareholderRecord[]): ShareMovementRecord[] {
  return shareholders
    .filter((sh) => sh.shareCount > 0)
    .map((sh, index) => {
      const subscribed = sh.subscribedCapitalCOP ?? sh.totalCapitalCOP
      const paid = sh.paidCapitalCOP ?? subscribed
      const pending = sh.pendingCapitalCOP ?? Math.max(0, subscribed - paid)
      return {
        id: `mov-init-${sh.id}-${index}`,
        date: sh.entryDate.slice(0, 10),
        movementType: 'Suscripción',
        shareholderName: sh.shareholderName,
        shares: sh.shareCount,
        nominalTotalCOP: subscribed,
        paidCOP: paid,
        pendingCOP: pending,
        certificateNumber: sh.shareCertificateNumber ?? `TIT-${String(index + 1).padStart(3, '0')}`,
        minuteReference: 'Acta No. 01 — Constitución SAS',
        pucSummary: 'DB 111005 / DB 310510 · CR 310505 (Constitución)',
      }
    })
}

export function formatTitleNumericCode(certificateCode?: string): string {
  if (!certificateCode) return '001'
  const match = certificateCode.match(/(\d+)$/)
  return match ? match[1].padStart(3, '0') : certificateCode
}

export function getNextCertificateNumber(shareholders: ShareholderRecord[]): string {
  const maxNum = shareholders.reduce((max, sh) => {
    const match = sh.shareCertificateNumber?.match(/(\d+)$/)
    const parsed = match ? Number.parseInt(match[1], 10) : 0
    return Number.isNaN(parsed) ? max : Math.max(max, parsed)
  }, 0)
  return `TIT-${String(maxNum + 1).padStart(3, '0')}`
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function calculateEquitySummary(shareholders: ShareholderRecord[]) {
  const totalSubscribedShares = shareholders.reduce((acc, sh) => acc + sh.shareCount, 0)
  const reserveShares = Math.max(0, CORPORATE_COMPANY.authorizedShares - totalSubscribedShares)
  const reserveCapitalCOP = reserveShares * CORPORATE_COMPANY.nominalValuePerShareCOP
  const totalSubscribedCOP = shareholders.reduce(
    (acc, sh) => acc + (sh.subscribedCapitalCOP ?? sh.totalCapitalCOP),
    0
  )
  const totalPaidCOP = shareholders.reduce(
    (acc, sh) => acc + (sh.paidCapitalCOP ?? sh.subscribedCapitalCOP ?? sh.totalCapitalCOP),
    0
  )
  const totalPendingCOP = Math.max(0, totalSubscribedCOP - totalPaidCOP)
  const subscribedPercentage = Math.round(
    (totalSubscribedCOP / CORPORATE_COMPANY.authorizedCapitalCOP) * 100
  )
  const paidPercentage =
    totalSubscribedCOP > 0 ? Math.round((totalPaidCOP / totalSubscribedCOP) * 100) : 0

  return {
    totalSubscribedShares,
    reserveShares,
    reserveCapitalCOP,
    totalSubscribedCOP,
    totalPaidCOP,
    totalPendingCOP,
    subscribedPercentage,
    paidPercentage,
  }
}
