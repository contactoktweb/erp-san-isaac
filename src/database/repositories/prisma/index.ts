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
} from '../../schemas'
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
} from '../types'

/**
 * Punto de extensión para la implementación real con Prisma ORM en Fase 2.
 * Al activarse DATA_SOURCE="prisma", se conectará a las tablas definitivas de Supabase.
 */
function throwNotImplemented(): never {
  throw new Error('Fuente de datos no implementada todavía')
}

export class PrismaAdministrationRepository implements IAdministrationRepository {
  async getUsers(): Promise<MockUser[]> {
    return throwNotImplemented()
  }
}

export class PrismaInventoryRepository implements IInventoryRepository {
  async getItems(): Promise<InventoryItem[]> {
    return throwNotImplemented()
  }
}

export class PrismaProductionRepository implements IProductionRepository {
  async getOrders(): Promise<ProductionOrder[]> {
    return throwNotImplemented()
  }
}

export class PrismaPurchasingRepository implements IPurchasingRepository {
  async getOrders(): Promise<PurchaseOrder[]> {
    return throwNotImplemented()
  }
}

export class PrismaSalesRepository implements ISalesRepository {
  async getOrders(): Promise<SalesOrder[]> {
    return throwNotImplemented()
  }
}

export class PrismaAccountingRepository implements IAccountingRepository {
  async getAccounts(): Promise<AccountEntry[]> {
    return throwNotImplemented()
  }
}

export class PrismaDianRepository implements IDianRepository {
  async getDocuments(): Promise<DianDocument[]> {
    return throwNotImplemented()
  }
}

export class PrismaPayrollRepository implements IPayrollRepository {
  async getWorkers(): Promise<PayrollWorker[]> {
    return throwNotImplemented()
  }
}

export class PrismaCorporateRepository implements ICorporateRepository {
  async getShareholders(): Promise<ShareholderRecord[]> {
    return throwNotImplemented()
  }
}

export class PrismaReportsRepository implements IReportsRepository {
  async getReports(): Promise<ReportDefinition[]> {
    return throwNotImplemented()
  }
}
