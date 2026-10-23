import { z } from 'zod'

// -----------------------------------------------------------------------------
// 1. ADMINISTRACIÓN: Usuarios y Roles Ficticios
// -----------------------------------------------------------------------------
export const mockUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  assignedBranch: z.string(),
  costCenter: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
})
export type MockUser = z.infer<typeof mockUserSchema>

// -----------------------------------------------------------------------------
// 2. INVENTARIOS: Productos terminados, materias primas y lotes
// -----------------------------------------------------------------------------
export const inventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  category: z.enum(['Producto terminado', 'Materia prima', 'Insumo']),
  baseUnit: z.string(), // "kg", "unidad", "metro"
  commercialPresentation: z.string(), // "Caja x 24 un", "Bulto x 25 kg", "Carrete 500 m"
  baseUnitEquivalent: z.number().positive(),
  batchNumber: z.string(),
  productionDate: z.string(), // ISO date
  currentStock: z.number().nonnegative(),
  minimumStock: z.number().nonnegative(),
  warehouseLocation: z.string(),
  unitCostCOP: z.number().int().nonnegative(),
})
export type InventoryItem = z.infer<typeof inventoryItemSchema>

// -----------------------------------------------------------------------------
// 3. PRODUCCIÓN: Órdenes de fabricación y formulaciones
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
})
export type ProductionOrder = z.infer<typeof productionOrderSchema>

// -----------------------------------------------------------------------------
// 4. COMPRAS: Órdenes de compra y proveedores
// -----------------------------------------------------------------------------
export const purchaseOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  supplierName: z.string(),
  supplierNit: z.string(),
  itemCategory: z.string(),
  itemsDescription: z.string(),
  totalAmountCOP: z.number().int().positive(),
  issueDate: z.string(),
  expectedDeliveryDate: z.string(),
  paymentTerms: z.string(),
  paymentStatus: z.enum(['Pagado', 'Pendiente', 'Abono parcial']),
  orderStatus: z.enum(['Recibido conforme', 'En tránsito', 'Aprobada']),
})
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>

// -----------------------------------------------------------------------------
// 5. VENTAS: Pedidos comerciales y cuentas por cobrar
// -----------------------------------------------------------------------------
export const salesOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  clientName: z.string(),
  clientDocument: z.string(),
  itemsSummary: z.string(),
  totalAmountCOP: z.number().int().positive(),
  pendingBalanceCOP: z.number().int().nonnegative(),
  orderDate: z.string(),
  paymentTerms: z.enum(['Contado', 'Crédito 15 días', 'Crédito 30 días', 'Crédito 45 días']),
  paymentStatus: z.enum(['Al día', 'Pendiente', 'Mora 15 días']),
  deliveryStatus: z.enum(['Despachado', 'En preparación', 'Entregado']),
})
export type SalesOrder = z.infer<typeof salesOrderSchema>

// -----------------------------------------------------------------------------
// 6. CONTABILIDAD: Plan Único de Cuentas (PUC) y saldos
// -----------------------------------------------------------------------------
export const accountEntrySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  accountType: z.enum(['Activo', 'Pasivo', 'Patrimonio', 'Ingresos', 'Gastos', 'Costos de producción']),
  debitCOP: z.number().int().nonnegative(),
  creditCOP: z.number().int().nonnegative(),
  currentBalanceCOP: z.number().int(),
  costCenter: z.string(),
  lastUpdated: z.string(),
})
export type AccountEntry = z.infer<typeof accountEntrySchema>

// -----------------------------------------------------------------------------
// 7. DOCUMENTOS ELECTRÓNICOS DIAN
// -----------------------------------------------------------------------------
export const dianDocumentSchema = z.object({
  id: z.string(),
  documentNumber: z.string(),
  prefix: z.string(),
  documentType: z.enum(['Factura electrónica de venta', 'Nómina electrónica', 'Documento soporte']),
  recipientName: z.string(),
  recipientNit: z.string(),
  issueDate: z.string(),
  transmissionDate: z.string(),
  cufeOrCune: z.string(),
  totalAmountCOP: z.number().int().positive(),
  dianStatus: z.enum(['Aceptada', 'Rechazada', 'Pendiente']),
})
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
  contractType: z.enum(['Término indefinido', 'Término fijo 1 año', 'Obra o labor']),
  baseSalaryCOP: z.number().int().positive(),
  hireDate: z.string(),
  eps: z.string(),
  pensionFund: z.string(),
  status: z.enum(['Activo', 'Inactivo', 'En vacaciones']),
})
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
  shareType: z.string(),
  entryDate: z.string(),
  lastMinuteRecord: z.string(),
  status: z.enum(['Activo', 'Cesión en trámite']),
})
export type ShareholderRecord = z.infer<typeof shareholderRecordSchema>

// -----------------------------------------------------------------------------
// 10. REPORTES: Catálogo de informes operativos y gerenciales
// -----------------------------------------------------------------------------
export const reportDefinitionSchema = z.object({
  id: z.string(),
  reportCode: z.string(),
  title: z.string(),
  category: z.enum(['Ventas y Cartera', 'Inventarios y Lotes', 'Producción y Costos', 'Contable y Fiscal', 'Compras']),
  description: z.string(),
  frequency: z.enum(['Diario', 'Semanal', 'Mensual', 'Bajo demanda']),
  exportFormats: z.array(z.string()),
  authorizedRole: z.string(),
  estimatedExecutionTime: z.string(),
})
export type ReportDefinition = z.infer<typeof reportDefinitionSchema>
