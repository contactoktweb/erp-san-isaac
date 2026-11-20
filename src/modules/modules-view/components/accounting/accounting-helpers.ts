import * as XLSX from 'xlsx'
import type { DateRange } from '@/components/ui/date-range-filter'
import {
  COST_STATEMENT_DEMO,
  computeCostStatement,
  type CostStatementValues,
} from '@/modules/modules-view/components/shared/cost-statement-table'
import {
  MUISCA_FILENAME_LENGTH,
  MUISCA_MAX_RECORDS_PER_FILE,
  SAN_ISAAC_DV,
  SAN_ISAAC_LEGAL_NAME,
  SAN_ISAAC_NIT,
  type BankAccountConfig,
  type BankReconciliationRow,
  type CostStatementPeriod,
  type ExogenaFormatDefinition,
  type ExtendedAccountEntry,
  type MuiscaConcept,
  type MuiscaPartitionFile,
  type NiifLineItem,
  type NiifStatementsSummary,
} from './types'

const DAYS_IN_QUARTER = 90
const DAYS_IN_MONTH = 30
const MONTHS_PER_QUARTER = 3
const QUARTERS_PER_YEAR = 4
const EXCEL_SERIAL_MIN_VALID = 20_000
const MILLISECONDS_PER_DAY = 86_400_000

/** Elimina puntos, guiones y cualquier carácter no numérico de un documento DIAN. */
export function sanitizeIdentificationNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Construye y valida el nombre de archivo oficial MUISCA de la DIAN (33 caracteres).
 * Formato: `Dmuisca_` + CC(2) + FFFFF(5) + VV(2) + AAAA(4) + SSSSSSSS(8) + `.xml`
 * Ejemplo: buildMuiscaFileName('01', '1001', '10', 2026, 1) -> 'Dmuisca_010100110202600000001.xml'
 */
export function buildMuiscaFileName(
  concepto: string | number,
  formato: string | number,
  version: string | number,
  anio: string | number,
  consecutivo: string | number
): string {
  const cc = sanitizeIdentificationNumber(String(concepto)).padStart(2, '0').slice(-2)
  const fffff = sanitizeIdentificationNumber(String(formato)).padStart(5, '0').slice(-5)
  const vv = sanitizeIdentificationNumber(String(version)).padStart(2, '0').slice(-2)
  const aaaa = sanitizeIdentificationNumber(String(anio)).padStart(4, '0').slice(-4)
  const numericConsecutivo = Math.max(1, Math.min(99_999_999, Math.trunc(Number(consecutivo) || 1)))
  const ssssssss = String(numericConsecutivo).padStart(8, '0')

  const fileName = `Dmuisca_${cc}${fffff}${vv}${aaaa}${ssssssss}.xml`

  if (fileName.length !== MUISCA_FILENAME_LENGTH || !/^Dmuisca_\d{21}\.xml$/.test(fileName)) {
    throw new Error(
      `Nombre MUISCA inválido (${fileName.length} caracteres, se esperaban ${MUISCA_FILENAME_LENGTH}): ${fileName}`
    )
  }

  return fileName
}

export function validateMuiscaFileName(fileName: string): boolean {
  return fileName.length === MUISCA_FILENAME_LENGTH && /^Dmuisca_\d{21}\.xml$/.test(fileName)
}

/**
 * Calcula los archivos MUISCA requeridos respetando el límite máximo de 5.000 registros por archivo.
 */
export function buildMuiscaPartitions(
  concepto: MuiscaConcept,
  formato: string,
  version: string,
  anio: number,
  startConsecutivo: number,
  totalRecords: number
): MuiscaPartitionFile[] {
  const safeTotal = Math.max(1, Math.trunc(totalRecords))
  const totalParts = Math.ceil(safeTotal / MUISCA_MAX_RECORDS_PER_FILE)
  const baseConsecutivo = Math.max(1, Math.trunc(startConsecutivo) || 1)

  const partitions: MuiscaPartitionFile[] = []
  for (let i = 0; i < totalParts; i += 1) {
    const consecutivo = baseConsecutivo + i
    const recordFrom = i * MUISCA_MAX_RECORDS_PER_FILE + 1
    const recordTo = Math.min((i + 1) * MUISCA_MAX_RECORDS_PER_FILE, safeTotal)
    const fileName = buildMuiscaFileName(concepto, formato, version, anio, consecutivo)
    partitions.push({
      partNumber: i + 1,
      totalParts,
      consecutivo,
      fileName,
      isValidLength: validateMuiscaFileName(fileName),
      recordFrom,
      recordTo,
      recordCount: recordTo - recordFrom + 1,
    })
  }
  return partitions
}

