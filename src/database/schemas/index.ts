import { z } from 'zod'

// -----------------------------------------------------------------------------
// 1. ADMINISTRACIÓN: Usuarios y Roles Ficticios
// -----------------------------------------------------------------------------
export const mockUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  assignedBranch: z.string().optional().default('Planta Principal Funza'),
  costCenter: z.string().optional().default('CC-100 Producción'),
  isActive: z.boolean(),
  createdAt: z.string(),
})
export type MockUser = z.infer<typeof mockUserSchema>

export const auditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  createdAt: z.string(),
})
export type AuditLogEntry = z.infer<typeof auditLogSchema>

export const permissionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  module: z.string(),
  description: z.string().nullable().optional(),
})
export type PermissionEntry = z.infer<typeof permissionSchema>

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  permissions: z.array(permissionSchema).optional(),
})
export type RoleEntry = z.infer<typeof roleSchema>


// -----------------------------------------------------------------------------
// 2. INVENTARIOS: Productos terminados, materias primas y lotes
// -----------------------------------------------------------------------------
export const inventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.enum(['Producto terminado', 'Materia prima', 'Insumo', 'Producto en proceso']),
  baseUnit: z.string(), // "kg", "unidad", "metro"
  commercialPresentation: z.string(), // "Caja x 24 un", "Bulto x 25 kg", "Carrete 500 m"
  baseUnitEquivalent: z.number().positive(),
  batchNumber: z.string(),
  productionDate: z.string(), // ISO date
  currentStock: z.number().nonnegative(),
  minimumStock: z.number().nonnegative(),
  warehouseLocation: z.string(),
  unitCostCOP: z.number().int().nonnegative(),
  pucAccount: z.string().optional(), // ej. "1410 - Productos en proceso"
})
export type InventoryItem = z.infer<typeof inventoryItemSchema>

// -----------------------------------------------------------------------------
// 1B. ADMINISTRACIÓN EXTENDIDA: Terceros, Impuestos y Consecutivos
// -----------------------------------------------------------------------------
export const thirdPartySchema = z.object({
  id: z.string(),
  personType: z.enum(['Jurídica (NIT)', 'Natural (CC)']),
  documentNumber: z.string(),
  verificationDigit: z.string().optional(),
  nameOrBusinessName: z.string(),
  tradeName: z.string().optional(),
  municipality: z.string(),
  department: z.string().default('Cundinamarca'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  taxClassification: z.enum(['Ordinario (05)', 'Simple RST (47)', 'Gran Contribuyente (13)']),
  isIvaResponsible: z.boolean().default(true), // Responsable de IVA (48)
  isWithholdingAgent: z.boolean().default(false), // Agente Retenedor (07)
  isSelfWithholding: z.boolean().default(false), // Autorretenedor
  isInvoiceObligated: z.boolean().default(true), // Obligado a facturar (52)
  creditDays: z.number().int().nonnegative().default(0), // 0, 15, 30, 45, 60
  creditLimitCOP: z.number().int().nonnegative().default(0),
  isExogenaComplete: z.boolean().default(true),
})
export type ThirdParty = z.infer<typeof thirdPartySchema>

export const taxParamSchema = z.object({
  id: z.string(),
  code: z.string(),
  concept: z.string(),
  taxType: z.enum(['IVA', 'Retefuente', 'ReteIVA', 'ReteICA', 'Autorretención Renta']),
  municipality: z.string().default('Nacional'),
  baseMinCOP: z.number().int().nonnegative(),
  ratePercent: z.number().nonnegative(),
  debitPucAccount: z.string(),
  creditPucAccount: z.string(),
})
export type TaxParam = z.infer<typeof taxParamSchema>

export const consecutiveParamSchema = z.object({
  id: z.string(),
  documentType: z.string(),
  prefix: z.string(),
  rangeFrom: z.number().int().positive(),
  rangeTo: z.number().int().positive(),
  currentNumber: z.number().int().positive(),
  dianResolution: z.string(),
  expirationDate: z.string(), // ISO date
  remainingDays: z.number().int(),
  usedPercentage: z.number().min(0).max(100),
})
export type ConsecutiveParam = z.infer<typeof consecutiveParamSchema>


// -----------------------------------------------------------------------------
// 3. PRODUCCIÓN: Órdenes de fabricación, costos estimados vs reales y fichas
// -----------------------------------------------------------------------------
export const productionOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  productName: z.string(),
  formulaCode: z.string(),
  plannedQuantity: z.number().int().positive(),
  producedQuantity: z.number().int().nonnegative(),
  wasteKg: z.number().nonnegative(),
  targetBatch: z.string(),
  startDate: z.string(),
  status: z.enum(['En proceso', 'Terminada', 'Programada', 'Suspendida']),
  estimatedCostCOP: z.number().int().positive(),
  realCostCOP: z.number().int().nonnegative().optional(),
  accountingStatus: z.enum(['Programada', 'En proceso (PUC 1410)', 'Terminada en Bodega (PUC 1430)']).default('Programada'),
})
export type ProductionOrder = z.infer<typeof productionOrderSchema>

