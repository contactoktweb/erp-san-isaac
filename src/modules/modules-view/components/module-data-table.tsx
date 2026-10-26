import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'
import { DemoDataNotice } from './demo-data-notice'
import { SalesOrdersComplexTable } from './sales-orders-complex-table'

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
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Colaborador</th>
              <th scope="col" className="px-4 py-3">Cargo</th>
              <th scope="col" className="px-4 py-3">Correo corporativo</th>
              <th scope="col" className="px-4 py-3">Sede</th>
              <th scope="col" className="px-4 py-3">Centro de costos</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">F. Creación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.assignedBranch}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.costCenter}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.isActive ? 'success' : 'muted'} className="text-[0.6875rem]">
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDate(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'inventarios': {
      const items = await getInventoryItems()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">SKU / Artículo</th>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="px-4 py-3">Presentación</th>
              <th scope="col" className="px-4 py-3 text-right">Stock actual</th>
              <th scope="col" className="px-4 py-3">Lote</th>
              <th scope="col" className="px-4 py-3">F. Producción</th>
              <th scope="col" className="px-4 py-3">Bodega</th>
              <th scope="col" className="px-4 py-3 text-right">Costo unitario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">{it.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{it.sku}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[0.6875rem]">
                    {it.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{it.commercialPresentation}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatNumber(it.currentStock)} {it.baseUnit}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{it.batchNumber}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDate(it.productionDate)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{it.warehouseLocation}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                  {formatCurrency(it.unitCostCOP)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'produccion': {
      const orders = await getProductionOrders()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">No. Orden</th>
              <th scope="col" className="px-4 py-3">Producto a fabricar</th>
              <th scope="col" className="px-4 py-3">Fórmula</th>
              <th scope="col" className="px-4 py-3 text-right">Prog. / Producido</th>
              <th scope="col" className="px-4 py-3 text-right">Merma (kg)</th>
              <th scope="col" className="px-4 py-3">Lote asignado</th>
              <th scope="col" className="px-4 py-3">F. Inicio</th>
              <th scope="col" className="px-4 py-3 text-right">Costo estimado</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{o.orderNumber}</td>
                <td className="px-4 py-3 text-foreground font-medium">{o.productName}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.formulaCode}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{formatNumber(o.producedQuantity)}</span> / {formatNumber(o.plannedQuantity)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {o.wasteKg > 0 ? `${o.wasteKg} kg` : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.targetBatch}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDate(o.startDate)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-foreground">
                  {formatCurrency(o.estimatedCostCOP)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'compras': {
      const orders = await getPurchaseOrders()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">No. Orden</th>
              <th scope="col" className="px-4 py-3">Proveedor / NIT</th>
              <th scope="col" className="px-4 py-3">Insumos solicitados</th>
              <th scope="col" className="px-4 py-3">Emisión / Entrega</th>
              <th scope="col" className="px-4 py-3">Plazo</th>
              <th scope="col" className="px-4 py-3 text-right">Valor total</th>
              <th scope="col" className="px-4 py-3">Pago</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{po.orderNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{po.supplierName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{po.supplierNit}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{po.itemsDescription}</td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  <div>{formatDate(po.issueDate)}</div>
                  <div className="text-[0.6875rem] text-muted-foreground/80">Llegada: {formatDate(po.expectedDeliveryDate)}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{po.paymentTerms}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(po.totalAmountCOP)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={po.paymentStatus === 'Pagado' ? 'success' : 'outline'} className="text-[0.6875rem]">
                    {po.paymentStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={po.orderStatus === 'Recibido conforme' ? 'success' : 'info'} className="text-[0.6875rem]">
                    {po.orderStatus}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'ventas': {
      const orders = await getSalesOrders()
      return <SalesOrdersComplexTable orders={orders} />
    }

    case 'contabilidad': {
      const accounts = await getAccountingAccounts()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Código PUC</th>
              <th scope="col" className="px-4 py-3">Nombre de la cuenta</th>
              <th scope="col" className="px-4 py-3">Clasificación</th>
              <th scope="col" className="px-4 py-3">Centro costos</th>
              <th scope="col" className="px-4 py-3 text-right">Débito acumulado</th>
              <th scope="col" className="px-4 py-3 text-right">Crédito acumulado</th>
              <th scope="col" className="px-4 py-3 text-right">Saldo neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {accounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{acc.code}</td>
                <td className="px-4 py-3 font-medium text-foreground">{acc.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[0.6875rem]">
                    {acc.accountType}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{acc.costCenter}</td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(acc.debitCOP)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(acc.creditCOP)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(acc.currentBalanceCOP)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'documentos-electronicos': {
      const docs = await getDianDocuments()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Folio DIAN</th>
              <th scope="col" className="px-4 py-3">Tipo de documento</th>
              <th scope="col" className="px-4 py-3">Adquirente / Receptor</th>
              <th scope="col" className="px-4 py-3">Emisión y Transmisión</th>
              <th scope="col" className="px-4 py-3 text-right">Total factura</th>
              <th scope="col" className="px-4 py-3">Estado DIAN</th>
              <th scope="col" className="px-4 py-3">Identificador CUFE / CUNE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {docs.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{d.documentNumber}</td>
                <td className="px-4 py-3 text-xs text-foreground font-medium">{d.documentType}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{d.recipientName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{d.recipientNit}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  <div>Emisión: {formatDate(d.issueDate)}</div>
                  <div className="text-[0.6875rem] text-muted-foreground/80">Transmisión: {formatDate(d.transmissionDate)}</div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(d.totalAmountCOP)}
                </td>
                <td className="px-4 py-3">
                  <DianStatusBadge status={d.dianStatus} />
                </td>
                <td className="px-4 py-3 font-mono text-[0.6875rem] text-muted-foreground max-w-[140px] truncate">
                  {d.cufeOrCune}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'nomina': {
      const workers = await getPayrollWorkers()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Trabajador</th>
              <th scope="col" className="px-4 py-3">Cargo y Área</th>
              <th scope="col" className="px-4 py-3">Tipo contrato</th>
              <th scope="col" className="px-4 py-3 text-right">Salario base</th>
              <th scope="col" className="px-4 py-3">Seguridad social</th>
              <th scope="col" className="px-4 py-3">F. Ingreso</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {workers.map((w) => (
              <tr key={w.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{w.employeeCode}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{w.fullName}</div>
                  <div className="font-mono text-xs text-muted-foreground">{w.nationalIdMasked}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{w.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">{w.department}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{w.contractType}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(w.baseSalaryCOP)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div>EPS: {w.eps}</div>
                  <div className="text-[0.6875rem]">Pensión: {w.pensionFund}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDate(w.hireDate)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={w.status === 'Activo' ? 'success' : 'outline'} className="text-[0.6875rem]">
                    {w.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'libros-societarios': {
      const shareholders = await getShareholderRecords()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Socio / Accionista</th>
              <th scope="col" className="px-4 py-3">Documento</th>
              <th scope="col" className="px-4 py-3 text-right">No. Acciones</th>
              <th scope="col" className="px-4 py-3 text-right">Participación %</th>
              <th scope="col" className="px-4 py-3 text-right">Valor nominal</th>
              <th scope="col" className="px-4 py-3 text-right">Capital aportado</th>
              <th scope="col" className="px-4 py-3">Acta registro</th>
              <th scope="col" className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {shareholders.map((sh) => (
              <tr key={sh.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-foreground">{sh.shareholderName}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sh.documentNumberMasked}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatNumber(sh.shareCount)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-primary">
                  {sh.sharePercentage.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(sh.nominalValuePerShareCOP)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-foreground">
                  {formatCurrency(sh.totalCapitalCOP)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{sh.lastMinuteRecord}</td>
                <td className="px-4 py-3">
                  <Badge variant={sh.status === 'Activo' ? 'success' : 'info'} className="text-[0.6875rem]">
                    {sh.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case 'reportes': {
      const reports = await getReportDefinitions()
      return (
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Código</th>
              <th scope="col" className="px-4 py-3">Nombre del informe</th>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="px-4 py-3">Descripción técnica</th>
              <th scope="col" className="px-4 py-3">Periodicidad</th>
              <th scope="col" className="px-4 py-3">Formatos</th>
              <th scope="col" className="px-4 py-3">Rol autorizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {reports.map((rep) => (
              <tr key={rep.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{rep.reportCode}</td>
                <td className="px-4 py-3 font-medium text-foreground">{rep.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[0.6875rem]">
                    {rep.category}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-sm">{rep.description}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{rep.frequency}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {rep.exportFormats.map((fmt) => (
                      <span key={fmt} className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium text-foreground">
                        {fmt}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{rep.authorizedRole}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    default:
      return null
  }
}

function OrderStatusBadge({ status }: { status: string }) {
  if (status === 'Terminada') {
    return <Badge variant="success" className="text-[0.6875rem]">Terminada</Badge>
  }
  if (status === 'En proceso') {
    return <Badge variant="info" className="text-[0.6875rem]">En proceso</Badge>
  }
  return <Badge variant="outline" className="text-[0.6875rem]">{status}</Badge>
}

function DianStatusBadge({ status }: { status: 'Aceptada' | 'Rechazada' | 'Pendiente' }) {
  if (status === 'Aceptada') {
    return <Badge variant="success" className="text-[0.6875rem]">Aceptada DIAN</Badge>
  }
  if (status === 'Rechazada') {
    return <Badge variant="danger" className="text-[0.6875rem]">Rechazada DIAN</Badge>
  }
  return <Badge variant="outline" className="text-[0.6875rem]">Pendiente DIAN</Badge>
}