function escapeXml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/** Genera el contenido XML MUISCA de demostración para descarga con Blob. */
export function generateMuiscaXmlContent(params: {
  format: ExogenaFormatDefinition
  concepto: MuiscaConcept
  fiscalYear: number
  consecutivo: number
  partition: MuiscaPartitionFile
}): string {
  const { format, concepto, fiscalYear, partition } = params
  const todayIso = new Date().toISOString().slice(0, 19)
  const rowTag = `reg_${format.code}`

  const rowsXml = format.rows
    .map((row) => {
      const cleanId = sanitizeIdentificationNumber(row.documentNumber)
      const dvAttr = row.dv ? ` dv="${escapeXml(row.dv)}"` : ''
      return `    <${rowTag} cpt="${escapeXml(row.conceptCode)}" tdoc="${escapeXml(row.docTypeCode)}" nid="${escapeXml(cleanId)}"${dvAttr} raz="${escapeXml(row.businessName)}" v1="${row.primaryAmountCOP}" v2="${row.secondaryAmountCOP}" />`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<mas xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cab>
    <Ano>${fiscalYear}</Ano>
    <CodCpt>${concepto}</CodCpt>
    <Formato>${format.code}</Formato>
    <Version>${format.version.padStart(2, '0')}</Version>
    <NumEnvio>${partition.consecutivo}</NumEnvio>
    <FecEnvio>${todayIso}</FecEnvio>
    <FecInicial>${fiscalYear}-01-01</FecInicial>
    <FecFinal>${fiscalYear}-12-31</FecFinal>
    <NitInformante>${SAN_ISAAC_NIT}</NitInformante>
    <DvInformante>${SAN_ISAAC_DV}</DvInformante>
    <RazonSocial>${escapeXml(SAN_ISAAC_LEGAL_NAME)}</RazonSocial>
    <ValorTotal>${format.totalAmountCOP}</ValorTotal>
    <CantReg>${partition.recordCount}</CantReg>
    <Parte>${partition.partNumber} de ${partition.totalParts}</Parte>
  </Cab>
  <Registros>
${rowsXml}
  </Registros>
</mas>
`
}

export function downloadBlobFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Inferencia de clasificación NIIF / PUC para cuentas creadas desde asientos manuales. */
export function inferPucAccountType(code: string): string {
  if (code.startsWith('240802')) return 'Pasivo (Menor valor IVA - Débito)'
  if (code.startsWith('612095') || code.startsWith('6')) return 'Costo de Ventas'
  const firstDigit = code.trim()[0]
  switch (firstDigit) {
    case '1':
      return 'Activo'
    case '2':
      return 'Pasivo'
    case '3':
      return 'Patrimonio'
    case '4':
      return 'Ingresos'
    case '5':
      return 'Gastos'
    case '7':
      return 'Costos de producción'
    default:
      return 'Activo'
  }
}

export function getAccountTypeBadgeVariant(
  accountType: string
): 'outline' | 'warning' | 'danger' | 'info' | 'secondary' {
  if (accountType === 'Activo') return 'outline'
  if (accountType.startsWith('Pasivo')) return 'danger'
  if (accountType === 'Costos de producción' || accountType === 'Costo de Ventas') return 'warning'
  if (accountType === 'Gastos') return 'secondary'
  return 'info'
}

/**
 * Deriva Balance General y Estado de Resultados Integral NIIF directamente del PUC vigente.
 */
export function computeNiifStatements(accounts: ExtendedAccountEntry[]): NiifStatementsSummary {
  const assets: NiifLineItem[] = []
  const liabilities: NiifLineItem[] = []
  const equity: NiifLineItem[] = []
  const revenues: NiifLineItem[] = []
  const costOfSales: NiifLineItem[] = []
  const productionCosts: NiifLineItem[] = []
  const operatingExpenses: NiifLineItem[] = []

  for (const acc of accounts) {
    const debitMinusCredit = acc.debitCOP - acc.creditCOP
    const creditMinusDebit = acc.creditCOP - acc.debitCOP
    const classDigit = acc.code.trim()[0]

    switch (classDigit) {
      case '1':
        assets.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: debitMinusCredit,
        })
        break
      case '2':
        liabilities.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: creditMinusDebit,
        })
        break
      case '3':
        equity.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: creditMinusDebit,
        })
        break
      case '4':
        revenues.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: creditMinusDebit,
        })
        break
      case '5':
        operatingExpenses.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: debitMinusCredit,
        })
        break
      case '6':
        costOfSales.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: debitMinusCredit,
        })
        break
      case '7':
        productionCosts.push({
          code: acc.code,
          name: acc.name,
          classification: acc.accountType,
          amountCOP: debitMinusCredit,
        })
        break
      default:
        break
    }
  }

  const sumAmounts = (items: NiifLineItem[]) => items.reduce((sum, item) => sum + item.amountCOP, 0)

  const totalAssetsCOP = sumAmounts(assets)
  const totalLiabilitiesCOP = sumAmounts(liabilities)
  const totalEquityBeforeIncomeCOP = sumAmounts(equity)
  const totalRevenuesCOP = sumAmounts(revenues)
  const totalCostOfSalesCOP = sumAmounts(costOfSales)
  const totalProductionCostsCOP = sumAmounts(productionCosts)
  const totalOperatingExpensesCOP = sumAmounts(operatingExpenses)

  const grossProfitOverCostOfSalesCOP = totalRevenuesCOP - totalCostOfSalesCOP
  const netIncomeCOP =
    totalRevenuesCOP - totalCostOfSalesCOP - totalProductionCostsCOP - totalOperatingExpensesCOP

  const totalEquityCOP = totalEquityBeforeIncomeCOP + netIncomeCOP
  const totalLiabilitiesAndEquityCOP = totalLiabilitiesCOP + totalEquityCOP

  return {
    assets,
    liabilities,
    equity,
    revenues,
    costOfSales,
    productionCosts,
    operatingExpenses,
    totalAssetsCOP,
    totalLiabilitiesCOP,
    totalEquityBeforeIncomeCOP,
    netIncomeCOP,
    totalEquityCOP,
    totalLiabilitiesAndEquityCOP,
    totalRevenuesCOP,
    totalCostOfSalesCOP,
    grossProfitOverCostOfSalesCOP,
    totalProductionCostsCOP,
    totalOperatingExpensesCOP,
    isBalanceSheetBalanced: totalAssetsCOP === totalLiabilitiesAndEquityCOP,
  }
}

/** Calcula los valores del Estado de Costos según el periodo seleccionado. */
export function getCostStatementForPeriod(
  period: CostStatementPeriod,
  dateRange: DateRange
): { values: CostStatementValues; badgeLabel: string } {
  const base = COST_STATEMENT_DEMO
  if (period === 'Trimestral') {
    return { values: base, badgeLabel: 'Periodo 2026-Q1 (Trimestral)' }
  }

  if (period === 'Mensual') {
    return {
      values: {
        rawMaterialOpening: base.rawMaterialOpening,
        netPurchases: Math.round(base.netPurchases / MONTHS_PER_QUARTER),
        rawMaterialClosing: 26_200_000,
        directLabor: Math.round(base.directLabor / MONTHS_PER_QUARTER),
        overhead: Math.round(base.overhead / MONTHS_PER_QUARTER),
        wipOpening: base.wipOpening,
        wipClosing: 7_800_000,
        finishedGoodsOpening: base.finishedGoodsOpening,
        finishedGoodsClosing: 25_333_333,
      },
      badgeLabel: 'Periodo Mensual (Marzo 2026)',
    }
  }

  if (period === 'Anual') {
    return {
      values: {
        rawMaterialOpening: base.rawMaterialOpening,
        netPurchases: base.netPurchases * QUARTERS_PER_YEAR,
        rawMaterialClosing: base.rawMaterialClosing,
        directLabor: base.directLabor * QUARTERS_PER_YEAR,
        overhead: base.overhead * QUARTERS_PER_YEAR,
        wipOpening: base.wipOpening,
        wipClosing: base.wipClosing,
        finishedGoodsOpening: base.finishedGoodsOpening,
        finishedGoodsClosing: base.finishedGoodsClosing,
      },
      badgeLabel: 'Proyectado Anual 2026',
    }
  }

  const fromDate = dateRange.from ? new Date(`${dateRange.from}T00:00:00`) : null
  const toDate = dateRange.to ? new Date(`${dateRange.to}T00:00:00`) : null
  const diffDays =
    fromDate && toDate && toDate >= fromDate
      ? Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / MILLISECONDS_PER_DAY) + 1)
      : DAYS_IN_MONTH
  const factor = diffDays / DAYS_IN_QUARTER

  return {
    values: {
      rawMaterialOpening: base.rawMaterialOpening,
      netPurchases: Math.round(base.netPurchases * factor),
      rawMaterialClosing: base.rawMaterialClosing,
      directLabor: Math.round(base.directLabor * factor),
      overhead: Math.round(base.overhead * factor),
      wipOpening: base.wipOpening,
      wipClosing: base.wipClosing,
      finishedGoodsOpening: base.finishedGoodsOpening,
      finishedGoodsClosing: base.finishedGoodsClosing,
    },
    badgeLabel:
      dateRange.from && dateRange.to
        ? `Rango ${dateRange.from} a ${dateRange.to} (${diffDays} días)`
        : 'Rango personalizado',
  }
}

/** Exporta las 13 líneas del Estado de Costos a un archivo Excel (.xlsx). */
export function exportCostStatementExcel(values: CostStatementValues, periodLabel: string): string {
  const totals = computeCostStatement(values)

  const rows: Array<[string, string, number]> = [
    ['1. Inventario Inicial de Materias Primas (140501)', 'Base', values.rawMaterialOpening],
    ['(+) Compras Netas de Parafinas, Ceras y Pabilos', 'Suma', values.netPurchases],
    ['(-) Inventario Final de Materias Primas (140501)', 'Resta', -values.rawMaterialClosing],
    ['(=) Materia Prima Directa Utilizada en Fábrica', 'Subtotal', totals.rawMaterialUsed],
    ['(+) Mano de Obra Directa (MOD — 720501)', 'Suma', values.directLabor],
    ['(+) Costos Indirectos de Fabricación y Gas (CIF — 730501)', 'Suma', values.overhead],
    ['(=) Costo Total de Producción del Periodo', 'Subtotal', totals.productionCost],
    ['(+) Inventario Inicial de Productos en Proceso (141001)', 'Suma', values.wipOpening],
    ['(-) Inventario Final de Productos en Proceso (141001)', 'Resta', -values.wipClosing],
    ['(=) Costo de Productos Terminados en el Periodo', 'Subtotal', totals.finishedGoodsCost],
    ['(+) Inventario Inicial de Producto Terminado (143005)', 'Suma', values.finishedGoodsOpening],
    ['(-) Inventario Final de Producto Terminado (143005)', 'Resta', -values.finishedGoodsClosing],
    ['(=) COSTO DE VENTAS TOTAL (CUENTA 612095)', 'Total', totals.costOfSales],
  ]

  const aoa: Array<Array<string | number>> = [
    [SAN_ISAAC_LEGAL_NAME, `NIT ${SAN_ISAAC_NIT}-${SAN_ISAAC_DV}`, periodLabel],
    ['Estado de Costos de Producción y Ventas (Decreto 2650)', '', ''],
    ['Línea / Concepto Contable', 'Operación', 'Valor (COP)'],
    ...rows,
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet['!cols'] = [{ wch: 56 }, { wch: 14 }, { wch: 20 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Estado de Costos')

  const slug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const fileName = `estado_costos_san_isaac_${slug}.xlsx`
  XLSX.writeFile(workbook, fileName)
  return fileName
}

/** Exporta un formato de Exógena DIAN a Excel normalizado para Prevalidador. */
export function exportExogenaExcel(format: ExogenaFormatDefinition, fiscalYear: number): string {
  const sheetRows = format.rows.map((row) => ({
    Formato: format.code,
    Version: format.version,
    AnoGravable: fiscalYear,
    Concepto: row.conceptCode,
    TipoDocumento: row.docTypeCode,
    NumeroIdentificacion: sanitizeIdentificationNumber(row.documentNumber),
    DV: row.dv,
    RazonSocial: row.businessName,
    [format.primaryColumnLabel]: row.primaryAmountCOP,
    [format.secondaryColumnLabel]: row.secondaryAmountCOP,
    Estado: row.validationStatus,
  }))

  const worksheet = XLSX.utils.json_to_sheet(sheetRows)
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 9 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 22 },
    { wch: 6 },
    { wch: 42 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, `Formato_${format.code}`)

  const fileName = `Prevalidador_DIAN_${format.code}_v${format.version}_${fiscalYear}.xlsx`
  XLSX.writeFile(workbook, fileName)
  return fileName
}

function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function findColumnValue(record: Record<string, unknown>, candidates: string[]): unknown {
  const entries = Object.entries(record)
  for (const candidate of candidates) {
    const found = entries.find(([k]) => normalizeHeaderKey(k) === candidate)
    if (found && found[1] !== '') return found[1]
  }
  for (const candidate of candidates) {
    const found = entries.find(([k]) => normalizeHeaderKey(k).includes(candidate))
    if (found && found[1] !== '') return found[1]
  }
  return undefined
}

function parseMonetaryValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw)
  }
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  const isParensNegative = /^\(.*\)$/.test(trimmed)
  const cleaned = trimmed.replace(/[()$COPcop\s]/g, '')
  if (!cleaned) return null

  let normalized = cleaned
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    normalized = cleaned.replaceAll('.', '').replace(',', '.')
  } else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleaned)) {
    normalized = cleaned.replaceAll(',', '')
  } else if (/^-?\d+,\d{1,2}$/.test(cleaned)) {
    normalized = cleaned.replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  const rounded = Math.round(parsed)
  return isParensNegative ? -Math.abs(rounded) : rounded
}

function parseExcelDateValue(raw: unknown): string {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10)
  }
  if (typeof raw === 'number' && raw > EXCEL_SERIAL_MIN_VALID) {
    const parsed = XLSX.SSF.parse_date_code(raw) as
      | { y: number; m: number; d: number }
      | undefined
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const m = String(parsed.m).padStart(2, '0')
      const d = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${m}-${d}`
    }
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10)
    }
    if (trimmed) return trimmed
  }
  return new Date().toISOString().slice(0, 10)
}