// -----------------------------------------------------------------------------
// 4. COMPRAS: Órdenes de compra, cuentas por pagar y liquidación tributaria
// -----------------------------------------------------------------------------
export const purchaseOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  supplierInvoiceNumber: z.string().optional(),
  entryBatch: z.string().optional(),
  supplierName: z.string(),
  supplierNit: z.string(),
  itemCategory: z.string(),
  itemsDescription: z.string(),
  subtotalCOP: z.number().int().positive().optional(),
  ivaCOP: z.number().int().nonnegative().optional(),
  withholdingsCOP: z.number().int().nonnegative().optional(),
  totalAmountCOP: z.number().int().positive(),
  paidAmountCOP: z.number().int().nonnegative().default(0),
  pendingBalanceCOP: z.number().int().nonnegative().default(0),
  issueDate: z.string(),
  expectedDeliveryDate: z.string(),
  dueDate: z.string().optional(),
  paymentTerms: z.string(),
  paymentStatus: z.string(),
  orderStatus: z.string(),
}).passthrough()
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>

// -----------------------------------------------------------------------------
// 5. VENTAS: Gestor de Pedidos Complejo V2 (Empaque progresivo y cajas mixtas)
// -----------------------------------------------------------------------------
export const orderStatusSchema = z.enum([
  'Registrado',
  'En alistamiento',
  'Empacado parcialmente',
  'Empacado completo',
  'Despachado/Entregado',
  'Cancelado',
])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const trafficLightStatusSchema = z.enum([
  'En plazo normal',
  'Entrega próxima',
  'Entrega hoy / Pedido vencido',
  'Empaque 100% completado',
])
export type TrafficLightStatus = z.infer<typeof trafficLightStatusSchema>

export const orderOriginSchema = z.enum(['ERP', 'TIENDA_WEB'])
export type OrderOrigin = z.infer<typeof orderOriginSchema>

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productSku: z.string(),
  productName: z.string(),
  commercialPresentation: z.string(), // "Unidades", "Docenas (12 uds)", "Caja x 24 un", etc.
  unitsPerPresentation: z.number().positive(),
  orderedQuantityCommercial: z.number().positive(),
  orderedQuantityBase: z.number().positive(),
  packedQuantityBase: z.number().nonnegative(),
  pendingQuantityBase: z.number().nonnegative(),
  progressPercentage: z.number().min(0).max(100),
  customizationNote: z.string().optional(), // Detalle / Personalización (Color, Aroma, Diseño o Dedicatoria)
})
export type OrderItem = z.infer<typeof orderItemSchema>

export const packingBoxItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantityBase: z.number().positive(),
  batchNumber: z.string(),
})
export type PackingBoxItem = z.infer<typeof packingBoxItemSchema>

export const packingBoxSchema = z.object({
  id: z.string(),
  boxNumber: z.number().int().positive(),
  boxLabel: z.string(), // "Caja 1 de 3", "Caja #1"
  packingDate: z.string(),
  packerUser: z.string(),
  items: z.array(packingBoxItemSchema),
  weightKg: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  isLocked: z.boolean().default(false),
})
export type PackingBox = z.infer<typeof packingBoxSchema>

export const salesOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(), // "PED-2026-0001"
  origin: orderOriginSchema.default('ERP'),
  webOrderNumber: z.string().optional(), // "WEB-1045"
  clientName: z.string(),
  clientDocument: z.string(),
  destinationCity: z.string().default('Bogotá D.C.'),
  receptionDate: z.string(), // ISO date
  estimatedDeliveryDate: z.string(), // ISO date
  actualCompletionDate: z.string().optional(),
  totalAgreedDays: z.number().int().nonnegative(),
  elapsedDays: z.number().int().nonnegative(),
  remainingDays: z.number().int(), // Negativo si está retrasado
  trafficLightStatus: trafficLightStatusSchema,
  orderStatus: orderStatusSchema,
  overallProgressPercentage: z.number().min(0).max(100),
  totalBoxesCount: z.number().int().nonnegative(),
  itemsSummary: z.string(),
  totalAmountCOP: z.number().int().positive(),
  pendingBalanceCOP: z.number().int().nonnegative(),
  paymentTerms: z.enum(['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 45 días']),
  paymentStatus: z.enum(['Al día', 'Pendiente', 'Mora 15 días']),
  items: z.array(orderItemSchema).default([]),
  boxes: z.array(packingBoxSchema).default([]),
  rescheduleReason: z.string().optional(),
  shippingCarrier: z.string().optional(),
  trackingNumber: z.string().optional(),
})
export type SalesOrder = z.infer<typeof salesOrderSchema>

