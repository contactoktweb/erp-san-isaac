'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Receipt,
  Scale,
  Search,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SalesOrder } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'
import { SalesOrdersComplexTable } from './sales-orders-complex-table'

interface Props {
  orders: SalesOrder[]
}

export function SalesAndReceivablesComplexView({ orders }: Props) {
  const [activeModuleTab, setActiveModuleTab] = useState<'orders' | 'receivables'>('orders')

  // Totalizadores de cartera
  const totalReceivables = RECEIVABLES_DEMO.reduce((acc, r) => acc + r.totalAmountCOP, 0)
  const totalCollected = RECEIVABLES_DEMO.reduce((acc, r) => acc + r.paidAmountCOP, 0)
  const totalPending = RECEIVABLES_DEMO.reduce((acc, r) => acc + r.pendingBalanceCOP, 0)
  const overdueCount = RECEIVABLES_DEMO.filter((r) => r.agingCategory !== 'Corriente' && r.pendingBalanceCOP > 0).length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Botones de navegación entre Gestor de Pedidos V2 y Cartera */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeModuleTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveModuleTab('orders')}
          className="text-xs gap-1.5"
        >
          <ShoppingCart className="size-3.5" />
          Gestor de Pedidos Complejo V2 ({orders.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeModuleTab === 'receivables' ? 'default' : 'outline'}
          onClick={() => setActiveModuleTab('receivables')}
          className="text-xs gap-1.5"
        >
          <Receipt className="size-3.5" />
          Cuentas por Cobrar, Recaudos y Aging ({RECEIVABLES_DEMO.length})
        </Button>
      </div>

      {/* VISTA 1: GESTOR DE PEDIDOS COMPLEJO V2 */}
      {activeModuleTab === 'orders' && <SalesOrdersComplexTable orders={orders} />}

      {/* VISTA 2: CUENTAS POR COBRAR, RECAUDOS Y AGING DE CARTERA (NUMERAL 10) */}
      {activeModuleTab === 'receivables' && (
        <div className="flex flex-col gap-4">
          {/* Métricas Superiores de Cartera */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <DollarSign className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Total Facturado</div>
                <div className="text-base font-bold font-mono text-foreground">{formatCurrency(totalReceivables)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300/70">Recaudado / Abonos</div>
                <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalCollected)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Saldo Pendiente Cartera</div>
                <div className="text-base font-bold font-mono text-foreground">{formatCurrency(totalPending)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-50/50 p-3.5 dark:bg-rose-950/20">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-rose-900/70 dark:text-rose-300/70">Facturas en Mora</div>
                <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-400">{overdueCount} clientes</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Reglas de Cartera y Bloqueo Comercial (Numeral 10):</strong> Trazabilidad directa entre FEV y PED/WEB origen. Franjas de antigüedad de cartera (Aging: Corriente, 1-30d, 31-60d, 61-90d, &gt;90d). <em>Regla al crear pedido:</em> SI Cliente tiene mora o saldo &gt; cupo &rarr; ⚠️ Alerta de Bloqueo Comercial.
          </div>

          {/* Tabla de Cuentas por Cobrar y Aging */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Factura FEV / Origen</th>
                  <th scope="col" className="px-3 py-2.5">Cliente / Documento</th>
                  <th scope="col" className="px-3 py-2.5">Emisión &amp; Plazo</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Total Factura ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Abonos ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Saldo Pendiente</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Días Mora &amp; Aging</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Semáforo Cartera</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Acción / Recaudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {RECEIVABLES_DEMO.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-foreground">{r.invoiceNumber}</div>
                        <div className="text-[0.625rem] text-muted-foreground font-mono">
                          Pedido: {r.originOrderNumber}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-xs">
                        <div className="font-semibold text-foreground line-clamp-1">{r.clientName}</div>
                        <div className="text-[0.625rem] font-mono text-muted-foreground">{r.clientNit}</div>
                        {r.hasCommercialBlock && (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            <Lock className="size-2.5" /> ⚠️ Bloqueo Comercial (Supera Cupo)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[0.6875rem] text-muted-foreground">
                        <div>{formatDate(r.issueDate)}</div>
                        <div className="font-medium text-foreground">Plazo: {r.creditTerms}</div>
                        <div>Vence: {formatDate(r.dueDate)}</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(r.totalAmountCOP)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.paidAmountCOP)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        {r.pendingBalanceCOP > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(r.pendingBalanceCOP)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          variant={
                            r.agingCategory === 'Corriente'
                              ? 'outline'
                              : r.agingCategory === '1-30 días'
                              ? 'warning'
                              : 'danger'
                          }
                          className="text-[0.6875rem]"
                        >
                          {r.agingCategory} ({r.overdueDays}d)
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {r.status === 'Pagada' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-sky-600 dark:text-sky-400">
                            🔵 Pagada
                          </span>
                        ) : r.status === 'En Mora' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                            🔴 En Mora
                          </span>
                        ) : r.status === 'Vence en ≤3 días' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                            🟡 Vence en &le;3d
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-emerald-600 dark:text-emerald-400">
                            🟢 Al Día
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {r.pendingBalanceCOP > 0 ? (
                          <Button size="sm" variant="outline" className="text-xs gap-1">
                            <Receipt className="size-3" /> Recibo de Caja
                          </Button>
                        ) : (
                          <span className="text-[0.6875rem] text-muted-foreground">Paz y Salvo</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const RECEIVABLES_DEMO = [
  {
    id: 'rec-001',
    invoiceNumber: 'FEV-1082',
    originOrderNumber: 'PED-2026-0001',
    clientName: 'Distribuidora Religiosa El Cirio Sagrado SAS',
    clientNit: '860.002.145-2',
    issueDate: '2026-02-15T00:00:00.000Z',
    dueDate: '2026-03-15T00:00:00.000Z',
    creditTerms: 'Crédito 30 días',
    totalAmountCOP: 18500000,
    paidAmountCOP: 5000000,
    pendingBalanceCOP: 13500000,
    overdueDays: 0,
    agingCategory: 'Corriente',
    status: 'Al Día',
    hasCommercialBlock: false,
  },
  {
    id: 'rec-002',
    invoiceNumber: 'FEV-1075',
    originOrderNumber: 'WEB-1042',
    clientName: 'Parroquia Nuestra Señora de Chiquinquirá',
    clientNit: '800.125.478-9',
    issueDate: '2026-01-20T00:00:00.000Z',
    dueDate: '2026-02-05T00:00:00.000Z',
    creditTerms: 'Crédito 15 días',
    totalAmountCOP: 4200000,
    paidAmountCOP: 0,
    pendingBalanceCOP: 4200000,
    overdueDays: 35,
    agingCategory: '31-60 días',
    status: 'En Mora',
    hasCommercialBlock: true, // Supera política de mora
  },
  {
    id: 'rec-003',
    invoiceNumber: 'FEV-1085',
    originOrderNumber: 'PED-2026-0004',
    clientName: 'Almacenes El Vaticano & Cía S. en C.',
    clientNit: '890.312.445-0',
    issueDate: '2026-02-25T00:00:00.000Z',
    dueDate: '2026-03-12T00:00:00.000Z',
    creditTerms: 'Crédito 15 días',
    totalAmountCOP: 7900000,
    paidAmountCOP: 0,
    pendingBalanceCOP: 7900000,
    overdueDays: 0,
    agingCategory: 'Corriente',
    status: 'Vence en ≤3 días',
    hasCommercialBlock: false,
  },
  {
    id: 'rec-004',
    invoiceNumber: 'FEV-1060',
    originOrderNumber: 'PED-2026-0002',
    clientName: 'Librería y Santería San Miguel Arcángel',
    clientNit: '900.678.910-3',
    issueDate: '2026-01-10T00:00:00.000Z',
    dueDate: '2026-02-10T00:00:00.000Z',
    creditTerms: 'Crédito 30 días',
    totalAmountCOP: 12350000,
    paidAmountCOP: 12350000,
    pendingBalanceCOP: 0,
    overdueDays: 0,
    agingCategory: 'Corriente',
    status: 'Pagada',
    hasCommercialBlock: false,
  },
]
