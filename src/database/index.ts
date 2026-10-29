import {
  MockAccountingRepository,
  MockAdministrationRepository,
  MockCorporateRepository,
  MockDianRepository,
  MockInventoryRepository,
  MockPayrollRepository,
  MockProductionRepository,
  MockPurchasingRepository,
  MockReportsRepository,
  MockSalesRepository,
} from './repositories/mock'
import {
  PrismaAccountingRepository,
  PrismaAdministrationRepository,
  PrismaCorporateRepository,
  PrismaDianRepository,
  PrismaInventoryRepository,
  PrismaPayrollRepository,
  PrismaProductionRepository,
  PrismaPurchasingRepository,
  PrismaReportsRepository,
  PrismaSalesRepository,
} from './repositories/prisma'
import type {
  IAccountingRepository,
  IAdministrationRepository,
  ICorporateRepository,
  IDianRepository,
  IInventoryRepository,
  IPayrollRepository,
  IProductionRepository,
  IPurchasingRepository,
  IReportsRepository,
  ISalesRepository,
} from './repositories/types'
import type {
  AccountEntry,
  DianDocument,
  InventoryItem,
  MockUser,
  PayrollWorker,
  ProductionOrder,
  PurchaseOrder,
  ReportDefinition,
  SalesOrder,
  ShareholderRecord,
  AuditLogEntry,
  RoleEntry,
} from './schemas'

// Re-exportar tipos para consumo de componentes de UI
export * from './schemas'
export * from './repositories/types'

// Fuente de datos determinada por variable de entorno
const dataSource = (process.env.DATA_SOURCE || 'mock').toLowerCase()


// Instanciación de repositorios según la fuente de datos seleccionada
const administrationRepo: IAdministrationRepository =
  dataSource === 'mock'
    ? new MockAdministrationRepository()
    : new PrismaAdministrationRepository()

const inventoryRepo: IInventoryRepository =
  dataSource === 'mock'
    ? new MockInventoryRepository()
    : new PrismaInventoryRepository()

const productionRepo: IProductionRepository =
  dataSource === 'mock'
    ? new MockProductionRepository()
    : new PrismaProductionRepository()

const purchasingRepo: IPurchasingRepository =
  dataSource === 'mock'
    ? new MockPurchasingRepository()
    : new PrismaPurchasingRepository()

const salesRepo: ISalesRepository =
  dataSource === 'mock'
    ? new MockSalesRepository()
    : new PrismaSalesRepository()

const accountingRepo: IAccountingRepository =
  dataSource === 'mock'
    ? new MockAccountingRepository()
    : new PrismaAccountingRepository()

const dianRepo: IDianRepository =
  dataSource === 'mock'
    ? new MockDianRepository()
    : new PrismaDianRepository()

const payrollRepo: IPayrollRepository =
  dataSource === 'mock'
    ? new MockPayrollRepository()
    : new PrismaPayrollRepository()

const corporateRepo: ICorporateRepository =
  dataSource === 'mock'
    ? new MockCorporateRepository()
    : new PrismaCorporateRepository()

const reportsRepo: IReportsRepository =
  dataSource === 'mock'
    ? new MockReportsRepository()
    : new PrismaReportsRepository()

/**
 * 1. Administración del sistema: Usuarios y perfiles de acceso
 */
export async function getAdministrationUsers(): Promise<MockUser[]> {
  return administrationRepo.getUsers()
}

export async function getAdministrationAuditLogs(): Promise<AuditLogEntry[]> {
  return administrationRepo.getAuditLogs()
}

export async function getAdministrationRoles(): Promise<RoleEntry[]> {
  return administrationRepo.getRoles()
}

/**
 * 2. Inventarios: Existencias de materias primas, insumos y producto terminado
 */
export async function getInventoryItems(): Promise<InventoryItem[]> {
  return inventoryRepo.getItems()
}

/**
 * 3. Producción y costos: Órdenes de fabricación y formulaciones técnicas
 */
export async function getProductionOrders(): Promise<ProductionOrder[]> {
  return productionRepo.getOrders()
}

/**
 * 4. Compras y proveedores: Órdenes de compra y compromisos de pago
 */
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return purchasingRepo.getOrders()
}

/**
 * 5. Ventas y cartera: Pedidos comerciales y cuentas por cobrar
 */
export async function getSalesOrders(): Promise<SalesOrder[]> {
  return salesRepo.getOrders()
}

/**
 * 6. Contabilidad: Catálogo de cuentas PUC y saldos operacionales
 */
export async function getAccountingAccounts(): Promise<AccountEntry[]> {
  return accountingRepo.getAccounts()
}

/**
 * 7. Documentos electrónicos DIAN: Facturas y documentos con estado de transmisión
 */
export async function getDianDocuments(): Promise<DianDocument[]> {
  return dianRepo.getDocuments()
}

/**
 * 8. Nómina y seguridad social: Colaboradores de fábrica y condiciones contractuales
 */
export async function getPayrollWorkers(): Promise<PayrollWorker[]> {
  return payrollRepo.getWorkers()
}

/**
 * 9. Libros societarios: Accionistas de la SAS, participaciones y actas
 */
export async function getShareholderRecords(): Promise<ShareholderRecord[]> {
  return corporateRepo.getShareholders()
}

/**
 * 10. Reportes: Catálogo de informes analíticos y gerenciales
 */
export async function getReportDefinitions(): Promise<ReportDefinition[]> {
  return reportsRepo.getReports()
}
