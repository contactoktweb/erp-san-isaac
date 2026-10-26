'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  PackageCheck,
  Printer,
  Sparkles,
  Tag,
  Truck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SalesOrder } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

interface Props {
  orders: SalesOrder[]
}

export function SalesOrdersComplexTable({ orders }: Props) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>('so-001')
  const [activeTabByOrder, setActiveTabByOrder] = useState<Record<string, 'items' | 'boxes'>>({})

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId))
  }

  const setOrderTab = (orderId: string, tab: 'items' | 'boxes') => {
    setActiveTabByOrder((prev) => ({ ...prev, [orderId]: tab }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen Superior del Semáforo en Temporada Alta */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 dark:bg-emerald-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300/70">En plazo normal</div>
            <div className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {orders.filter((o) => o.trafficLightStatus === 'En plazo normal').length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-50/50 p-3.5 dark:bg-amber-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-amber-900/70 dark:text-amber-300/70">Entrega próxima (≤3 días)</div>
            <div className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {orders.filter((o) => o.trafficLightStatus === 'Entrega próxima').length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-50/50 p-3.5 dark:bg-rose-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-rose-900/70 dark:text-rose-300/70">Entrega hoy / Atrasado</div>
            <div className="text-lg font-bold tabular-nums text-rose-700 dark:text-rose-400">
              {orders.filter((o) => o.trafficLightStatus === 'Entrega hoy / Pedido vencido').length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-sky-500/20 bg-sky-50/50 p-3.5 dark:bg-sky-950/20">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <PackageCheck className="size-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-sky-900/70 dark:text-sky-300/70">Empaque 100% completo</div>
            <div className="text-lg font-bold tabular-nums text-sky-700 dark:text-sky-400">
              {orders.filter((o) => o.trafficLightStatus === 'Empaque 100% completado').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Multipedido (Cabecera y Filas Expandibles) */}
      <div className="w-full divide-y divide-border/60">
        <div className="hidden border-b bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-12 lg:gap-3 lg:items-center">
          <div className="col-span-1">Alerta</div>
          <div className="col-span-2">No. Pedido / Origen</div>
          <div className="col-span-3">Cliente / Destino</div>
          <div className="col-span-2">Ventana de Fechas</div>
          <div className="col-span-2">Avance Empaque</div>
          <div className="col-span-2 text-right">Estado / Detalle</div>
        </div>

        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id
          const activeTab = activeTabByOrder[order.id] || 'items'

          return (
            <div key={order.id} className="transition-colors hover:bg-muted/15">
              {/* Fila Principal del Pedido */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="grid cursor-pointer grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-12 lg:items-center"
              >
                {/* 1. Semáforo */}
                <div className="col-span-1 flex items-center gap-2">
                  <TrafficLightIndicator status={order.trafficLightStatus} />
                </div>

                {/* 2. Consecutivo y Origen */}
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="font-mono font-bold text-foreground">{order.orderNumber}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.origin === 'TIENDA_WEB' ? (
                      <Badge variant="outline" className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-700 text-[0.6875rem] dark:text-purple-300">
                        <Globe className="size-3" />
                        {order.webOrderNumber || 'Tienda Web'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-slate-500/30 bg-slate-500/10 text-slate-700 text-[0.6875rem] dark:text-slate-300">
                        <Building2 className="size-3" />
                        ERP Planta
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 3. Cliente */}
                <div className="col-span-3">
                  <div className="font-semibold text-foreground line-clamp-1">{order.clientName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{order.clientDocument}</span>
                    <span>•</span>
                    <span className="truncate">{order.destinationCity}</span>
                  </div>
                </div>

                {/* 4. Ventana de Fechas y Conteo Regresivo */}
                <div className="col-span-2 flex flex-col gap-0.5 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>Rec: {formatDate(order.receptionDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="size-3" />
                    <span>Ent: {formatDate(order.estimatedDeliveryDate)}</span>
                  </div>
                  <div className="text-[0.6875rem]">
                    {order.remainingDays < 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        Atraso de {Math.abs(order.remainingDays)} día(s)
                      </span>
                    ) : order.remainingDays === 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">Vence Hoy</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Quedan <strong className="text-foreground">{order.remainingDays}</strong> de {order.totalAgreedDays} días
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Avance de Empaque y Cajas */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold tabular-nums text-foreground">{order.overallProgressPercentage}%</span>
                    <span className="text-muted-foreground">{order.totalBoxesCount} caja(s) armada(s)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        order.overallProgressPercentage === 100
                          ? 'bg-sky-500'
                          : order.overallProgressPercentage > 50
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${order.overallProgressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* 6. Estado y Botón Expandir */}
                <div className="col-span-2 flex items-center justify-between gap-2 lg:justify-end">
                  <OrderStatusBadge status={order.orderStatus} />
                  <div className="flex size-7 items-center justify-center rounded-md border bg-background text-muted-foreground">
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </div>
              </div>

              {/* Panel Expandible (Desglose V2: Ítems por Producto y Cajas de Empaque Mixtas) */}
              {isExpanded && (
                <div className="border-t bg-muted/20 px-4 py-5 lg:px-6">
                  {/* Pestañas de Navegación del Pedido */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={activeTab === 'items' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOrderTab(order.id, 'items')
                        }}
                        className="text-xs gap-1.5"
                      >
                        <Tag className="size-3.5" />
                        Ítems y Saldos ({order.items.length})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={activeTab === 'boxes' ? 'default' : 'outline'}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOrderTab(order.id, 'boxes')
                        }}
                        className="text-xs gap-1.5"
                      >
                        <Boxes className="size-3.5" />
                        Cajas de Empaque ({order.boxes.length})
                      </Button>
                    </div>

                    {/* Acciones del Gestor de Pedidos */}
                    <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="text-xs gap-1.5">
                        <FileText className="size-3.5 text-muted-foreground" />
                        Packing List PDF
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs gap-1.5">
                        <Printer className="size-3.5 text-muted-foreground" />
                        Rótulos de Caja
                      </Button>
                      {order.overallProgressPercentage === 100 && order.orderStatus !== 'Despachado/Entregado' && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold">
                          <Sparkles className="size-3.5" />
                          Convertir en Venta / Generar Factura
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Vista 1: Ítems y Conversión en Unidades Base */}
                  {activeTab === 'items' && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th scope="col" className="px-3 py-2.5">Referencia / Producto</th>
                            <th scope="col" className="px-3 py-2.5">Detalle / Personalización</th>
                            <th scope="col" className="px-3 py-2.5">Presentación Pedida</th>
                            <th scope="col" className="px-3 py-2.5 text-right">Total Pedido (Base)</th>
                            <th scope="col" className="px-3 py-2.5 text-right">Total Empacado</th>
                            <th scope="col" className="px-3 py-2.5 text-right">Saldo Pendiente</th>
                            <th scope="col" className="px-3 py-2.5 text-right">% Avance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {order.items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/30">
                              <td className="px-3 py-2.5 font-medium text-foreground">
                                <div>{item.productName}</div>
                                <div className="font-mono text-[0.6875rem] text-muted-foreground">{item.productSku}</div>
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground max-w-xs">
                                {item.customizationNote || 'Estándar de catálogo'}
                              </td>
                              <td className="px-3 py-2.5">
                                <Badge variant="outline" className="text-[0.6875rem]">
                                  {item.orderedQuantityCommercial} {item.commercialPresentation}
                                </Badge>
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                                {formatNumber(item.orderedQuantityBase)} uds
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {formatNumber(item.packedQuantityBase)} uds
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                                {item.pendingQuantityBase > 0 ? (
                                  <span className="font-bold text-rose-600 dark:text-rose-400">
                                    {formatNumber(item.pendingQuantityBase)} uds
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">0 uds</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="font-mono font-bold tabular-nums text-foreground">{item.progressPercentage}%</span>
                                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${item.progressPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Vista 2: Cajas de Empaque (Cajas Combinadas / Mixtas) */}
                  {activeTab === 'boxes' && (
                    <div className="mt-4 flex flex-col gap-3">
                      {order.boxes.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                          Aún no se han armado cajas para este pedido. El alistamiento iniciará según disponibilidad de lotes en planta.
                        </div>
                      ) : (
                        order.boxes.map((box) => (
                          <div
                            key={box.id}
                            className="rounded-lg border bg-background/80 p-3.5 shadow-xs transition-shadow hover:shadow-sm"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{box.boxLabel}</span>
                                {box.weightKg && (
                                  <Badge variant="muted" className="text-[0.6875rem]">
                                    {box.weightKg} kg
                                  </Badge>
                                )}
                                {box.isLocked && (
                                  <Badge variant="outline" className="text-[0.6875rem] text-muted-foreground">
                                    Bloqueada por Despacho
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Operario: <strong className="text-foreground">{box.packerUser}</strong></span>
                                <span>•</span>
                                <span>Fecha: {formatDate(box.packingDate)}</span>
                              </div>
                            </div>

                            {/* Contenido de la Caja */}
                            <div className="mt-2.5 flex flex-col gap-1.5">
                              <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                                Contenido de la caja:
                              </div>
                              <div className="divide-y divide-border/40">
                                {box.items.map((bItem, idx) => (
                                  <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                                    <span className="text-foreground">{bItem.productName}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-[0.6875rem] text-muted-foreground">
                                        Lote: {bItem.batchNumber}
                                      </span>
                                      <span className="font-mono font-bold text-foreground">
                                        {formatNumber(bItem.quantityBase)} uds base
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {box.notes && (
                              <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-[0.6875rem] text-muted-foreground">
                                <strong className="text-foreground">Observaciones:</strong> {box.notes}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Datos Adicionales de Cierre o Despacho si Aplica */}
                  {order.shippingCarrier && (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-sky-500/20 bg-sky-50/50 p-2.5 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
                      <Truck className="size-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      <span>
                        Despachado por <strong>{order.shippingCarrier}</strong> | Guía: <strong>{order.trackingNumber}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrafficLightIndicator({ status }: { status: SalesOrder['trafficLightStatus'] }) {
  switch (status) {
    case 'En plazo normal':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          En Plazo
        </span>
      )
    case 'Entrega próxima':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          Próximo (≤3d)
        </span>
      )
    case 'Entrega hoy / Pedido vencido':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
          Retraso / Hoy
        </span>
      )
    case 'Empaque 100% completado':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
          <span className="size-2 rounded-full bg-sky-500" />
          100% Empacado
        </span>
      )
  }
}

function OrderStatusBadge({ status }: { status: SalesOrder['orderStatus'] }) {
  switch (status) {
    case 'Registrado':
      return <Badge variant="outline" className="text-[0.6875rem]">Registrado</Badge>
    case 'En alistamiento':
      return <Badge variant="info" className="text-[0.6875rem]">En alistamiento</Badge>
    case 'Empacado parcialmente':
      return <Badge variant="warning" className="text-[0.6875rem]">Empacado parcial</Badge>
    case 'Empacado completo':
      return <Badge variant="success" className="text-[0.6875rem]">Empacado completo</Badge>
    case 'Despachado/Entregado':
      return <Badge variant="muted" className="text-[0.6875rem]">Despachado</Badge>
    case 'Cancelado':
      return <Badge variant="danger" className="text-[0.6875rem]">Cancelado</Badge>
  }
}