// -----------------------------------------------------------------------------
// 6. CONTABILIDAD: Plan Único de Cuentas (PUC) y saldos
// -----------------------------------------------------------------------------
export const accountEntrySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  accountType: z.string(),
  debitCOP: z.number().int().nonnegative(),
  creditCOP: z.number().int().nonnegative(),
  currentBalanceCOP: z.number().int(),
  costCenter: z.string(),
  lastUpdated: z.string(),
}).passthrough()
export type AccountEntry = z.infer<typeof accountEntrySchema>

// -----------------------------------------------------------------------------
// 7. DOCUMENTOS ELECTRÓNICOS DIAN
// -----------------------------------------------------------------------------
export const dianDocumentSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),
  prefix: z.string(),
  documentType: z.string(),
  recipientName: z.string(),
  recipientNit: z.string(),
  issueDate: z.string(),
  transmissionDate: z.string(),
  cufeOrCune: z.string(),
  totalAmountCOP: z.number().int().positive(),
  dianStatus: z.string(),
  rejectionReason: z.string().optional(),
  xmlSignedUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  dianResponseXmlUrl: z.string().optional(),
}).passthrough()
export type DianDocument = z.infer<typeof dianDocumentSchema>

// -----------------------------------------------------------------------------
// 8. NÓMINA Y SEGURIDAD SOCIAL: Trabajadores de planta y contratos
// -----------------------------------------------------------------------------
export const payrollWorkerSchema = z.object({
  id: z.string(),
  employeeCode: z.string(),
  fullName: z.string(),
  nationalIdMasked: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  costCenter: z.string().optional(), // 'CC-100 MOD (Planta)' o 'CC-200 Administración'
  contractType: z.string(),
  baseSalaryCOP: z.number().nonnegative(),
  transportAllowanceCOP: z.number().nonnegative().optional(),
  smmlvBase2026: z.number().optional(),
  arlRiskLevel: z.string().optional(), // 'Riesgo III (2.436%)' o 'Riesgo I (0.522%)'
  art114Exempt: z.boolean().optional(), // Exonerado parafiscales SENA/ICBF/Salud (< 10 SMMLV)
  hireDate: z.string(),
  eps: z.string(),
  pensionFund: z.string(),
  status: z.string(),
}).passthrough()
export type PayrollWorker = z.infer<typeof payrollWorkerSchema>

// -----------------------------------------------------------------------------
// 9. LIBROS SOCIETARIOS: Accionistas y participaciones
// -----------------------------------------------------------------------------
export const shareholderRecordSchema = z.object({
  id: z.string(),
  shareholderName: z.string(),
  documentNumberMasked: z.string(),
  shareCount: z.number().int().nonnegative(),
  sharePercentage: z.number().nonnegative(),
  nominalValuePerShareCOP: z.number().int().positive(),
  totalCapitalCOP: z.number().int().nonnegative(),
  subscribedCapitalCOP: z.number().int().nonnegative().optional(),
  paidCapitalCOP: z.number().int().nonnegative().optional(),
  pendingCapitalCOP: z.number().int().nonnegative().optional(),
  paymentDeadline: z.string().optional(),
  paymentStatus: z.string().optional(),
  shareCertificateNumber: z.string().optional(),
  shareType: z.string(),
  entryDate: z.string(),
  lastMinuteRecord: z.string(),
  status: z.string(),
  registryNotes: z.string().optional(),
}).passthrough()
export type ShareholderRecord = z.infer<typeof shareholderRecordSchema>

// -----------------------------------------------------------------------------
// 10. REPORTES: Catálogo de informes operativos y gerenciales
// -----------------------------------------------------------------------------
export const reportDefinitionSchema = z.object({
  id: z.string(),
  reportCode: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  frequency: z.string(),
  exportFormats: z.array(z.string()),
  authorizedRole: z.string(),
  estimatedExecutionTime: z.string(),
})
export type ReportDefinition = z.infer<typeof reportDefinitionSchema>
