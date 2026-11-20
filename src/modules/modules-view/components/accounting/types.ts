import type { AccountEntry } from '@/database/schemas'

export type ExtendedAccountEntry = AccountEntry & {
  thirdParty?: string
}

export type VoucherType =
  | 'Comprobante de Diario'
  | 'Nota de Contabilidad'
  | 'Comprobante de Egreso'
  | 'Recibo de Caja'

export interface JournalVoucherLine {
  id: string
  accountCode: string
  accountName: string
  thirdParty: string
  costCenter: string
  debitCOP: number
  creditCOP: number
}

export interface JournalVoucher {
  id: string
  voucherNumber: string
  date: string
  type: VoucherType
  description: string
  totalDebitCOP: number
  totalCreditCOP: number
  lines: JournalVoucherLine[]
}

export type CostStatementPeriod = 'Mensual' | 'Trimestral' | 'Anual' | 'Rango de fechas'

export type BankAccountId = 'bancolombia-111005' | 'nequi' | 'daviplata'

export type BankReconciliationStatus =
  | 'Conciliada'
  | 'Pendiente causar'
  | 'Diferencia por revisar'

export interface BankReconciliationRow {
  id: string
  date: string
  description: string
  voucher: string
  bankAmountCOP: number
  bookAmountCOP: number
  status: BankReconciliationStatus
  source: 'demo' | 'imported'
}

export interface BankBookEntry {
  reference: string
  amountCOP: number
  description: string
}

export interface BankAccountConfig {
  id: BankAccountId
  label: string
  pucCode: string
  initialBookBalanceCOP: number
  bookEntries: BankBookEntry[]
}

export type MuiscaConcept = '01' | '02'

export type ExogenaFormatCode =
  | '1001'
  | '1003'
  | '1005'
  | '1006'
  | '1007'
  | '1008'
  | '1009'

export interface ExogenaRow {
  id: string
  conceptCode: string
  conceptLabel: string
  docTypeCode: string
  docTypeLabel: string
  documentNumber: string
  dv: string
  businessName: string
  primaryAmountCOP: number
  secondaryAmountCOP: number
  validationStatus: 'Conforme' | 'Agrupado Cuantías Menores'
  isMinorQuantities?: boolean
}

export interface ExogenaFormatDefinition {
  code: ExogenaFormatCode
  version: string
  title: string
  subtitle: string
  badgeText: string
  badgeClass: string
  recordCount: number
  countLabel: string
  totalAmountCOP: number
  primaryColumnLabel: string
  secondaryColumnLabel: string
  rows: ExogenaRow[]
}

export interface MuiscaPartitionFile {
  partNumber: number
  totalParts: number
  consecutivo: number
  fileName: string
  isValidLength: boolean
  recordFrom: number
  recordTo: number
  recordCount: number
}

export interface NiifLineItem {
  code: string
  name: string
  classification: string
  amountCOP: number
}

export interface NiifStatementsSummary {
  assets: NiifLineItem[]
  liabilities: NiifLineItem[]
  equity: NiifLineItem[]
  revenues: NiifLineItem[]
  costOfSales: NiifLineItem[]
  productionCosts: NiifLineItem[]
  operatingExpenses: NiifLineItem[]
  totalAssetsCOP: number
  totalLiabilitiesCOP: number
  totalEquityBeforeIncomeCOP: number
  netIncomeCOP: number
  totalEquityCOP: number
  totalLiabilitiesAndEquityCOP: number
  totalRevenuesCOP: number
  totalCostOfSalesCOP: number
  grossProfitOverCostOfSalesCOP: number
  totalProductionCostsCOP: number
  totalOperatingExpensesCOP: number
  isBalanceSheetBalanced: boolean
}

export const COST_CENTERS = [
  'CC-100 Producción',
  'CC-200 Administración',
  'CC-300 Logística',
  'CC-400 Ventas',
] as const

export const VOUCHER_TYPES: readonly VoucherType[] = [
  'Comprobante de Diario',
  'Nota de Contabilidad',
  'Comprobante de Egreso',
  'Recibo de Caja',
] as const

export const MUISCA_FILENAME_LENGTH = 33
export const MUISCA_MAX_RECORDS_PER_FILE = 5_000
export const CUANTIAS_MENORES_NIT = '222222222'
export const CONSUMIDOR_FINAL_DOC = '222222222222'
export const SAN_ISAAC_NIT = '901473704'
export const SAN_ISAAC_DV = '4'
export const SAN_ISAAC_LEGAL_NAME = 'VELAS, VELONES Y CIRIOS SAN ISAAC SAS'
export const SAN_ISAAC_CCHG_CITY = 'Guaduas, Cundinamarca'
