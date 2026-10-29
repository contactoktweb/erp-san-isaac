import { Card, CardContent } from '@/components/ui/card'
import {
  getAccountingAccounts,
  getAdministrationUsers,
  getDianDocuments,
  getInventoryItems,
  getPayrollWorkers,
  getProductionOrders,
  getPurchaseOrders,
  getReportDefinitions,
  getSalesOrders,
  getShareholderRecords,
} from '@/database'
import { AccountingComplexView } from './accounting-complex-view'
import { AdministrationComplexView } from './administration-complex-view'
import { CorporateComplexView } from './corporate-complex-view'
import { DemoDataNotice } from './demo-data-notice'
import { DianComplexView } from './dian-complex-view'
import { InventoryComplexView } from './inventory-complex-view'
import { PayrollComplexView } from './payroll-complex-view'
import { PosComplexView } from './pos-complex-view'
import { ProductionComplexView } from './production-complex-view'
import { PurchasingComplexView } from './purchasing-complex-view'
import { ReportsComplexView } from './reports-complex-view'
import { SalesAndReceivablesComplexView } from './sales-and-receivables-complex-view'

export async function ModuleDataTable({ slug, entityName }: { slug: string; entityName: string }) {
  return (
    <section aria-labelledby="section-entidad" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="section-entidad" className="text-lg font-semibold text-foreground">
          {entityName}
        </h2>
        <span className="text-xs text-muted-foreground font-medium">
          Registros de demostración en base local
        </span>
      </div>

      <DemoDataNotice entityName={entityName} />

      <Card className="gap-0 overflow-hidden py-0 border-border/80">
        <CardContent className="overflow-x-auto p-0">
          <EntityTableDispatcher slug={slug} />
        </CardContent>
      </Card>
    </section>
  )
}

async function EntityTableDispatcher({ slug }: { slug: string }) {
  switch (slug) {
    case 'administracion': {
      const users = await getAdministrationUsers()
      return <AdministrationComplexView users={users} />
    }

    case 'inventarios': {
      const items = await getInventoryItems()
      return <InventoryComplexView items={items} />
    }

    case 'produccion': {
      const orders = await getProductionOrders()
      return <ProductionComplexView orders={orders} />
    }

    case 'compras': {
      const orders = await getPurchaseOrders()
      return <PurchasingComplexView orders={orders} />
    }

    case 'ventas': {
      const orders = await getSalesOrders()
      return <SalesAndReceivablesComplexView orders={orders} />
    }

    case 'pos': {
      return <PosComplexView />
    }

    case 'contabilidad': {
      const accounts = await getAccountingAccounts()
      return <AccountingComplexView accounts={accounts} />
    }

    case 'documentos-electronicos': {
      const docs = await getDianDocuments()
      return <DianComplexView documents={docs} />
    }

    case 'nomina': {
      const workers = await getPayrollWorkers()
      return <PayrollComplexView workers={workers} />
    }

    case 'libros-societarios': {
      const shareholders = await getShareholderRecords()
      return <CorporateComplexView shareholders={shareholders} />
    }

    case 'reportes': {
      const reports = await getReportDefinitions()
      return <ReportsComplexView reports={reports} />
    }

    default:
      return null
  }
}
