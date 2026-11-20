'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Factory,
  FilePlus2,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductionOrder } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'
import { PriceSimulatorPanel } from './production/price-simulator-panel'
import {
  NewProductionOrderModal,
  NewTechnicalSheetModal,
} from './production/production-modals'
import {
  INITIAL_TECHNICAL_SHEETS,
  computeSheetCosts,
  formatAccountingStatusDisplay,
  type TechnicalSheet,
} from './production/production-types'

interface Props {
  orders: ProductionOrder[]
}

export function ProductionComplexView({ orders }: Props) {
  const [activeTab, setActiveTab] = useState<'orders' | 'costSheet'>('orders')

  const [localOrders, setLocalOrders] = useState<ProductionOrder[]>(orders)
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)

  const [localSheets, setLocalSheets] = useState<TechnicalSheet[]>(INITIAL_TECHNICAL_SHEETS)
  const [selectedSheetId, setSelectedSheetId] = useState<string>(INITIAL_TECHNICAL_SHEETS[0].id)
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false)

  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase()
    if (!q) return localOrders
    return localOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.formulaCode.toLowerCase().includes(q) ||
        o.targetBatch.toLowerCase().includes(q) ||
        formatAccountingStatusDisplay(o.accountingStatus).toLowerCase().includes(q)
    )
  }, [localOrders, orderSearchQuery])

  const activeSheet = useMemo(
    () => localSheets.find((s) => s.id === selectedSheetId) ?? localSheets[0],
    [localSheets, selectedSheetId]
  )

  const { rawMaterialsSubtotal, modSubtotal, cifSubtotal, totalUnitCost } = useMemo(
    () => computeSheetCosts(activeSheet),
    [activeSheet]
  )

  function handleCreateOrder(newOrder: ProductionOrder) {
    setLocalOrders((prev) => [newOrder, ...prev])
    const msg = `Orden ${newOrder.orderNumber} (${newOrder.productName}) creada correctamente.`
    setFeedbackMessage({ type: 'success', text: msg })
    toast.success(msg)
    setIsNewOrderModalOpen(false)
  }

  function handleCreateSheet(newSheet: TechnicalSheet) {
    setLocalSheets((prev) => [...prev, newSheet])
    setSelectedSheetId(newSheet.id)
    const { totalUnitCost: newCost } = computeSheetCosts(newSheet)
    const msg = `Ficha técnica ${newSheet.formulaCode} (${newSheet.productName}) creada con costo unitario ${formatCurrency(newCost)}.`
    setFeedbackMessage({ type: 'success', text: msg })
    toast.success(msg)
    setIsNewSheetModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Banner de Feedback */}
      {feedbackMessage && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-lg border p-3 text-xs font-medium ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Botones de Navegación del Módulo de Producción */}
      <div
        role="tablist"
        aria-label="Vistas de producción y costos"
        className="flex flex-wrap items-center gap-2 border-b pb-3"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          size="sm"
          variant={activeTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('orders')}
          className="gap-1.5 text-xs"
        >
          <Factory className="size-3.5" aria-hidden="true" />
          Órdenes de Fabricación y Variaciones ({localOrders.length})
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={activeTab === 'costSheet'}
          size="sm"
          variant={activeTab === 'costSheet' ? 'default' : 'outline'}
          onClick={() => setActiveTab('costSheet')}
          className="gap-1.5 text-xs"
        >
          <Calculator className="size-3.5" aria-hidden="true" />
          Hoja de Costos Paramétrica y Simulador de Precios (Ficha Maestra)
        </Button>
      </div>

      {/* PESTAÑA 1: ÓRDENES DE PRODUCCIÓN, COSTO ESTIMADO VS REAL Y ESTADO CONTABLE */}
      {activeTab === 'orders' && (
        <section aria-label="Órdenes de Fabricación y Variaciones" className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Órdenes de Fabricación y Variaciones
            </h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative sm:w-72">
                <label htmlFor="production-order-search" className="sr-only">
                  Buscar orden por número, ficha, producto o lote
                </label>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="production-order-search"
                  type="search"
                  placeholder="Buscar orden, ficha, producto o lote..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsNewOrderModalOpen(true)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                + Nueva Orden de Producción
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Comparativo Costo Estimado vs. Real y Estado Contable (Numerales 6, 7 y 40):</strong>{' '}
            Control de merma con semáforo de eficiencia (En estándar, Variación 1-5%, Sobrecosto &gt;5%). Estado contable dispara el traslado automático a{' '}
            <em>Producto en Proceso (PUC 141001)</em> y posterior habilitación del Lote terminado en{' '}
            <em>Bodega (PUC 143005)</em>.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">No. Orden / Ficha</th>
                  <th scope="col" className="px-3 py-2.5">Producto a Fabricar</th>
                  <th scope="col" className="px-3 py-2.5 text-right">REAL / PROGRAMADO (UDS)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Merma (kg)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Costo Estimado ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Costo Real ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Variación / Eficiencia</th>
                  <th scope="col" className="px-3 py-2.5">Lote / Fecha</th>
                  <th scope="col" className="px-3 py-2.5">Estado Operativo y Contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No se encontraron órdenes de producción para el criterio de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const realCost = o.realCostCOP ?? o.estimatedCostCOP
                    const costDiff = realCost - o.estimatedCostCOP
                    const variationPercent = Number(
                      ((costDiff / o.estimatedCostCOP) * 100).toFixed(1)
                    )

                    const isOvercost = variationPercent > 5
                    const isModerate = variationPercent > 1 && variationPercent <= 5

                    return (
                      <tr key={o.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                          <div>{o.orderNumber}</div>
                          <div className="text-[0.625rem] text-muted-foreground">
                            {o.formulaCode}
                          </div>
                        </td>
                        <td className="max-w-xs px-3 py-2.5 font-semibold text-foreground">
                          {o.productName}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                          <span className="font-semibold text-foreground">
                            {formatNumber(o.producedQuantity)}
                          </span>
                          <span className="text-[0.6875rem] text-muted-foreground">
                            {' '}
                            / {formatNumber(o.plannedQuantity)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                          {o.wasteKg} kg
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                          {formatCurrency(o.estimatedCostCOP)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-foreground">
                          {o.status === 'Programada' ? 'Por liquidar' : formatCurrency(realCost)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {o.status === 'Programada' ? (
                            <span className="text-[0.6875rem] text-muted-foreground">N/A</span>
                          ) : isOvercost ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              +{variationPercent}% Sobrecosto
                            </span>
                          ) : isModerate ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              +{variationPercent}% Variación
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              En Estándar
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-mono text-[0.6875rem] font-semibold text-foreground">
                            {o.targetBatch}
                          </div>
                          <div className="text-[0.625rem] text-muted-foreground">
                            {formatDate(o.startDate)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={
                              o.accountingStatus.includes('1430')
                                ? 'success'
                                : o.accountingStatus.includes('1410')
                                ? 'warning'
                                : 'outline'
                            }
                            className="text-[0.6875rem]"
                          >
                            {formatAccountingStatusDisplay(o.accountingStatus)}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PESTAÑA 2: HOJA DE COSTOS PARAMÉTRICA Y SIMULADOR DINÁMICO */}
      {activeTab === 'costSheet' && (
        <section
          aria-label="Hoja de Costos Paramétrica y Simulador de Precios"
          className="flex flex-col gap-4"
        >
          {/* Barra de selección de Producto / Receta y botón + Nueva Ficha Técnica */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3.5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-1.5 sm:max-w-md">
              <label htmlFor="recipe-selector" className="text-xs font-semibold text-foreground">
                Seleccionar Producto / Receta...
              </label>
              <select
                id="recipe-selector"
                value={activeSheet.id}
                onChange={(e) => setSelectedSheetId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Seleccionar Producto / Receta...
                </option>
                {localSheets.map((sheet) => (
                  <option key={sheet.id} value={sheet.id}>
                    {sheet.formulaCode} — {sheet.productName}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsNewSheetModalOpen(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <FilePlus2 className="size-3.5" aria-hidden="true" />
              + Nueva Ficha Técnica
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-1 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Ficha Técnica y Estructura de Costos Paramétrica
                </h3>
                <p className="text-xs text-muted-foreground">
                  Producto: {activeSheet.productName} (Fórmula: {activeSheet.formulaCode})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Unidad Base: {activeSheet.baseUnitLabel}
                </Badge>
                <Badge variant="info" className="text-xs">
                  Costo Unitario Total: {formatCurrency(totalUnitCost)}
                </Badge>
              </div>
            </div>

            {/* Tres Paneles: A, B y C */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* PANEL A: MATERIA PRIMA E INSUMOS DIRECTOS */}
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Panel A — Insumos Directos
                  </h4>
                  <span className="font-mono text-xs font-bold text-primary">
                    {formatCurrency(rawMaterialsSubtotal)}
                  </span>
                </div>
                <div className="divide-y divide-border/50 text-xs">
                  {activeSheet.materials.map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <div className="font-semibold text-foreground">{mat.name}</div>
                        <div className="text-[0.625rem] text-muted-foreground">
                          {mat.quantitySpec}
                        </div>
                      </div>
                      <span className="font-mono font-semibold">{formatCurrency(mat.costCOP)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PANEL B: MOD Y CIF / ENERGÉTICOS */}
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Panel B — MOD y CIF (Prorrateo)
                  </h4>
                  <span className="font-mono text-xs font-bold text-primary">
                    {formatCurrency(modSubtotal + cifSubtotal)}
                  </span>
                </div>
                <div className="divide-y divide-border/50 text-xs">
                  {activeSheet.overheads.map((ovh) => (
                    <div key={ovh.id} className="flex items-center justify-between py-1.5">
                      <div>
                        <div className="font-semibold text-foreground">{ovh.name}</div>
                        <div className="text-[0.625rem] text-muted-foreground">
                          {ovh.detailSpec}
                        </div>
                      </div>
                      <span className="font-mono font-semibold">{formatCurrency(ovh.costCOP)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PANEL C: SIMULADOR DINÁMICO DE PRECIOS POR CANAL */}
              <PriceSimulatorPanel totalUnitCost={totalUnitCost} />
            </div>
          </div>
        </section>
      )}

      {/* Modales */}
      {isNewOrderModalOpen && (
        <NewProductionOrderModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          sheets={localSheets}
          existingOrdersCount={localOrders.length}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {isNewSheetModalOpen && (
        <NewTechnicalSheetModal
          isOpen={isNewSheetModalOpen}
          onClose={() => setIsNewSheetModalOpen(false)}
          existingSheets={localSheets}
          onCreateSheet={handleCreateSheet}
        />
      )}
    </div>
  )
}
