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
  type AuditLogEntry,
  type RoleEntry,
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

const MOCK_ROLES: RoleEntry[] = [
  {
    id: 'role-admin',
    name: 'ADMIN',
    description: 'Administrador / Gerencia. Control total sobre pedidos, reprogramaciones, cancelaciones, auditoría y facturación.',
  },
  {
    id: 'role-ventas',
    name: 'VENTAS',
    description: 'Ventas / Comercial. Crear pedidos manuales, gestionar pedidos web, reprogramar con motivo obligatorio y facturar.',
  },
  {
    id: 'role-planta',
    name: 'JEFE_PLANTA',
    description: 'Jefe de Producción / Planta. Tablero multipedido, alistamiento simultáneo, empaque e impresión de rótulos.',
  },
  {
    id: 'role-alistamiento',
    name: 'ALISTAMIENTO',
    description: 'Encargado de Alistamiento. Crear Cajas de Empaque, registrar unidades por lote PEPS y corregir conteos en planta.',
  },
]

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    action: 'USER_CREATED',
    entity: 'User',
    entityId: 'usr-006',
    details: 'Creación de colaborador: Diana Carolina Vargas (Analista de Compras)',
    ipAddress: '190.25.102.14 (Bogotá D.C.)',
    userId: 'usr-admin',
    userName: 'Administrador San Isaac',
    createdAt: '2026-10-28T14:32:10.000Z',
  },
  {
    id: 'log-002',
    action: 'STATUS_TOGGLED',
    entity: 'User',
    entityId: 'usr-005',
    details: 'Activación de acceso operativo: Héctor Fabio Benítez (Supervisor de Fundición)',
    ipAddress: '190.25.102.14 (Bogotá D.C.)',
    userId: 'usr-admin',
    userName: 'Administrador San Isaac',
    createdAt: '2026-10-27T09:15:22.000Z',
  },
  {
    id: 'log-003',
    action: 'ROLE_ASSIGNED',
    entity: 'RolePermission',
    entityId: 'role-ventas',
    details: 'Asignación de permiso orders.reprogram con justificación obligatoria a rol VENTAS',
    ipAddress: '190.14.88.50 (Funza)',
    userId: 'usr-admin',
    userName: 'Administrador San Isaac',
    createdAt: '2026-10-26T16:45:00.000Z',
  },
  {
    id: 'log-004',
    action: 'BACKUP_SYNC',
    entity: 'SystemBackup',
    entityId: 'backup-20261028',
    details: 'Copia de seguridad nocturna automatizada completada hacia Google Drive (42.8 MB)',
    ipAddress: '127.0.0.1 (Worker)',
    userId: null,
    userName: 'Sistema Automático',
    createdAt: '2026-10-28T07:00:15.000Z',
  },
]

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

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return MOCK_AUDIT_LOGS
  }

  async getRoles(): Promise<RoleEntry[]> {
    return MOCK_ROLES
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
