'use client'

import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  History,
  Lock,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SalesOrder } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'
import { SYSTEM_ROLES } from '@/lib/permissions'
import { SalesOrdersComplexTable } from './sales-orders-complex-table'
import {
  AuthorizeExceptionModal,
  CollectionPaymentModal,
} from './sales/receivables-modals'
import {
  FEDV_RESOLUTION,
  normalizeNitDigits,
  PUC_SALES_ACCOUNTS,
  type CollectionRecord,
  type CommercialAuditEvent,
  type ReceivableRecord,
} from './sales/sales-constants'

interface Props {
  orders: SalesOrder[]
}

export function SalesAndReceivablesComplexView({ orders }: Props) {
  const { data: session } = useSession()
  const normalizedRole = session?.user?.role?.trim().toUpperCase() ?? ''
  const isAdmin = normalizedRole === SYSTEM_ROLES.ADMIN || normalizedRole === 'ADMINISTRADOR'
  const currentUserName = session?.user?.name || 'Administrador San Isaac'

  const [activeModuleTab, setActiveModuleTab] = useState<'orders' | 'receivables'>('orders')
  const [localOrders, setLocalOrders] = useState<SalesOrder[]>(orders)
  const [receivables, setReceivables] = useState<ReceivableRecord[]>(RECEIVABLES_DEMO)
  const [collections, setCollections] = useState<CollectionRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<CommercialAuditEvent[]>([])
  const [lastFedvNumber, setLastFedvNumber] = useState<number>(FEDV_RESOLUTION.currentNumber)
  const [invoicedOrderMap, setInvoicedOrderMap] = useState<Record<string, string>>({})
  const [receivablesSearch, setReceivablesSearch] = useState('')
  const [auditFeedbackBanner, setAuditFeedbackBanner] = useState<string | null>(null)

  // Modales de Cartera
  const [collectionModalState, setCollectionModalState] = useState<{
    isOpen: boolean
    initialReceivableId: string | null
  }>({ isOpen: false, initialReceivableId: null })
  const [exceptionTarget, setExceptionTarget] = useState<ReceivableRecord | null>(null)

  const blockedClientDocs = useMemo(() => {
    const docs = new Set<string>()
    for (const r of receivables) {
      if (r.hasCommercialBlock && r.pendingBalanceCOP > 0) {
        docs.add(normalizeNitDigits(r.clientNit))
      }
    }
    return docs
  }, [receivables])

  const authorizedExceptionDocs = useMemo(() => {
    const docs = new Set<string>()
    for (const r of receivables) {
      if (r.exceptionAuthorized) {
        docs.add(normalizeNitDigits(r.clientNit))
      }
    }
    return docs
  }, [receivables])

  const handleCreateOrder = (newOrder: SalesOrder) => {
    setLocalOrders((prev) => [newOrder, ...prev])
  }

  const handleUpdateOrder = (updatedOrder: SalesOrder) => {
    setLocalOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
  }

  const handleEmitFedvInvoice = (order: SalesOrder): string => {
    const nextNum = lastFedvNumber + 1
    const invoiceNumber = `${FEDV_RESOLUTION.prefix}-${nextNum}`
    setLastFedvNumber(nextNum)
    setInvoicedOrderMap((prev) => ({ ...prev, [order.id]: invoiceNumber }))

    const isCashTerms = order.paymentTerms === 'Contado'
    const issueIso = new Date().toISOString()
    const newReceivable: ReceivableRecord = {
      id: `rec-${Date.now()}`,
      invoiceNumber,
      originOrderNumber: order.orderNumber,
      clientName: order.clientName,
      clientNit: order.clientDocument,
      issueDate: issueIso,
      dueDate: order.estimatedDeliveryDate,
      creditTerms: order.paymentTerms,
      totalAmountCOP: order.totalAmountCOP,
      paidAmountCOP: isCashTerms ? order.totalAmountCOP : 0,
      pendingBalanceCOP: isCashTerms ? 0 : order.totalAmountCOP,
      overdueDays: 0,
      agingCategory: 'Corriente',
      status: isCashTerms ? 'Pagada' : 'Al Día',
      hasCommercialBlock: false,
    }

    setReceivables((prev) => [newReceivable, ...prev])
    setAuditEvents((prev) => [
      {
        id: `aud-${Date.now()}`,
        action: 'FEDV_ISSUED',
        entity: 'SalesOrder',
        entityId: invoiceNumber,
        details: `Emisión de Factura Electrónica ${invoiceNumber} (Res. DIAN ${FEDV_RESOLUTION.resolutionNumber}) desde pedido ${order.orderNumber} por ${formatCurrency(order.totalAmountCOP)}.`,
        userName: currentUserName,
        userRole: normalizedRole || 'VENTAS',
        createdAt: issueIso,
      },
      ...prev,
    ])
    toast.success(
      `Factura Electrónica ${invoiceNumber} emitida (Res. DIAN ${FEDV_RESOLUTION.resolutionNumber}) y sincronizada con Cartera.`
    )
    return invoiceNumber
  }

  const handleConfirmCollection = (payload: {
    receivableId: string
    operationType: 'ABONO_CARTERA' | 'ANTICIPO_280505'
    paymentMethod: string
    reference: string
    amountCOP: number
    notes: string
  }) => {
    const target = receivables.find((r) => r.id === payload.receivableId)
    if (!target) return

    const newPaid = target.paidAmountCOP + payload.amountCOP
    const newPending = Math.max(0, target.pendingBalanceCOP - payload.amountCOP)
    const isPaidOff = newPending === 0
    const pucAccount =
      payload.operationType === 'ANTICIPO_280505'
        ? PUC_SALES_ACCOUNTS.ANTICIPO_CLIENTES
        : PUC_SALES_ACCOUNTS.CXC_CLIENTES

    setReceivables((prev) =>
      prev.map((r) =>
        r.id === target.id
          ? {
              ...r,
              paidAmountCOP: newPaid,
              pendingBalanceCOP: newPending,
              status: isPaidOff ? 'Pagada' : r.status,
              hasCommercialBlock: isPaidOff ? false : r.hasCommercialBlock,
            }
          : r
      )
    )

    const nowIso = new Date().toISOString()
    setCollections((prev) => [
      {
        id: `col-${Date.now()}`,
        receivableId: target.id,
        invoiceNumber: target.invoiceNumber,
        clientName: target.clientName,
        operationType: payload.operationType,
        pucAccount,
        paymentMethod: payload.paymentMethod,
        reference: payload.reference,
        amountCOP: payload.amountCOP,
        date: nowIso,
        notes: payload.notes,
      },
      ...prev,
    ])

    setAuditEvents((prev) => [
      {
        id: `aud-${Date.now()}`,
        action: 'RECEIVABLE_PAYMENT',
        entity: 'Receivable',
        entityId: target.invoiceNumber,
        details: `${
          payload.operationType === 'ANTICIPO_280505'
            ? 'Anticipo de cliente (PUC 280505)'
            : 'Recaudo / Abono (PUC 130505)'
        } por ${formatCurrency(payload.amountCOP)} aplicado a ${target.invoiceNumber}. Saldo restante: ${formatCurrency(newPending)}.`,
        userName: currentUserName,
        userRole: normalizedRole || 'ADMIN',
        createdAt: nowIso,
      },
      ...prev,
    ])

    toast.success(
      `${
        payload.operationType === 'ANTICIPO_280505'
          ? 'Anticipo PUC 280505'
          : 'Recaudo'
      } de ${formatCurrency(payload.amountCOP)} aplicado a ${target.invoiceNumber}. Nuevo saldo: ${formatCurrency(newPending)}.`
    )
  }

  const handleAuthorizeException = (receivable: ReceivableRecord, reason: string) => {
    const nowIso = new Date().toISOString()
    setReceivables((prev) =>
      prev.map((r) =>
        r.id === receivable.id
          ? {
              ...r,
              exceptionAuthorized: true,
              exceptionAuthorizedBy: currentUserName,
              exceptionReason: reason,
              exceptionAuthorizedAt: nowIso,
            }
          : r
      )
    )

    setAuditEvents((prev) => [
      {
        id: `aud-${Date.now()}`,
        action: 'COMMERCIAL_BLOCK_OVERRIDE',
        entity: 'CommercialBlock',
        entityId: receivable.invoiceNumber,
        details: `Excepción de pedido autorizada por ADMIN para ${receivable.clientName} (NIT ${receivable.clientNit}, factura ${receivable.invoiceNumber}). Motivo: ${reason}`,
        userName: currentUserName,
        userRole: normalizedRole || 'ADMIN',
        createdAt: nowIso,
      },
      ...prev,
    ])

    const confirmationText = `Excepción comercial autorizada para ${receivable.clientName} (${receivable.invoiceNumber}) — evento registrado en Bitácora de Auditoría.`
    setAuditFeedbackBanner(confirmationText)
    toast.success(confirmationText)
  }

  // Totalizadores reactivos de cartera
  const totalReceivables = receivables.reduce((acc, r) => acc + r.totalAmountCOP, 0)
  const totalCollected = receivables.reduce((acc, r) => acc + r.paidAmountCOP, 0)
  const totalPending = receivables.reduce((acc, r) => acc + r.pendingBalanceCOP, 0)
  const overdueCount = receivables.filter(
    (r) => r.agingCategory !== 'Corriente' && r.pendingBalanceCOP > 0
  ).length

  const normalizedRecQuery = receivablesSearch.trim().toLowerCase()
  const filteredReceivables = receivables.filter((r) => {
    if (!normalizedRecQuery) return true
    return (
      r.invoiceNumber.toLowerCase().includes(normalizedRecQuery) ||
      r.originOrderNumber.toLowerCase().includes(normalizedRecQuery) ||
      r.clientName.toLowerCase().includes(normalizedRecQuery) ||
      r.clientNit.toLowerCase().includes(normalizedRecQuery)
    )
  })

  return (
    <div className="flex flex-col gap-6 bg-background p-4 sm:p-6">
      {/* Botones de navegación entre Gestor de Pedidos V2 y Cartera */}
      <nav
        aria-label="Submódulos de ventas y cartera"
        className="flex flex-wrap items-center justify-between gap-2 border-b pb-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activeModuleTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveModuleTab('orders')}
            className="gap-1.5 text-xs"
          >
            <ShoppingCart className="size-3.5" aria-hidden="true" />
            Gestor de Pedidos Complejo V2 ({localOrders.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeModuleTab === 'receivables' ? 'default' : 'outline'}
            onClick={() => setActiveModuleTab('receivables')}
            className="gap-1.5 text-xs"
          >
            <Receipt className="size-3.5" aria-hidden="true" />
            Cuentas por Cobrar, Recaudos y Aging ({receivables.length})
          </Button>
        </div>

        <Badge variant="outline" className="font-mono text-[0.6875rem]">
          Consecutivo DIAN: {FEDV_RESOLUTION.prefix}-{lastFedvNumber} (Sig. {FEDV_RESOLUTION.prefix}-
          {lastFedvNumber + 1})
        </Badge>
      </nav>

      {/* VISTA 1: GESTOR DE PEDIDOS COMPLEJO V2 */}
      {activeModuleTab === 'orders' && (
        <section aria-labelledby="heading-orders-view">
          <h3 id="heading-orders-view" className="sr-only">
            Tablero de Pedidos y Empaque Progresivo
          </h3>
          <SalesOrdersComplexTable
            orders={localOrders}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
            nextFedvNumber={lastFedvNumber + 1}
            invoicedOrderMap={invoicedOrderMap}
            onEmitFedvInvoice={handleEmitFedvInvoice}
            blockedClientDocs={blockedClientDocs}
            authorizedExceptionDocs={authorizedExceptionDocs}
          />
        </section>
      )}

      {/* VISTA 2: CUENTAS POR COBRAR, RECAUDOS Y AGING DE CARTERA (NUMERAL 10) */}
      {activeModuleTab === 'receivables' && (
        <section aria-labelledby="heading-receivables-view" className="flex flex-col gap-4">
          <h3 id="heading-receivables-view" className="sr-only">
            Cuentas por Cobrar, Recaudos y Bloqueo Comercial
          </h3>

          {auditFeedbackBanner && (
            <div
              role="status"
              className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-800 dark:text-emerald-300"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{auditFeedbackBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setAuditFeedbackBanner(null)}
                className="p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Cerrar confirmación de auditoría"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Barra superior de Cartera */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <label htmlFor="receivables-search-input" className="sr-only">
                Buscar cartera por factura FEDV, pedido o cliente
              </label>
              <Search
                className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="receivables-search-input"
                type="search"
                value={receivablesSearch}
                onChange={(e) => setReceivablesSearch(e.target.value)}
                placeholder="Buscar factura FEDV-XXXX, pedido o cliente..."
                className="pl-9 text-xs"
              />
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() =>
                setCollectionModalState({ isOpen: true, initialReceivableId: null })
              }
              className="gap-1.5 self-start bg-primary text-xs font-semibold text-primary-foreground sm:self-auto"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              + Registrar Recaudo / Abono
            </Button>
          </div>

          {/* Métricas Superiores de Cartera */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <DollarSign className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Total Facturado</div>
                <div className="font-mono text-base font-bold text-foreground">
                  {formatCurrency(totalReceivables)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300/70">
                  Recaudado / Abonos
                </div>
                <div className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(totalCollected)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Clock className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Saldo Pendiente Cartera
                </div>
                <div className="font-mono text-base font-bold text-foreground">
                  {formatCurrency(totalPending)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-50/50 p-3.5 dark:bg-rose-950/20">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-rose-900/70 dark:text-rose-300/70">
                  Facturas en Mora
                </div>
                <div className="font-mono text-base font-bold text-rose-700 dark:text-rose-400">
                  {overdueCount} clientes
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Reglas de Cartera y Bloqueo Comercial (Numeral 10):</strong> Trazabilidad
            directa entre FEDV y PED/WEB origen. Franjas de antigüedad de cartera (Aging: Corriente,
            1-30d, 31-60d, 61-90d, &gt;90d). <em>Regla al crear pedido:</em> SI Cliente tiene mora o
            saldo &gt; cupo &rarr; ⚠️ Alerta de Bloqueo Comercial (excepción exclusiva para rol{' '}
            <strong>ADMIN</strong>).
          </div>

          {/* Tabla de Cuentas por Cobrar y Aging */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">
                    Factura FEDV / Origen
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Cliente / Documento
                  </th>
                  <th scope="col" className="px-3 py-2.5">
                    Emisión &amp; Plazo
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Total Factura ($)
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Abonos ($)
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Saldo Pendiente
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Días Mora &amp; Aging
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Semáforo Cartera
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Acción / Recaudo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredReceivables.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-foreground">
                          {r.invoiceNumber}
                        </div>
                        <div className="font-mono text-[0.625rem] text-muted-foreground">
                          Pedido: {r.originOrderNumber}
                        </div>
                      </td>
                      <td className="max-w-xs px-3 py-2.5">
                        <div className="line-clamp-1 font-semibold text-foreground">
                          {r.clientName}
                        </div>
                        <div className="font-mono text-[0.625rem] text-muted-foreground">
                          {r.clientNit}
                        </div>
                        {r.hasCommercialBlock && !r.exceptionAuthorized && (
                          <div className="mt-1 flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-rose-600 dark:text-rose-400">
                              <Lock className="size-2.5" aria-hidden="true" />
                              ⚠️ Bloqueo Comercial (Supera Cupo)
                            </span>
                            {isAdmin ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setExceptionTarget(r)}
                                className="h-6 gap-1 border-amber-500/40 bg-amber-500/10 px-2 text-[0.625rem] font-semibold text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                              >
                                <ShieldAlert className="size-3" aria-hidden="true" />
                                Autorizar Excepción de Pedido
                              </Button>
                            ) : (
                              <span className="text-[0.625rem] text-muted-foreground">
                                Excepción reservada a rol ADMIN
                              </span>
                            )}
                          </div>
                        )}
                        {r.exceptionAuthorized && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="size-2.5" aria-hidden="true" />
                              Excepción Autorizada (ADMIN)
                            </span>
                            {r.exceptionReason && (
                              <span className="text-[0.625rem] text-muted-foreground">
                                {r.exceptionReason}
                              </span>
                            )}
                          </div>
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
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setCollectionModalState({
                                isOpen: true,
                                initialReceivableId: r.id,
                              })
                            }
                            className="gap-1 text-xs"
                          >
                            <Receipt className="size-3" aria-hidden="true" /> Recibo de Caja
                          </Button>
                        ) : (
                          <span className="text-[0.6875rem] text-muted-foreground">
                            Paz y Salvo
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Historial de Recaudos / Anticipos PUC 280505 */}
          {collections.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Receipt className="size-3.5 text-emerald-600" aria-hidden="true" />
                Recaudos y Anticipos Registrados en Sesión ({collections.length})
              </h4>
              <div className="divide-y text-xs">
                {collections.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <span className="font-mono font-bold text-foreground">{c.reference}</span>{' '}
                      <span className="text-muted-foreground">· {c.invoiceNumber} ·</span>{' '}
                      <span className="font-medium text-foreground">{c.clientName}</span>
                      <div className="text-[0.6875rem] text-muted-foreground">
                        {c.paymentMethod}
                        {c.notes ? ` · ${c.notes}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={c.operationType === 'ANTICIPO_280505' ? 'info' : 'outline'}
                        className="font-mono text-[0.625rem]"
                      >
                        PUC {c.pucAccount}{' '}
                        {c.operationType === 'ANTICIPO_280505' ? 'Anticipo' : 'CxC'}
                      </Badge>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.amountCOP)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registro de eventos en Bitácora de Auditoría */}
          {auditEvents.length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <History className="size-3.5 text-primary" aria-hidden="true" />
                Eventos Registrados en Bitácora de Auditoría ({auditEvents.length})
              </h4>
              <div className="divide-y text-xs">
                {auditEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="font-mono text-[0.625rem]">
                          {ev.action}
                        </Badge>
                        <span className="font-semibold text-foreground">{ev.userName}</span>
                        <span className="text-[0.6875rem] text-muted-foreground">
                          ({ev.userRole})
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{ev.details}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground">
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Modal: + Registrar Recaudo / Abono (incluye Anticipo PUC 280505) */}
      <CollectionPaymentModal
        isOpen={collectionModalState.isOpen}
        receivables={receivables}
        initialReceivableId={collectionModalState.initialReceivableId}
        onClose={() =>
          setCollectionModalState({ isOpen: false, initialReceivableId: null })
        }
        onConfirmCollection={handleConfirmCollection}
      />

      {/* Modal: Autorizar Excepción de Pedido (ADMIN) */}
      <AuthorizeExceptionModal
        receivable={exceptionTarget}
        adminUserName={currentUserName}
        onClose={() => setExceptionTarget(null)}
        onAuthorize={handleAuthorizeException}
      />
    </div>
  )
}

const RECEIVABLES_DEMO: ReceivableRecord[] = [
  {
    id: 'rec-001',
    invoiceNumber: 'FEDV-1082',
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
    invoiceNumber: 'FEDV-1075',
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
    invoiceNumber: 'FEDV-1085',
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
    invoiceNumber: 'FEDV-1060',
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
