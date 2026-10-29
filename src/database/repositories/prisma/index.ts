import { prisma } from '@/lib/prisma'
import type {
  AccountEntry,
  DianDocument,
  InventoryItem,
  MockUser,
  AuditLogEntry,
  RoleEntry,
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
 * Al activarse DATA_SOURCE="prisma", se conecta a las tablas definitivas de Supabase.
 */
function throwNotImplemented(): never {
  throw new Error('Fuente de datos no implementada todavía')
}

export class PrismaAdministrationRepository implements IAdministrationRepository {
  async getUsers(): Promise<MockUser[]> {
    try {
      const records = await prisma.user.findMany({
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      })
      return records.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.name,
        assignedBranch: u.assignedBranch || 'Planta Principal Funza',
        costCenter: u.costCenter || 'CC-100 Producción',
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      }))
    } catch (error) {
      console.error('[PrismaAdministrationRepository] Error al consultar usuarios:', error)
      return []
    }
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const records = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      return records.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        userId: log.userId,
        userName: log.userName,
        createdAt: log.createdAt.toISOString(),
      }))
    } catch (error) {
      console.error('[PrismaAdministrationRepository] Error al consultar auditoría:', error)
      return []
    }
  }

  async getRoles(): Promise<RoleEntry[]> {
    try {
      const records = await prisma.role.findMany({
        include: {
          permissions: {
            include: { permission: true },
          },
        },
        orderBy: { name: 'asc' },
      })
      return records.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions.map((rp) => ({
          id: rp.permission.id,
          code: rp.permission.code,
          name: rp.permission.name,
          module: rp.permission.module,
          description: rp.permission.description,
        })),
      }))
    } catch (error) {
      console.error('[PrismaAdministrationRepository] Error al consultar roles:', error)
      return []
    }
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
