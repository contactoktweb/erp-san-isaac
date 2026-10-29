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

function safeParseArray<T>(schema: z.ZodType<T>, data: unknown, name: string): T[] {
  const result = z.array(schema).safeParse(data)
  if (!result.success) {
    console.warn(`[MockDataWarning] Validating ${name} schema had discrepancies:`, result.error.format())
    return (Array.isArray(data) ? data : []) as unknown as T[]
  }
  return result.data
}

export class MockAdministrationRepository implements IAdministrationRepository {
  async getUsers(): Promise<MockUser[]> {
    return safeParseArray(mockUserSchema, rawAdministration, 'Administration')
  }
}

export class MockInventoryRepository implements IInventoryRepository {
  async getItems(): Promise<InventoryItem[]> {
    return safeParseArray(inventoryItemSchema, rawInventory, 'Inventory')
  }
}

export class MockProductionRepository implements IProductionRepository {
  async getOrders(): Promise<ProductionOrder[]> {
    return safeParseArray(productionOrderSchema, rawProduction, 'Production')
  }
}

export class MockPurchasingRepository implements IPurchasingRepository {
  async getOrders(): Promise<PurchaseOrder[]> {
    return safeParseArray(purchaseOrderSchema, rawPurchasing, 'Purchasing')
  }
}

export class MockSalesRepository implements ISalesRepository {
  async getOrders(): Promise<SalesOrder[]> {
    return safeParseArray(salesOrderSchema, rawSales, 'Sales')
  }
}

export class MockAccountingRepository implements IAccountingRepository {
  async getAccounts(): Promise<AccountEntry[]> {
    return safeParseArray(accountEntrySchema, rawAccounting, 'Accounting')
  }
}

export class MockDianRepository implements IDianRepository {
  async getDocuments(): Promise<DianDocument[]> {
    return safeParseArray(dianDocumentSchema, rawDian, 'DIAN')
  }
}

export class MockPayrollRepository implements IPayrollRepository {
  async getWorkers(): Promise<PayrollWorker[]> {
    return safeParseArray(payrollWorkerSchema, rawPayroll, 'Payroll')
  }
}

export class MockCorporateRepository implements ICorporateRepository {
  async getShareholders(): Promise<ShareholderRecord[]> {
    return safeParseArray(shareholderRecordSchema, rawCorporate, 'Corporate')
  }
}

export class MockReportsRepository implements IReportsRepository {
  async getReports(): Promise<ReportDefinition[]> {
    return safeParseArray(reportDefinitionSchema, rawReports, 'Reports')
  }
}
