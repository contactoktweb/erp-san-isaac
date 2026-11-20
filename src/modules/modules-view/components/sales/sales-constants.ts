import type { OrderItem, PackingBox, SalesOrder, TrafficLightStatus } from '@/database/schemas'
import { formatNumber } from '@/lib/config'
import { DIAN_RESOLUTIONS, type DianResolution } from '@/lib/dian-resolutions'

export const PREVENTIVE_DELIVERY_DAYS = 3
export const IVA_RATE = 0.19
export const IVA_DIVISOR = 1.19
export const CONSUMIDOR_FINAL_NIT = '222222222222'
export const CONSUMIDOR_FINAL_NAME = 'Consumidor Final'
export const MS_PER_DAY = 86_400_000

export const PUC_SALES_ACCOUNTS = {
  CXC_CLIENTES: '130505',
  ANTICIPO_CLIENTES: '280505',
  CAJA_GENERAL: '110505',
  BANCOS_BANCOLOMBIA: '111005',
} as const

export const DIAN_DV_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71] as const
const DIAN_DV_MODULO = 11

export const FEDV_RESOLUTION: DianResolution =
  DIAN_RESOLUTIONS.find((r) => r.prefix === 'FEDV') ?? {
    id: 'res-fedv',
    documentType: 'Factura Electrónica de Venta',
    prefix: 'FEDV',
    resolutionNumber: '18764084314318',
    rangeFrom: 135,
    rangeTo: 2000,
    currentNumber: 139,
    issueDate: '2025-11-28T00:00:00-05:00',
    expirationDate: '2026-11-28T23:59:59-05:00',
  }

export const POS_RESOLUTION: DianResolution =
  DIAN_RESOLUTIONS.find((r) => r.prefix === 'POS') ?? {
    id: 'res-pos',
    documentType: 'Documento Equivalente Electrónico POS',
    prefix: 'POS',
    resolutionNumber: '187640003310',
    rangeFrom: 1,
    rangeTo: 10000,
    currentNumber: 1450,
    issueDate: '2026-02-10T00:00:00-05:00',
    expirationDate: '2027-02-10T23:59:59-05:00',
  }

/** Calcula el Dígito de Verificación (DV) oficial de la DIAN (módulo 11). */
export function calculateDianDv(rawDocument: string): string {
  const digits = rawDocument.replace(/\D/g, '')
  if (!digits) return ''
  let sum = 0
  const len = digits.length
  for (let i = 0; i < len && i < DIAN_DV_WEIGHTS.length; i++) {
    const digit = Number(digits[len - 1 - i])
    sum += digit * DIAN_DV_WEIGHTS[i]
  }
  const remainder = sum % DIAN_DV_MODULO
  return remainder > 1 ? String(DIAN_DV_MODULO - remainder) : String(remainder)
}

export interface CatalogProductOption {
  id: string
  sku: string
  name: string
  commercialPresentation: string
  unitsPerPresentation: number
  unitPriceCOP: number
  pepsBatches: string[]
}

export const SALES_CATALOG_PRODUCTS: CatalogProductOption[] = [
  {
    id: 'prod-001',
    sku: 'VEL-3D-BCO',
    name: 'Velón Tradicional 3 Días Blanco',
    commercialPresentation: 'Presentación Caja (24 uds)',
    unitsPerPresentation: 24,
    unitPriceCOP: 9500,
    pepsBatches: ['LOT-2026-098', 'LOT-2026-105', 'LOT-PT-2026-104'],
  },
  {
    id: 'prod-002',
    sku: 'VEL-7P-COL',
    name: 'Velón 7 Potencias Multicolor',
    commercialPresentation: 'Presentación Caja (12 uds)',
    unitsPerPresentation: 12,
    unitPriceCOP: 12500,
    pepsBatches: ['LOT-2026-102', 'LOT-PT-2026-096'],
  },
  {
    id: 'prod-056',
    sku: 'CIR-12X60',
    name: 'Cirio Pascual Consagrado 12x60',
    commercialPresentation: 'Unidades',
    unitsPerPresentation: 1,
    unitPriceCOP: 110000,
    pepsBatches: ['LOT-2026-089', 'LOT-PT-2026-088'],
  },
  {
    id: 'prod-030',
    sku: 'VEL-LIT-DOC',
    name: 'Vela Litúrgica Mediana x Docena',
    commercialPresentation: 'Docenas (12 uds)',
    unitsPerPresentation: 12,
    unitPriceCOP: 18000,
    pepsBatches: ['LOT-2026-114', 'LOT-PT-2026-112'],
  },
  {
    id: 'prod-015',
    sku: 'VEL-VIG-BCO',
    name: 'Vela de Vigilia Blanca en Vaso',
    commercialPresentation: 'Unidades',
    unitsPerPresentation: 1,
    unitPriceCOP: 4800,
    pepsBatches: ['LOT-2026-118', 'LOT-2026-122'],
  },
  {
    id: 'prod-008',
    sku: 'VEL-VOT-CJ24',
    name: 'Velón Votivo Blanco en Vaso',
    commercialPresentation: 'Presentación Caja (24 uds)',
    unitsPerPresentation: 24,
    unitPriceCOP: 7800,
    pepsBatches: ['LOT-2026-120', 'LOT-2026-125'],
  },
  {
    id: 'prod-022',
    sku: 'VEL-ARO-LAV',
    name: 'Velón Aromático Esencia Lavanda en Vaso',
    commercialPresentation: 'Unidades',
    unitsPerPresentation: 1,
    unitPriceCOP: 15500,
    pepsBatches: ['LOT-2026-092', 'LOT-2026-110'],
  },
]

