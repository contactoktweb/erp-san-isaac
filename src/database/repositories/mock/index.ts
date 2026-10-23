import { z } from 'zod'
import rawAccounting from '../../mocks/accounting.json'
import rawAdministration from '../../mocks/administration.json'
import rawCorporate from '../../mocks/corporate.json'
import rawDian from '../../mocks/dian.json'
import rawInventory from '../../mocks/inventory.json'
import rawPayroll from '../../mocks/payroll.json'
import rawProduction from '../../mocks/production.json'
import rawPurchasing from '../../mocks/purchasing.json'
import rawReports from '../../mocks/reports.json'
import rawSales from '../../mocks/sales.json'
import {
  accountEntrySchema,
  dianDocumentSchema,
  inventoryItemSchema,
  mockUserSchema,
  payrollWorkerSchema,
  productionOrderSchema,
  purchaseOrderSchema,
  reportDefinitionSchema,
  salesOrderSchema,
  shareholderRecordSchema,
  type AccountEntry,
  type DianDocument,
  type InventoryItem,
  type MockUser,
  type PayrollWorker,
  type ProductionOrder,
  type PurchaseOrder,
  type ReportDefinition,
  type SalesOrder,
  type ShareholderRecord,
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

export class MockAdministrationRepository implements IAdministrationRepository {
  async getUsers(): Promise<MockUser[]> {
    return z.array(mockUserSchema).parse(rawAdministration)
  }
}

export class MockInventoryRepository implements IInventoryRepository {
  async getItems(): Promise<InventoryItem[]> {
    return z.array(inventoryItemSchema).parse(rawInventory)
  }
}

export class MockProductionRepository implements IProductionRepository {
  async getOrders(): Promise<ProductionOrder[]> {
    return z.array(productionOrderSchema).parse(rawProduction)
  }
}

export class MockPurchasingRepository implements IPurchasingRepository {
  async getOrders(): Promise<PurchaseOrder[]> {
    return z.array(purchaseOrderSchema).parse(rawPurchasing)
  }
}

export class MockSalesRepository implements ISalesRepository {
  async getOrders(): Promise<SalesOrder[]> {
    return z.array(salesOrderSchema).parse(rawSales)
  }
}

export class MockAccountingRepository implements IAccountingRepository {
  async getAccounts(): Promise<AccountEntry[]> {
    return z.array(accountEntrySchema).parse(rawAccounting)
  }
}

export class MockDianRepository implements IDianRepository {
  async getDocuments(): Promise<DianDocument[]> {
    return z.array(dianDocumentSchema).parse(rawDian)
  }
}

export class MockPayrollRepository implements IPayrollRepository {
  async getWorkers(): Promise<PayrollWorker[]> {
    return z.array(payrollWorkerSchema).parse(rawPayroll)
  }
}

export class MockCorporateRepository implements ICorporateRepository {
  async getShareholders(): Promise<ShareholderRecord[]> {
    return z.array(shareholderRecordSchema).parse(rawCorporate)
  }
}

export class MockReportsRepository implements IReportsRepository {
  async getReports(): Promise<ReportDefinition[]> {
    return z.array(reportDefinitionSchema).parse(rawReports)
  }
}
