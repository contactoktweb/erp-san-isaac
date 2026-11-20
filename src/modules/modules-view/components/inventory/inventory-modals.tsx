'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRightLeft, PackagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { InventoryItem } from '@/database/schemas'
import { formatCurrency, formatNumber } from '@/lib/config'
import {
  BASE_UNIT_OPTIONS,
  INVENTORY_PUC_CATEGORIES,
  INVENTORY_PUC_MAP,
  MOVEMENT_CONCEPTS,
  WAREHOUSE_LOCATIONS,
  resolveItemPucMeta,
  type KardexEntry,
  type MovementConceptValue,
  type PucCategoryCode,
} from './inventory-constants'

interface NewArticleModalProps {
  isOpen: boolean
  onClose: () => void
  existingItems: InventoryItem[]
  onCreateArticle: (item: InventoryItem) => void
}

export function NewArticleModal({
  isOpen,
  onClose,
  existingItems,
  onCreateArticle,
}: NewArticleModalProps) {
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [pucCode, setPucCode] = useState<PucCategoryCode>('140501')
  const [baseUnit, setBaseUnit] = useState<string>('kg')
  const [commercialPresentation, setCommercialPresentation] = useState('')
  const [baseUnitEquivalent, setBaseUnitEquivalent] = useState<string>('25')
  const [currentStock, setCurrentStock] = useState<string>('0')
  const [minimumStock, setMinimumStock] = useState<string>('10')
  const [unitCostCOP, setUnitCostCOP] = useState<string>('0')
  const [batchNumber, setBatchNumber] = useState<string>('LOT-2026-NEW')
  const [warehouseLocation, setWarehouseLocation] = useState<string>(WAREHOUSE_LOCATIONS[0])
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanSku = sku.trim().toUpperCase()
    const cleanName = name.trim()
    const cleanPresentation = commercialPresentation.trim()
    const cleanBatch = batchNumber.trim().toUpperCase()
    const equivNum = Number(baseUnitEquivalent)
    const stockNum = Number(currentStock)
    const minNum = Number(minimumStock)
    const costNum = Math.round(Number(unitCostCOP))

    if (!cleanSku || !cleanName || !cleanPresentation || !cleanBatch) {
      setError('Complete todos los campos obligatorios marcados con *.')
      return
    }
    if (existingItems.some((item) => item.sku.toUpperCase() === cleanSku)) {
      setError(`El SKU "${cleanSku}" ya existe en el inventario.`)
      return
    }
    if (!Number.isFinite(equivNum) || equivNum <= 0) {
      setError('La equivalencia en unidad base debe ser mayor a 0.')
      return
    }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isFinite(minNum) || minNum < 0) {
      setError('Las existencias y stock mínimo deben ser valores iguales o mayores a 0.')
      return
    }
    if (!Number.isFinite(costNum) || costNum < 0) {
      setError('El costo unitario debe ser un valor válido mayor o igual a 0.')
      return
    }

    const pucMeta = INVENTORY_PUC_MAP[pucCode]
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: cleanSku,
      name: cleanName,
      category: pucMeta.schemaCategory,
      baseUnit,
      commercialPresentation: cleanPresentation,
      baseUnitEquivalent: equivNum,
      batchNumber: cleanBatch,
      productionDate: new Date().toISOString(),
      currentStock: stockNum,
      minimumStock: minNum,
      warehouseLocation,
      unitCostCOP: costNum,
      pucAccount: pucMeta.pucDisplay,
    }

    setError(null)
    onCreateArticle(newItem)
    setSku('')
    setName('')
    setCommercialPresentation('')
    setCurrentStock('0')
    setUnitCostCOP('0')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-new-article"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <PackagePlus className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-new-article" className="text-base font-bold text-foreground">
              Registrar Nuevo Artículo en Inventario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de nuevo artículo"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-sku" className="font-semibold text-foreground">
                SKU *
              </label>
              <Input
                id="art-sku"
                required
                placeholder="Ej. EMP-VAS-002"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="art-name" className="font-semibold text-foreground">
                Nombre del Artículo *
              </label>
              <Input
                id="art-name"
                required
                placeholder="Ej. Vaso Vidrio Decorado 12 cm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-puc" className="font-semibold text-foreground">
                Categoría / Cuenta PUC *
              </label>
              <select
                id="art-puc"
                value={pucCode}
                onChange={(e) => setPucCode(e.target.value as PucCategoryCode)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {INVENTORY_PUC_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.code} — {cat.label} ({cat.description})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-warehouse" className="font-semibold text-foreground">
                Ubicación Bodega *
              </label>
              <select
                id="art-warehouse"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {WAREHOUSE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-base-unit" className="font-semibold text-foreground">
                Unidad Base *
              </label>
              <select
                id="art-base-unit"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {BASE_UNIT_OPTIONS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-presentation" className="font-semibold text-foreground">
                Presentación Comercial *
              </label>
              <Input
                id="art-presentation"
                required
                placeholder="Ej. Caja x 24 unidades"
                value={commercialPresentation}
                onChange={(e) => setCommercialPresentation(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-equiv" className="font-semibold text-foreground">
                Equivalencia Base *
              </label>
              <Input
                id="art-equiv"
                type="number"
                min={1}
                step="any"
                required
                value={baseUnitEquivalent}
                onChange={(e) => setBaseUnitEquivalent(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-stock" className="font-semibold text-foreground">
                Existencia Inicial *
              </label>
              <Input
                id="art-stock"
                type="number"
                min={0}
                step="any"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-min-stock" className="font-semibold text-foreground">
                Stock Mínimo *
              </label>
              <Input
                id="art-min-stock"
                type="number"
                min={0}
                step="any"
                required
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-unit-cost" className="font-semibold text-foreground">
                Costo Unitario (COP) *
              </label>
              <Input
                id="art-unit-cost"
                type="number"
                min={0}
                step={1}
                required
                value={unitCostCOP}
                onChange={(e) => setUnitCostCOP(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="art-batch" className="font-semibold text-foreground">
                Lote Inicial *
              </label>
              <Input
                id="art-batch"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Guardar Artículo
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export interface RegisterMovementPayload {
  itemId: string
  concept: MovementConceptValue
  direction: 'entrada' | 'salida' | 'traslado'
  quantity: number
  unitCostCOP: number
  documentNumber: string
  batchNumber: string
  destinationWarehouse?: string
  notes?: string
}

interface RegisterMovementModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  selectedConcept: MovementConceptValue
  onConceptChange: (concept: MovementConceptValue) => void
  kardexEntries: KardexEntry[]
  onRegisterMovement: (payload: RegisterMovementPayload) => void
}

export function RegisterMovementModal({
  isOpen,
  onClose,
  items,
  selectedConcept,
  onConceptChange,
  kardexEntries,
  onRegisterMovement,
}: RegisterMovementModalProps) {
  const conceptConfig =
    MOVEMENT_CONCEPTS.find((c) => c.value === selectedConcept) ?? MOVEMENT_CONCEPTS[0]

  const [itemId, setItemId] = useState<string>(items[0]?.id ?? '')
  const [direction, setDirection] = useState<'entrada' | 'salida' | 'traslado'>(
    conceptConfig.defaultDirection
  )
  const [quantity, setQuantity] = useState<string>('10')
  const [unitCostCOP, setUnitCostCOP] = useState<string>(String(items[0]?.unitCostCOP ?? 0))
  const [documentNumber, setDocumentNumber] = useState<string>(
    `${conceptConfig.defaultDocPrefix}${String(kardexEntries.length + 1).padStart(3, '0')}`
  )
  const [batchNumber, setBatchNumber] = useState<string>(items[0]?.batchNumber ?? '')
  const [destinationWarehouse, setDestinationWarehouse] = useState<string>(WAREHOUSE_LOCATIONS[1])
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const selectedItem = items.find((it) => it.id === itemId) ?? items[0]

  // Sincroniza dirección y prefijo cuando cambia el concepto seleccionado en barra o modal
  useEffect(() => {
    const cfg = MOVEMENT_CONCEPTS.find((c) => c.value === selectedConcept) ?? MOVEMENT_CONCEPTS[0]
    setDirection(cfg.defaultDirection)
    setDocumentNumber(`${cfg.defaultDocPrefix}${String(kardexEntries.length + 1).padStart(3, '0')}`)
    setError(null)
  }, [selectedConcept, kardexEntries.length])

  useEffect(() => {
    if (!selectedItem) return
    setUnitCostCOP(String(selectedItem.unitCostCOP))
    setBatchNumber(selectedItem.batchNumber)
    const alternativeLoc =
      WAREHOUSE_LOCATIONS.find((loc) => loc !== selectedItem.warehouseLocation) ??
      WAREHOUSE_LOCATIONS[0]
    setDestinationWarehouse(alternativeLoc)
  }, [selectedItem])

  if (!isOpen || !selectedItem) return null

  const itemPuc = resolveItemPucMeta(selectedItem)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedItem) return

    const qtyNum = Number(quantity)
    const costNum = Math.round(Number(unitCostCOP))
    const cleanDoc = documentNumber.trim().toUpperCase()
    const cleanBatch = batchNumber.trim().toUpperCase()

    if (!cleanDoc || !cleanBatch) {
      setError('Debe indicar el documento soporte y el número de lote.')
      return
    }
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setError('La cantidad del movimiento debe ser mayor a 0.')
      return
    }
    if ((direction === 'salida' || direction === 'traslado') && qtyNum > selectedItem.currentStock) {
      setError(
        `Saldo insuficiente para ${selectedItem.sku}. Disponible: ${formatNumber(selectedItem.currentStock)} ${selectedItem.baseUnit}.`
      )
      return
    }
    if (direction === 'traslado' && destinationWarehouse === selectedItem.warehouseLocation) {
      setError('La bodega destino debe ser distinta a la bodega de origen.')
      return
    }
    if (!Number.isFinite(costNum) || costNum < 0) {
      setError('El costo unitario debe ser válido.')
      return
    }

    setError(null)
    onRegisterMovement({
      itemId: selectedItem.id,
      concept: selectedConcept,
      direction,
      quantity: qtyNum,
      unitCostCOP: costNum,
      documentNumber: cleanDoc,
      batchNumber: cleanBatch,
      destinationWarehouse: direction === 'traslado' ? destinationWarehouse : undefined,
      notes: notes.trim() || undefined,
    })
    setNotes('')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-movement"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-movement" className="text-base font-bold text-foreground">
              Registrar Movimiento / Ajuste de Inventario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de movimiento"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
            >
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Concepto contable ligado al selector superior */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mov-concept" className="font-semibold text-foreground">
              Concepto Contable y Tributario (Sincronizado) *
            </label>
            <select
              id="mov-concept"
              value={selectedConcept}
              onChange={(e) => onConceptChange(e.target.value as MovementConceptValue)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MOVEMENT_CONCEPTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="rounded-md border border-sky-500/20 bg-sky-50/50 px-2.5 py-1.5 text-[0.6875rem] text-sky-900 dark:bg-sky-950/20 dark:text-sky-200">
              <strong>Imputación PUC:</strong> {conceptConfig.pucCounterpart}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mov-item" className="font-semibold text-foreground">
              Artículo / SKU *
            </label>
            <select
              id="mov-item"
              value={selectedItem.id}
              onChange={(e) => setItemId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.sku} — {it.name} (Saldo: {formatNumber(it.currentStock)} {it.baseUnit})
                </option>
              ))}
            </select>
            <div className="text-[0.6875rem] text-muted-foreground">
              Cuenta: <span className="font-mono font-semibold">{itemPuc.pucDisplay}</span> &bull;
              Bodega actual: {selectedItem.warehouseLocation} &bull; Costo PEPS:{' '}
              {formatCurrency(selectedItem.unitCostCOP)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-direction" className="font-semibold text-foreground">
                Tipo de Movimiento *
              </label>
              {conceptConfig.allowsDirectionChoice ? (
                <select
                  id="mov-direction"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'entrada' | 'salida')}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="entrada">Entrada (+ Stock)</option>
                  <option value="salida">Salida (- Stock)</option>
                </select>
              ) : (
                <Input
                  id="mov-direction"
                  readOnly
                  value={
                    direction === 'traslado' ? 'Traslado entre bodegas' : 'Salida (- Stock)'
                  }
                  className="bg-muted/50 text-xs font-semibold"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-doc" className="font-semibold text-foreground">
                Documento Soporte *
              </label>
              <Input
                id="mov-doc"
                required
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-qty" className="font-semibold text-foreground">
                Cantidad ({selectedItem.baseUnit}) *
              </label>
              <Input
                id="mov-qty"
                type="number"
                min={0.01}
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-cost" className="font-semibold text-foreground">
                Costo Unitario PEPS (COP) *
              </label>
              <Input
                id="mov-cost"
                type="number"
                min={0}
                step={1}
                required
                readOnly={direction !== 'entrada'}
                value={unitCostCOP}
                onChange={(e) => setUnitCostCOP(e.target.value)}
                className={`text-xs font-mono ${direction !== 'entrada' ? 'bg-muted/50' : ''}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-batch" className="font-semibold text-foreground">
                Lote Afectado *
              </label>
              <Input
                id="mov-batch"
                required
                readOnly={direction !== 'entrada'}
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className={`text-xs font-mono uppercase ${direction !== 'entrada' ? 'bg-muted/50' : ''}`}
              />
            </div>
          </div>

          {direction === 'traslado' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-dest-warehouse" className="font-semibold text-foreground">
                Bodega Destino *
              </label>
              <select
                id="mov-dest-warehouse"
                value={destinationWarehouse}
                onChange={(e) => setDestinationWarehouse(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {WAREHOUSE_LOCATIONS.filter((loc) => loc !== selectedItem.warehouseLocation).map(
                  (loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mov-notes" className="font-semibold text-foreground">
              Observación / Soporte de Planta
            </label>
            <Input
              id="mov-notes"
              placeholder="Ej. Arqueo mensual bodega principal o merma de fundición"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Registrar en Kardex PEPS
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