export function getSuggestedPepsBatches(productId: string, currentBatch?: string): string[] {
  const fromCatalog = SALES_CATALOG_PRODUCTS.find((p) => p.id === productId)?.pepsBatches ?? [
    'LOT-2026-098',
    'LOT-2026-105',
    'LOT-2026-114',
  ]
  if (currentBatch && !fromCatalog.includes(currentBatch)) {
    return [currentBatch, ...fromCatalog]
  }
  return fromCatalog
}

export interface ClientDirectoryEntry {
  id: string
  documentType: 'NIT' | 'CC'
  documentNumber: string
  verificationDigit: string
  name: string
  city: string
  email: string
  defaultPaymentTerms: SalesOrder['paymentTerms']
}

export const CLIENT_DIRECTORY_SEED: ClientDirectoryEntry[] = [
  {
    id: 'cli-001',
    documentType: 'NIT',
    documentNumber: '860002145',
    verificationDigit: '2',
    name: 'Distribuidora Religiosa El Cirio Sagrado SAS',
    city: 'Bogotá D.C.',
    email: 'facturacion@elciriosagrado.com.co',
    defaultPaymentTerms: 'Crédito 30 días',
  },
  {
    id: 'cli-002',
    documentType: 'NIT',
    documentNumber: '800125478',
    verificationDigit: '9',
    name: 'Parroquia Nuestra Señora de Chiquinquirá',
    city: 'Chiquinquirá (Boyacá)',
    email: 'tesoreria@parroquiachiquinquira.org',
    defaultPaymentTerms: 'Crédito 15 días',
  },
  {
    id: 'cli-003',
    documentType: 'NIT',
    documentNumber: '890312445',
    verificationDigit: '0',
    name: 'Almacenes El Vaticano & Cía S. en C.',
    city: 'Cali (Valle)',
    email: 'cuentas@elvaticano.co',
    defaultPaymentTerms: 'Crédito 15 días',
  },
  {
    id: 'cli-004',
    documentType: 'NIT',
    documentNumber: '900887412',
    verificationDigit: '5',
    name: 'Gran Distribuidora Religiosa del Centro SAS',
    city: 'Bogotá D.C. (Paloquemao)',
    email: 'compras@distridelcentro.com',
    defaultPaymentTerms: 'Contado',
  },
  {
    id: 'cli-005',
    documentType: 'NIT',
    documentNumber: '860104550',
    verificationDigit: '1',
    name: 'Parroquia San Juan Bautista de Chía',
    city: 'Chía (Cundinamarca)',
    email: 'administracion@parroquiachia.org',
    defaultPaymentTerms: 'Contado',
  },
  {
    id: 'cli-006',
    documentType: 'NIT',
    documentNumber: '800231994',
    verificationDigit: '8',
    name: 'Cadena de Supermercados Populares del Llano',
    city: 'Villavicencio (Meta)',
    email: 'recepcionfe@superpopulares.com',
    defaultPaymentTerms: 'Crédito 30 días',
  },
]

export function formatClientDocument(docNumber: string, dv?: string): string {
  if (!docNumber) return ''
  if (docNumber.includes('-')) return docNumber
  const digits = docNumber.replace(/\D/g, '')
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return dv ? `${formatted}-${dv}` : formatted
}

export function normalizeNitDigits(doc: string): string {
  const beforeDash = doc.split('-')[0] ?? doc
  return beforeDash.replace(/\D/g, '')
}

/** Formatea el resumen compacto de una caja mixta: "Caja 1 de 3: 20 Velón 3D + 30 Velón 7P — Lote PEPS: ..." */
export function formatBoxSummaryLine(box: PackingBox, totalBoxes: number): string {
  const labelPrefix = `Caja ${box.boxNumber} de ${Math.max(1, totalBoxes)}`
  if (box.items.length === 0) {
    return `${labelPrefix}: Sin ítems registrados`
  }
  const itemsDesc = box.items
    .map((item) => {
      const cleanName = item.productName.replace(/^Producto\s+\d+:\s*/i, '')
      return `${formatNumber(item.quantityBase)} ${cleanName}`
    })
    .join(' + ')
  const uniqueBatches = Array.from(new Set(box.items.map((item) => item.batchNumber)))
  const batchSuffix =
    uniqueBatches.length === 1
      ? `Lote PEPS asignado (${uniqueBatches[0]})`
      : `Lotes PEPS asignados (${uniqueBatches.join(', ')})`
  return `${labelPrefix}: ${itemsDesc} — ${batchSuffix}`
}

