'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Layers,
  PackagePlus,
  Scale,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InventoryItem } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'
import {
  INITIAL_KARDEX_DEMO,
  INVENTORY_PUC_CATEGORIES,
  MOVEMENT_CONCEPTS,
  resolveItemPucMeta,
  type KardexEntry,
  type MovementConceptValue,
} from './inventory/inventory-constants'
import {
  NewArticleModal,
  RegisterMovementModal,
  type RegisterMovementPayload,
} from './inventory/inventory-modals'
import { KardexPepsTable } from './inventory/kardex-peps-table'

interface Props {
  items: InventoryItem[]
}

export function InventoryComplexView({ items }: Props) {
  const [localItems, setLocalItems] = useState<InventoryItem[]>(items)
  const [kardexEntries, setKardexEntries] = useState<KardexEntry[]>(INITIAL_KARDEX_DEMO)
  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'kardex'>('stock')

  const [selectedValuationMethod, setSelectedValuationMethod] = useState<
    'PEPS' | 'Promedio Ponderado'
  >('PEPS')
  const [selectedMovementConcept, setSelectedMovementConcept] =
    useState<MovementConceptValue>('Ajustes')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPucFilter, setSelectedPucFilter] = useState<string>('ALL')

  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return localItems.filter((item) => {
      const pucMeta = resolveItemPucMeta(item)
      if (selectedPucFilter !== 'ALL' && pucMeta.code !== selectedPucFilter) {
        return false
      }
      if (!q) return true
      return (
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.warehouseLocation.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        pucMeta.pucDisplay.toLowerCase().includes(q)
      )
    })
  }, [localItems, searchQuery, selectedPucFilter])

  // Cálculos de resumen
  const wipCount = localItems.filter((it) => resolveItemPucMeta(it).code === '141001').length
  const criticalStockCount = localItems.filter(
    (it) => it.currentStock <= it.minimumStock
  ).length

  function handleCreateArticle(newItem: InventoryItem) {
    setLocalItems((prev) => [newItem, ...prev])
    const pucMeta = resolveItemPucMeta(newItem)

    if (newItem.currentStock > 0) {
      const openingEntry: KardexEntry = {
        id: `kdx-${Date.now()}`,
        date: newItem.productionDate,
        documentNumber: `SI-${new Date().getFullYear()}-${String(kardexEntries.length + 1).padStart(3, '0')}`,
        sku: newItem.sku,
        itemName: newItem.name,
        pucAccount: pucMeta.pucDisplay,
        warehouseLocation: newItem.warehouseLocation,
        concept: 'Saldo inicial / Alta de artículo',
        batchNumber: newItem.batchNumber,
        entryQty: newItem.currentStock,
        entryUnitCost: newItem.unitCostCOP,
        entryTotalCost: Math.round(newItem.currentStock * newItem.unitCostCOP),
        exitQty: null,
        exitUnitCost: null,
        exitTotalCost: null,
        balanceQty: newItem.currentStock,
        balanceTotalCost: Math.round(newItem.currentStock * newItem.unitCostCOP),
      }
      setKardexEntries((prev) => [...prev, openingEntry])
    }

    const msg = `Artículo ${newItem.sku} (${newItem.name}) registrado en ${pucMeta.pucDisplay}.`
    setFeedbackMessage({ type: 'success', text: msg })
    toast.success(msg)
    setIsNewArticleModalOpen(false)
  }

  function handleRegisterMovement(payload: RegisterMovementPayload) {
    const targetItem = localItems.find((it) => it.id === payload.itemId)
    if (!targetItem) return

    const pucMeta = resolveItemPucMeta(targetItem)
    const previousEntriesForSku = kardexEntries.filter((e) => e.sku === targetItem.sku)
    const lastKardexForSku = previousEntriesForSku[previousEntriesForSku.length - 1]
    const prevBalanceQty = lastKardexForSku ? lastKardexForSku.balanceQty : targetItem.currentStock
    const prevBalanceCost = lastKardexForSku
      ? lastKardexForSku.balanceTotalCost
      : Math.round(targetItem.currentStock * targetItem.unitCostCOP)

    const movementTotalCost = Math.round(payload.quantity * payload.unitCostCOP)
    const isEntry = payload.direction === 'entrada'
    const isExit = payload.direction === 'salida'

    const nextBalanceQty = isEntry
      ? prevBalanceQty + payload.quantity
      : isExit
      ? Math.max(0, prevBalanceQty - payload.quantity)
      : prevBalanceQty

    const nextBalanceTotalCost = isEntry
      ? prevBalanceCost + movementTotalCost
      : isExit
      ? Math.max(0, prevBalanceCost - movementTotalCost)
      : prevBalanceCost

    const conceptLabel =
      MOVEMENT_CONCEPTS.find((c) => c.value === payload.concept)?.label ?? payload.concept

    const newEntry: KardexEntry = {
      id: `kdx-${Date.now()}`,
      date: new Date().toISOString(),
      documentNumber: payload.documentNumber,
      sku: targetItem.sku,
      itemName: targetItem.name,
      pucAccount: pucMeta.pucDisplay,
      warehouseLocation:
        payload.direction === 'traslado' && payload.destinationWarehouse
          ? `${targetItem.warehouseLocation} → ${payload.destinationWarehouse}`
          : targetItem.warehouseLocation,
      concept: payload.notes ? `${conceptLabel} — ${payload.notes}` : conceptLabel,
      batchNumber: payload.batchNumber,
      entryQty: isEntry ? payload.quantity : null,
      entryUnitCost: isEntry ? payload.unitCostCOP : null,
      entryTotalCost: isEntry ? movementTotalCost : null,
      exitQty: isExit ? payload.quantity : null,
      exitUnitCost: isExit ? payload.unitCostCOP : null,
      exitTotalCost: isExit ? movementTotalCost : null,
      balanceQty: nextBalanceQty,
      balanceTotalCost: nextBalanceTotalCost,
      notes: payload.notes,
    }

    setKardexEntries((prev) => [...prev, newEntry])
    setLocalItems((prev) =>
      prev.map((it) => {
        if (it.id !== targetItem.id) return it
        if (payload.direction === 'entrada') {
          return {
            ...it,
            currentStock: it.currentStock + payload.quantity,
            batchNumber: payload.batchNumber,
            unitCostCOP: payload.unitCostCOP,
          }
        }
        if (payload.direction === 'salida') {
          return {
            ...it,
            currentStock: Math.max(0, it.currentStock - payload.quantity),
          }
        }
        return {
          ...it,
          warehouseLocation: payload.destinationWarehouse ?? it.warehouseLocation,
        }
      })
    )

    const actionWord =
      payload.direction === 'entrada'
        ? 'Entrada'
        : payload.direction === 'salida'
        ? 'Salida'
        : 'Traslado'
    const msg = `${actionWord} registrada (${payload.documentNumber}) para ${targetItem.sku} bajo concepto "${payload.concept}".`
    setFeedbackMessage({ type: 'success', text: msg })
    toast.success(msg)
    setIsMovementModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 bg-background">
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

      {/* Barra superior: Buscador + Botones de Acción */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <label htmlFor="inventory-search" className="sr-only">
              Buscar por SKU, nombre o bodega
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="inventory-search"
              type="search"
              placeholder="Buscar por SKU, nombre o bodega..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {activeSubTab === 'stock' && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="inventory-puc-filter" className="sr-only">
                Filtrar por cuenta PUC
              </label>
              <select
                id="inventory-puc-filter"
                value={selectedPucFilter}
                onChange={(e) => setSelectedPucFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">Todas las cuentas PUC ({localItems.length})</option>
                {INVENTORY_PUC_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code} — {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsNewArticleModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <PackagePlus className="size-3.5" aria-hidden="true" />
            + Nuevo Artículo
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsMovementModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <ArrowRightLeft className="size-3.5" aria-hidden="true" />
            + Registrar Movimiento / Ajuste
          </Button>
        </div>
      </div>

      {/* Barra de Controles Paramétricos */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Selector 1: Método de Valoración Activo */}
        <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Scale className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Método de Valoración Activo:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedValuationMethod('PEPS')}
              className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                selectedValuationMethod === 'PEPS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              PEPS (FIFO)
            </button>
            <button
              type="button"
              onClick={() => setSelectedValuationMethod('Promedio Ponderado')}
              className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                selectedValuationMethod === 'Promedio Ponderado'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Prom. Ponderado
            </button>
          </div>
          <span className="text-[0.625rem] text-muted-foreground">
            Unificado con Kardex y REP-INV-02
          </span>
        </div>

        {/* Selector 2: Concepto Contable del Movimiento (7 conceptos) */}
        <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3">
          <label
            htmlFor="inventory-concept-selector"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <ArrowRightLeft className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Concepto Contable y Tributario:
          </label>
          <select
            id="inventory-concept-selector"
            value={selectedMovementConcept}
            onChange={(e) => setSelectedMovementConcept(e.target.value as MovementConceptValue)}
            className="w-full rounded border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            {MOVEMENT_CONCEPTS.map((concept) => (
              <option key={concept.value} value={concept.value}>
                {concept.label}
              </option>
            ))}
          </select>
          <span className="text-[0.625rem] text-muted-foreground">
            Vinculado a &quot;+ Registrar Movimiento / Ajuste&quot;
          </span>
        </div>

        {/* Métrica 3: Productos en Proceso (Cuenta 141001) */}
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="size-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-[0.6875rem] font-medium text-muted-foreground">
              En Proceso (PUC 141001)
            </div>
            <div className="text-base font-bold text-foreground">{wipCount} lotes / pailas</div>
          </div>
        </div>

        {/* Métrica 4: Semáforo de Stock Mínimo */}
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-[0.6875rem] font-medium text-muted-foreground">
              Stock Crítico / Reabastecer
            </div>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400">
              {criticalStockCount} referencias
            </div>
          </div>
        </div>
      </div>

      {/* Sub-pestañas de Inventarios */}
      <div
        role="tablist"
        aria-label="Vistas de inventario"
        className="flex flex-wrap items-center gap-2 border-b pb-3"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'stock'}
          size="sm"
          variant={activeSubTab === 'stock' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('stock')}
          className="gap-1.5 text-xs"
        >
          <Boxes className="size-3.5" aria-hidden="true" />
          Existencias y Lotes Actuales ({filteredItems.length})
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'kardex'}
          size="sm"
          variant={activeSubTab === 'kardex' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('kardex')}
          className="gap-1.5 text-xs"
        >
          <ClipboardList className="size-3.5" aria-hidden="true" />
          Kardex Valorizado PEPS (Entradas, Salidas y Saldos) ({kardexEntries.length})
        </Button>
      </div>

      {/* Sub-pestaña 1: Existencias y Lotes Actuales */}
      {activeSubTab === 'stock' && (
        <section aria-label="Existencias y Lotes Actuales" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Existencias y Lotes Actuales
            </h3>
            <span className="text-[0.6875rem] text-muted-foreground">
              Cuentas PUC: 140501 MP &bull; 141001 PP &bull; 143005 PT &bull; 145525 Insumos &bull; 146001 Empaques
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">SKU / Artículo</th>
                  <th scope="col" className="px-3 py-2.5">Categoría / Cuenta PUC</th>
                  <th scope="col" className="px-3 py-2.5">Presentación Comercial</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Existencia (Unidad Base)</th>
                  <th scope="col" className="px-3 py-2.5">Equivalencia Dual Comercial</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Semáforo Stock</th>
                  <th scope="col" className="px-3 py-2.5">Lote / F. Prod</th>
                  <th scope="col" className="px-3 py-2.5">Ubicación Bodega</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Costo Unitario ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No hay artículos que coincidan con la búsqueda actual.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => {
                    const commercialPacks = Math.floor(it.currentStock / it.baseUnitEquivalent)
                    const remainingLoose = it.currentStock % it.baseUnitEquivalent
                    const pucMeta = resolveItemPucMeta(it)

                    const isCritical = it.currentStock <= it.minimumStock
                    const isWarning = !isCritical && it.currentStock <= it.minimumStock * 1.25

                    return (
                      <tr key={it.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-semibold text-foreground">
                          <div>{it.name}</div>
                          <div className="font-mono text-[0.6875rem] text-muted-foreground">
                            {it.sku}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant={pucMeta.badgeVariant} className="text-[0.6875rem]">
                            {pucMeta.label}
                          </Badge>
                          <div className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                            {pucMeta.pucDisplay}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {it.commercialPresentation}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                          {formatNumber(it.currentStock)} {it.baseUnit}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {commercialPacks} empaque(s)
                          </span>
                          {remainingLoose > 0 && (
                            <span className="ml-1 text-[0.6875rem] text-amber-700 dark:text-amber-300">
                              + {formatNumber(remainingLoose)} {it.baseUnit} sueltas
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                              <span className="size-2 animate-pulse rounded-full bg-rose-500" />
                              Crítico (Mín: {formatNumber(it.minimumStock)})
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                              <span className="size-2 rounded-full bg-amber-500" />
                              Próximo a Mínimo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="size-2 rounded-full bg-emerald-500" />
                              Óptimo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="font-mono text-[0.6875rem] font-semibold text-foreground">
                            {it.batchNumber}
                          </div>
                          <div className="text-[0.625rem] text-muted-foreground">
                            {formatDate(it.productionDate)}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {it.warehouseLocation}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                          {formatCurrency(it.unitCostCOP)}
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

      {/* Sub-pestaña 2: Kardex Valorizado PEPS */}
      {activeSubTab === 'kardex' && (
        <KardexPepsTable
          entries={kardexEntries}
          items={localItems}
          searchQuery={searchQuery}
          valuationMethod={selectedValuationMethod}
        />
      )}

      {/* Modales */}
      {isNewArticleModalOpen && (
        <NewArticleModal
          isOpen={isNewArticleModalOpen}
          onClose={() => setIsNewArticleModalOpen(false)}
          existingItems={localItems}
          onCreateArticle={handleCreateArticle}
        />
      )}

      {isMovementModalOpen && (
        <RegisterMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          items={localItems}
          selectedConcept={selectedMovementConcept}
          onConceptChange={setSelectedMovementConcept}
          kardexEntries={kardexEntries}
          onRegisterMovement={handleRegisterMovement}
        />
      )}
    </div>
  )
}
