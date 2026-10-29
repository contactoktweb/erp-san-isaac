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
} from '../schemas'

export interface IAdministrationRepository {
  getUsers(): Promise<MockUser[]>
  getAuditLogs(): Promise<AuditLogEntry[]>
  getRoles(): Promise<RoleEntry[]>
}

export interface IInventoryRepository {
  getItems(): Promise<InventoryItem[]>
}

export interface IProductionRepository {
  getOrders(): Promise<ProductionOrder[]>
}

export interface IPurchasingRepository {
  getOrders(): Promise<PurchaseOrder[]>
}

export interface ISalesRepository {
  getOrders(): Promise<SalesOrder[]>
}

export interface IAccountingRepository {
  getAccounts(): Promise<AccountEntry[]>
}

export interface IDianRepository {
  getDocuments(): Promise<DianDocument[]>
}

export interface IPayrollRepository {
  getWorkers(): Promise<PayrollWorker[]>
}

export interface ICorporateRepository {
  getShareholders(): Promise<ShareholderRecord[]>
}

export interface IReportsRepository {
  getReports(): Promise<ReportDefinition[]>
}