export function computeTrafficLight(
  remainingDays: number,
  overallProgressPercentage: number
): TrafficLightStatus {
  if (overallProgressPercentage >= 100) return 'Empaque 100% completado'
  if (remainingDays <= 0) return 'Entrega hoy / Pedido vencido'
  if (remainingDays <= PREVENTIVE_DELIVERY_DAYS) return 'Entrega próxima'
  return 'En plazo normal'
}

/** Recalcula saldos de ítems, porcentaje de avance, rótulos de cajas y estado del pedido tras armar/corregir cajas. */
export function recalculateOrderFromBoxes(
  order: SalesOrder,
  rawBoxes: PackingBox[]
): SalesOrder {
  const totalBoxes = rawBoxes.length
  const normalizedBoxes: PackingBox[] = rawBoxes.map((box, index) => ({
    ...box,
    boxNumber: index + 1,
    boxLabel:
      box.items.length > 1
        ? `Caja ${index + 1} de ${totalBoxes} (Mixta)`
        : `Caja ${index + 1} de ${totalBoxes}`,
  }))

  const packedByProduct = new Map<string, number>()
  for (const box of normalizedBoxes) {
    for (const item of box.items) {
      packedByProduct.set(
        item.productId,
        (packedByProduct.get(item.productId) ?? 0) + item.quantityBase
      )
    }
  }

  const updatedItems: OrderItem[] = order.items.map((item) => {
    const packed = Math.min(item.orderedQuantityBase, packedByProduct.get(item.productId) ?? 0)
    const pending = Math.max(0, item.orderedQuantityBase - packed)
    const pct =
      item.orderedQuantityBase > 0
        ? Math.min(100, Math.round((packed / item.orderedQuantityBase) * 100))
        : 0
    return {
      ...item,
      packedQuantityBase: packed,
      pendingQuantityBase: pending,
      progressPercentage: pct,
    }
  })

  const totalOrdered = updatedItems.reduce((sum, it) => sum + it.orderedQuantityBase, 0)
  const totalPacked = updatedItems.reduce((sum, it) => sum + it.packedQuantityBase, 0)
  const overallProgress =
    totalOrdered > 0 ? Math.min(100, Math.round((totalPacked / totalOrdered) * 100)) : 0
  const allDone = updatedItems.length > 0 && updatedItems.every((it) => it.pendingQuantityBase === 0)

  let nextStatus: SalesOrder['orderStatus'] = order.orderStatus
  if (order.orderStatus !== 'Despachado/Entregado' && order.orderStatus !== 'Cancelado') {
    if (allDone) {
      nextStatus = 'Empacado completo'
    } else if (normalizedBoxes.length > 0 && totalPacked > 0) {
      nextStatus = 'Empacado parcialmente'
    } else {
      nextStatus = 'Registrado'
    }
  }

  const finalProgress = allDone ? 100 : Math.min(99, overallProgress)

  return {
    ...order,
    items: updatedItems,
    boxes: normalizedBoxes,
    totalBoxesCount: normalizedBoxes.length,
    overallProgressPercentage: totalPacked === 0 ? 0 : finalProgress,
    orderStatus: nextStatus,
    actualCompletionDate: allDone ? order.actualCompletionDate || new Date().toISOString() : undefined,
    trafficLightStatus: computeTrafficLight(order.remainingDays, allDone ? 100 : finalProgress),
  }
}

export interface ReceivableRecord {
  id: string
  invoiceNumber: string
  originOrderNumber: string
  clientName: string
  clientNit: string
  issueDate: string
  dueDate: string
  creditTerms: string
  totalAmountCOP: number
  paidAmountCOP: number
  pendingBalanceCOP: number
  overdueDays: number
  agingCategory: 'Corriente' | '1-30 días' | '31-60 días' | '61-90 días' | '>90 días'
  status: 'Al Día' | 'Vence en ≤3 días' | 'En Mora' | 'Pagada'
  hasCommercialBlock: boolean
  exceptionAuthorized?: boolean
  exceptionAuthorizedBy?: string
  exceptionReason?: string
  exceptionAuthorizedAt?: string
}

export interface CollectionRecord {
  id: string
  receivableId: string
  invoiceNumber: string
  clientName: string
  operationType: 'ABONO_CARTERA' | 'ANTICIPO_280505'
  pucAccount: string
  paymentMethod: string
  reference: string
  amountCOP: number
  date: string
  notes: string
}

export interface CommercialAuditEvent {
  id: string
  action: 'COMMERCIAL_BLOCK_OVERRIDE' | 'RECEIVABLE_PAYMENT' | 'FEDV_ISSUED'
  entity: string
  entityId: string
  details: string
  userName: string
  userRole: string
  createdAt: string
}