function isBankFeeDescription(description: string): boolean {
  const normalized = description.toLowerCase()
  return (
    normalized.includes('gmf') ||
    normalized.includes('4x1000') ||
    normalized.includes('comision') ||
    normalized.includes('comisión') ||
    normalized.includes('cuota') ||
    normalized.includes('gravamen') ||
    normalized.includes('iva comision')
  )
}

/**
 * Lee un extracto bancario (.xlsx o .csv) con SheetJS, mapea Fecha/Descripción/Referencia/Valor
 * y realiza el cruce automático con el semáforo de conciliación.
 */
export function parseBankStatementWorkbook(
  arrayBuffer: ArrayBuffer,
  accountConfig: BankAccountConfig,
  existingRows: BankReconciliationRow[]
): { importedRows: BankReconciliationRow[]; reconciledCount: number; pendingCount: number; diffCount: number } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('El archivo no contiene hojas de cálculo legibles.')
  }

  const sheet = workbook.Sheets[firstSheetName]
  const rawRecords = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  if (rawRecords.length === 0) {
    throw new Error('El extracto está vacío o no tiene filas con encabezados válidos.')
  }

  const importedRows: BankReconciliationRow[] = []
  let reconciledCount = 0
  let pendingCount = 0
  let diffCount = 0

  rawRecords.forEach((record, index) => {
    const rawDate = findColumnValue(record, ['fecha', 'date', 'fechamovimiento', 'fmovimiento'])
    const rawDesc = findColumnValue(record, [
      'descripcion',
      'concepto',
      'detalle',
      'description',
      'movimiento',
    ])
    const rawRef = findColumnValue(record, [
      'referencia',
      'comprobante',
      'documento',
      'nrodocumento',
      'ref',
      'voucher',
      'reference',
    ])

    let amountCOP = parseMonetaryValue(
      findColumnValue(record, ['valor', 'monto', 'importe', 'amount', 'valorcop', 'neto'])
    )

    if (amountCOP === null) {
      const creditVal =
        parseMonetaryValue(findColumnValue(record, ['credito', 'abono', 'ingreso', 'entrada'])) ?? 0
      const debitVal =
        parseMonetaryValue(findColumnValue(record, ['debito', 'cargo', 'egreso', 'salida'])) ?? 0
      if (creditVal !== 0 || debitVal !== 0) {
        amountCOP = creditVal - Math.abs(debitVal)
      }
    }

    if (amountCOP === null && !rawDesc && !rawRef) {
      return
    }

    const bankAmountCOP = amountCOP ?? 0
    const description = String(rawDesc ?? '').trim() || `Movimiento extracto #${index + 1}`
    const voucher = String(rawRef ?? '').trim() || 'Sin soporte'
    const normalizedRef = voucher.toUpperCase()

    const matchingBookEntry = accountConfig.bookEntries.find(
      (entry) => entry.reference.toUpperCase() === normalizedRef && entry.amountCOP === bankAmountCOP
    )

    const matchingExistingRow = existingRows.find(
      (row) => row.voucher.toUpperCase() === normalizedRef && row.bankAmountCOP === bankAmountCOP
    )

    let status: BankReconciliationRow['status']
    let bookAmountCOP = 0

    if (matchingBookEntry || (matchingExistingRow && matchingExistingRow.bookAmountCOP === bankAmountCOP)) {
      status = 'Conciliada'
      bookAmountCOP = bankAmountCOP
      reconciledCount += 1
    } else if (isBankFeeDescription(description)) {
      status = 'Pendiente causar'
      pendingCount += 1
    } else {
      status = 'Diferencia por revisar'
      diffCount += 1
    }

    importedRows.push({
      id: `imp-${Date.now()}-${index}`,
      date: parseExcelDateValue(rawDate),
      description,
      voucher,
      bankAmountCOP,
      bookAmountCOP,
      status,
      source: 'imported',
    })
  })

  if (importedRows.length === 0) {
    throw new Error(
      'No se detectaron columnas compatibles (Fecha, Descripción, Referencia, Valor) en el extracto.'
    )
  }

  return { importedRows, reconciledCount, pendingCount, diffCount }
}

/** Genera un archivo Excel (.xlsx) de ejemplo para probar la importación de extractos. */
export function downloadBankStatementTemplate(accountConfig: BankAccountConfig): string {
  const sampleRows = [
    {
      Fecha: '2026-03-06',
      Descripción: accountConfig.bookEntries[0]?.description ?? 'Movimiento conciliado',
      Referencia: accountConfig.bookEntries[0]?.reference ?? 'CE-2026-041',
      Valor: accountConfig.bookEntries[0]?.amountCOP ?? -98_000_000,
    },
    {
      Fecha: '2026-03-06',
      Descripción: 'Comisión bancaria transferencia ACH',
      Referencia: 'Pendiente',
      Valor: -14_500,
    },
    {
      Fecha: '2026-03-06',
      Descripción: 'Consignación cliente sin referencia en extracto',
      Referencia: 'REF-EXT-991',
      Valor: 1_200_000,
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows)
  worksheet['!cols'] = [{ wch: 14 }, { wch: 46 }, { wch: 18 }, { wch: 16 }]
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Extracto')
  const fileName = `plantilla_extracto_${accountConfig.id}.xlsx`
  XLSX.writeFile(workbook, fileName)
  return fileName
}
