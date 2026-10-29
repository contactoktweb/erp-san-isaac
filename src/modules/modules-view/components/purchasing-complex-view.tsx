'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Paperclip,
  Percent,
  Search,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PurchaseOrder } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

interface Props {
  orders: PurchaseOrder[]
}

export function PurchasingComplexView({ orders }: Props) {
  const [activeTab, setActiveTab] = useState<'cxp' | 'taxSettlement'>('cxp')

  // Totalizadores de Cuentas por Pagar
  const totalPurchases = orders.reduce((acc, o) => acc + o.totalAmountCOP, 0)
  const totalPaid = orders.reduce((acc, o) => acc + o.paidAmountCOP, 0)
  const totalPending = orders.reduce((acc, o) => acc + o.pendingBalanceCOP, 0)

  // Función de cálculo de semáforo de CXP
  const getCxpStatus = (order: PurchaseOrder) => {
    if (order.pendingBalanceCOP === 0) {
      return { label: 'Pagada', color: 'blue' as const }
    }
    if (!order.dueDate) {
      return { label: 'Al Día', color: 'green' as const }
    }

    const due = new Date(order.dueDate).getTime()
    const now = new Date('2026-03-12T00:00:00.000Z').getTime() // Fecha operativa simulada
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: `Vencida (${Math.abs(diffDays)}d mora)`, color: 'red' as const }
    }
    if (diffDays <= 5) {
      return { label: `Próxima (${diffDays}d)`, color: 'amber' as const }
    }
    return { label: `Al Día (${diffDays}d)`, color: 'green' as const }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Resumen Superior de Obligaciones Financieras (CXP) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DollarSign className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Total Compras Causadas</div>
            <div className="text-base font-bold font-mono text-foreground">{formatCurrency(totalPurchases)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300/70">Abonos y Pagos Realizados</div>
            <div className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPaid)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-50/50 p-3.5 dark:bg-rose-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-rose-900/70 dark:text-rose-300/70">Saldo Pendiente (Cuentas por Pagar)</div>
            <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-400">{formatCurrency(totalPending)}</div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas de Compras */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'cxp' ? 'default' : 'outline'}
          onClick={() => setActiveTab('cxp')}
          className="text-xs gap-1.5"
        >
          <Truck className="size-3.5" />
          Cuentas por Pagar y Semáforo de Vencimientos ({orders.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'taxSettlement' ? 'default' : 'outline'}
          onClick={() => setActiveTab('taxSettlement')}
          className="text-xs gap-1.5"
        >
          <Percent className="size-3.5" />
          Liquidación de Impuestos y Retenciones en Compras (Tarjeta #9)
        </Button>
      </div>

      {/* PESTAÑA 1: TABLA COMPLETA DE CUENTAS POR PAGAR (NUMERAL 9) */}
      {activeTab === 'cxp' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Estructura Financiera de Cuentas por Pagar y Lotes (Numeral 9):</strong> Trazabilidad con entrada en Bodega de Materias Primas, abonos (ej. anticipo del 50% en OC-2026-037) y semáforo de vencimientos (🟢 Al Día &gt;5d, 🟡 Próxima &le;5d, 🔴 Vencida/Mora, 🔵 Pagada).
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">No. Orden / Factura Proveedor</th>
                  <th scope="col" className="px-3 py-2.5">Proveedor / NIT</th>
                  <th scope="col" className="px-3 py-2.5">Lote Entrada Bodega</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Subtotal ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">IVA &amp; Retenciones</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Total Neto ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Abonos / Pagado</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Saldo Pendiente</th>
                  <th scope="col" className="px-3 py-2.5">Plazo / Vencimiento</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Semáforo CXP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => {
                  const cxp = getCxpStatus(o)
                  const subtotal = o.subtotalCOP ?? o.totalAmountCOP
                  const iva = o.ivaCOP ?? 0
                  const withh = o.withholdingsCOP ?? 0

                  return (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-foreground">{o.orderNumber}</div>
                        <div className="text-[0.625rem] text-muted-foreground font-mono">
                          {o.supplierInvoiceNumber || 'Sin factura adjunta'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 max-w-xs">
                        <div className="font-semibold text-foreground line-clamp-1">{o.supplierName}</div>
                        <div className="text-[0.625rem] font-mono text-muted-foreground">{o.supplierNit}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="font-mono text-[0.6875rem]">
                          {o.entryBatch || 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[0.6875rem]">
                        <div className="text-emerald-700 dark:text-emerald-400">+{formatCurrency(iva)} (IVA)</div>
                        <div className="text-rose-700 dark:text-rose-400">-{formatCurrency(withh)} (Rete)</div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                        {formatCurrency(o.totalAmountCOP)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(o.paidAmountCOP)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        {o.pendingBalanceCOP > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {formatCurrency(o.pendingBalanceCOP)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[0.6875rem] text-muted-foreground">
                        <div className="font-medium text-foreground">{o.paymentTerms}</div>
                        {o.dueDate && <div>Vence: {formatDate(o.dueDate)}</div>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {cxp.color === 'blue' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-sky-600 dark:text-sky-400">
                            <CheckCircle2 className="size-3" /> 🔵 {cxp.label}
                          </span>
                        ) : cxp.color === 'red' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                            <AlertCircle className="size-3" /> 🔴 {cxp.label}
                          </span>
                        ) : cxp.color === 'amber' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                            <Clock className="size-3" /> 🟡 {cxp.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" /> 🟢 {cxp.label}
                          </span>
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

      {/* PESTAÑA 2: LIQUIDACIÓN TRIBUTARIA Y DOCUMENTOS SOPORTE (TARJETAS 9 Y 10) */}
      {activeTab === 'taxSettlement' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
            <strong>Liquidación Tributaria Parametrizada en Compras (Tarjeta #9 y #10):</strong> Desglose automático de IVA descontable (19%), Retención en la Fuente (2.5%), ReteIVA (15% del IVA) y ReteICA según la actividad y municipio del proveedor.
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center justify-between">
                <span>Causación Típica: Materias Primas Gran Contribuyente</span>
                <Badge variant="outline">Ecopetrol / Petroquímica</Badge>
              </h4>
              <div className="mt-3 divide-y divide-border/50 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Valor Bruto Factura (Subtotal):</span>
                  <span className="font-mono font-bold">$85.000.000</span>
                </div>
                <div className="py-2 flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>+ IVA Descontable (19% - Cuenta 240802):</span>
                  <span className="font-mono font-bold">+$16.150.000</span>
                </div>
                <div className="py-2 flex justify-between text-rose-600 dark:text-rose-400">
                  <span>- Retefuente Compras (2.5% - Cuenta 236540):</span>
                  <span className="font-mono font-bold">-$2.125.000</span>
                </div>
                <div className="py-2 flex justify-between text-rose-600 dark:text-rose-400">
                  <span>- ReteICA Actividad Fabril Funza (0.7%):</span>
                  <span className="font-mono font-bold">-$595.000</span>
                </div>
                <div className="py-2 flex justify-between text-rose-600 dark:text-rose-400">
                  <span>- Autorretención Especial Renta (0.8%):</span>
                  <span className="font-mono font-bold">-$430.000</span>
                </div>
                <div className="py-2.5 flex justify-between font-bold text-foreground bg-muted/30 px-2 rounded">
                  <span>Total Neto por Pagar (Cuenta 2205 Proveedores):</span>
                  <span className="font-mono text-sm text-primary">$98.000.000</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b pb-2 flex items-center justify-between">
                <span>Documentos Soporte a No Obligados (Tarjeta #10)</span>
                <Badge variant="info">DIAN Habilitada</Badge>
              </h4>
              <div className="mt-3 flex flex-col gap-2.5 text-xs">
                <p className="text-muted-foreground">
                  Cuando se causa una compra con un proveedor que tiene el switch <em>Obligado a Facturar = NO</em>, el sistema emite el Documento Soporte Electrónico con numeración autorizada:
                </p>
                <div className="rounded border bg-muted/40 p-3">
                  <div className="font-semibold text-foreground">Proveedor: José Antonio Salamanca (Artesanías Salamanca)</div>
                  <div className="text-[0.6875rem] text-muted-foreground">Concepto: Servicio de moldeado especial y reparaciones menores</div>
                  <div className="mt-2 flex items-center justify-between border-t pt-2">
                    <span className="font-mono font-bold text-foreground">Doc. Soporte No. DS-00310</span>
                    <Badge variant="success" className="text-[0.625rem]">Transmitido DIAN</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 flex-1">
                    <FileText className="size-3.5" /> Ver Representación PDF
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 flex-1">
                    <Paperclip className="size-3.5" /> Archivos Adjuntos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
