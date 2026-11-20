'use client'

import { useState } from 'react'
import { AlertTriangle, Calculator, Factory, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProductionOrder } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import {
  computeSheetCosts,
  type MaterialCostItem,
  type TechnicalSheet,
} from './production-types'

interface NewProductionOrderModalProps {
  isOpen: boolean
  onClose: () => void
  sheets: TechnicalSheet[]
  existingOrdersCount: number
  onCreateOrder: (order: ProductionOrder) => void
}

export function NewProductionOrderModal({
  isOpen,
  onClose,
  sheets,
  existingOrdersCount,
  onCreateOrder,
}: NewProductionOrderModalProps) {
  const defaultSheet = sheets[0]
  const defaultUnitCost = defaultSheet ? computeSheetCosts(defaultSheet).totalUnitCost : 3950
  const nextSeq = String(81 + existingOrdersCount).padStart(3, '0')

  const [orderNumber, setOrderNumber] = useState(`OP-2026-${nextSeq}`)
  const [selectedFormulaCode, setSelectedFormulaCode] = useState(
    defaultSheet?.formulaCode ?? 'FORM-V3D-REF'
  )
  const [productName, setProductName] = useState(
    defaultSheet?.productName ?? 'Velón Votivo Blanco 3 Días San Isaac'
  )
  const [plannedQuantity, setPlannedQuantity] = useState('1000')
  const [producedQuantity, setProducedQuantity] = useState('0')
  const [wasteKg, setWasteKg] = useState('0')
  const [targetBatch, setTargetBatch] = useState(`LOT-PT-2026-${120 + existingOrdersCount}`)
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountingStatus, setAccountingStatus] =
    useState<ProductionOrder['accountingStatus']>('Programada')
  const [estimatedCostCOP, setEstimatedCostCOP] = useState(String(defaultUnitCost * 1000))
  const [realCostCOP, setRealCostCOP] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  function handleFormulaChange(code: string) {
    setSelectedFormulaCode(code)
    const sheet = sheets.find((s) => s.formulaCode === code)
    if (sheet) {
      setProductName(sheet.productName)
      const qty = Math.max(1, Number(plannedQuantity) || 1)
      const { totalUnitCost } = computeSheetCosts(sheet)
      setEstimatedCostCOP(String(Math.round(qty * totalUnitCost)))
    }
  }

  function handlePlannedQtyChange(val: string) {
    setPlannedQuantity(val)
    const qty = Number(val)
    const sheet = sheets.find((s) => s.formulaCode === selectedFormulaCode)
    if (sheet && Number.isFinite(qty) && qty > 0) {
      const { totalUnitCost } = computeSheetCosts(sheet)
      setEstimatedCostCOP(String(Math.round(qty * totalUnitCost)))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanOrder = orderNumber.trim().toUpperCase()
    const cleanProduct = productName.trim()
    const cleanBatch = targetBatch.trim().toUpperCase()
    const plannedNum = Math.round(Number(plannedQuantity))
    const producedNum = Math.round(Number(producedQuantity))
    const wasteNum = Number(wasteKg)
    const estimatedNum = Math.round(Number(estimatedCostCOP))
    const realNum = realCostCOP.trim() === '' ? undefined : Math.round(Number(realCostCOP))

    if (!cleanOrder || !cleanProduct || !cleanBatch || !startDate) {
      setError('Complete todos los campos obligatorios marcados con *.')
      return
    }
    if (!Number.isFinite(plannedNum) || plannedNum <= 0) {
      setError('La cantidad programada debe ser mayor a 0.')
      return
    }
    if (!Number.isFinite(producedNum) || producedNum < 0) {
      setError('La cantidad real producida debe ser mayor o igual a 0.')
      return
    }
    if (!Number.isFinite(wasteNum) || wasteNum < 0) {
      setError('La merma (kg) debe ser un valor válido igual o mayor a 0.')
      return
    }
    if (!Number.isFinite(estimatedNum) || estimatedNum <= 0) {
      setError('El costo estimado debe ser mayor a $0.')
      return
    }
    if (realNum !== undefined && (!Number.isFinite(realNum) || realNum < 0)) {
      setError('El costo real debe ser válido.')
      return
    }

    const derivedStatus: ProductionOrder['status'] =
      accountingStatus === 'Terminada en Bodega (PUC 1430)'
        ? 'Terminada'
        : accountingStatus === 'En proceso (PUC 1410)'
        ? 'En proceso'
        : 'Programada'

    const newOrder: ProductionOrder = {
      id: `prod-${Date.now()}`,
      orderNumber: cleanOrder,
      productName: cleanProduct,
      formulaCode: selectedFormulaCode,
      plannedQuantity: plannedNum,
      producedQuantity: producedNum,
      wasteKg: wasteNum,
      targetBatch: cleanBatch,
      startDate: `${startDate}T08:00:00.000Z`,
      status: derivedStatus,
      estimatedCostCOP: estimatedNum,
      realCostCOP: realNum,
      accountingStatus,
    }

    setError(null)
    onCreateOrder(newOrder)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-new-order"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Factory className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-new-order" className="text-base font-bold text-foreground">
              Nueva Orden de Producción
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de orden de producción"
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-number" className="font-semibold text-foreground">
                No. de Orden *
              </label>
              <Input
                id="op-number"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-formula" className="font-semibold text-foreground">
                Ficha Técnica / Receta *
              </label>
              <select
                id="op-formula"
                value={selectedFormulaCode}
                onChange={(e) => handleFormulaChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {sheets.map((s) => (
                  <option key={s.id} value={s.formulaCode}>
                    {s.formulaCode} — {s.productName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="op-product" className="font-semibold text-foreground">
              Producto a Fabricar *
            </label>
            <Input
              id="op-product"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-planned" className="font-semibold text-foreground">
                Cant. Programada (uds) *
              </label>
              <Input
                id="op-planned"
                type="number"
                min={1}
                step={1}
                required
                value={plannedQuantity}
                onChange={(e) => handlePlannedQtyChange(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-produced" className="font-semibold text-foreground">
                Cant. Real Producida (uds)
              </label>
              <Input
                id="op-produced"
                type="number"
                min={0}
                step={1}
                value={producedQuantity}
                onChange={(e) => setProducedQuantity(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-waste" className="font-semibold text-foreground">
                Merma Estimada / Real (kg)
              </label>
              <Input
                id="op-waste"
                type="number"
                min={0}
                step="0.1"
                value={wasteKg}
                onChange={(e) => setWasteKg(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-batch" className="font-semibold text-foreground">
                Lote Destino *
              </label>
              <Input
                id="op-batch"
                required
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-date" className="font-semibold text-foreground">
                Fecha de Inicio *
              </label>
              <Input
                id="op-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-status" className="font-semibold text-foreground">
                Estado Operativo y Contable *
              </label>
              <select
                id="op-status"
                value={accountingStatus}
                onChange={(e) =>
                  setAccountingStatus(e.target.value as ProductionOrder['accountingStatus'])
                }
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Programada">Programada</option>
                <option value="En proceso (PUC 1410)">En proceso (PUC 141001)</option>
                <option value="Terminada en Bodega (PUC 1430)">
                  Terminada en Bodega (PUC 143005)
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-est-cost" className="font-semibold text-foreground">
                Costo Estimado Total (COP) *
              </label>
              <Input
                id="op-est-cost"
                type="number"
                min={1}
                step={1}
                required
                value={estimatedCostCOP}
                onChange={(e) => setEstimatedCostCOP(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="op-real-cost" className="font-semibold text-foreground">
                Costo Real Liquidado (COP, opcional)
              </label>
              <Input
                id="op-real-cost"
                type="number"
                min={0}
                step={1}
                placeholder="Vacío si está programada"
                value={realCostCOP}
                onChange={(e) => setRealCostCOP(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Crear Orden de Producción
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface NewTechnicalSheetModalProps {
  isOpen: boolean
  onClose: () => void
  existingSheets: TechnicalSheet[]
  onCreateSheet: (sheet: TechnicalSheet) => void
}

export function NewTechnicalSheetModal({
  isOpen,
  onClose,
  existingSheets,
  onCreateSheet,
}: NewTechnicalSheetModalProps) {
  const [formulaCode, setFormulaCode] = useState('')
  const [productName, setProductName] = useState('')
  const [baseUnitLabel, setBaseUnitLabel] = useState('1 unidad (250 g)')
  const [materials, setMaterials] = useState<MaterialCostItem[]>([
    {
      id: 'mat-1',
      name: 'Parafina Semi-refinada 58/60',
      quantitySpec: '220 g • Merma 3.0%',
      costCOP: 2150,
    },
    {
      id: 'mat-2',
      name: 'Pabilo Algodón Trenzado',
      quantitySpec: '15 cm',
      costCOP: 65,
    },
  ])
  const [modCost, setModCost] = useState('650')
  const [gasCost, setGasCost] = useState('210')
  const [energyCost, setEnergyCost] = useState('120')
  const [depreciationCost, setDepreciationCost] = useState('130')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const rawMaterialsTotal = materials.reduce((acc, m) => acc + (Number(m.costCOP) || 0), 0)
  const modNum = Math.round(Number(modCost) || 0)
  const cifNum =
    Math.round(Number(gasCost) || 0) +
    Math.round(Number(energyCost) || 0) +
    Math.round(Number(depreciationCost) || 0)
  const computedTotalCost = rawMaterialsTotal + modNum + cifNum

  function handleAddMaterialRow() {
    setMaterials((prev) => [
      ...prev,
      { id: `mat-${Date.now()}`, name: '', quantitySpec: '', costCOP: 0 },
    ])
  }

  function handleUpdateMaterialRow(
    id: string,
    field: keyof MaterialCostItem,
    value: string | number
  ) {
    setMaterials((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  function handleRemoveMaterialRow(id: string) {
    if (materials.length <= 1) return
    setMaterials((prev) => prev.filter((row) => row.id !== id))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cleanCode = formulaCode.trim().toUpperCase()
    const cleanName = productName.trim()
    const cleanUnit = baseUnitLabel.trim()

    if (!cleanCode || !cleanName || !cleanUnit) {
      setError('Complete el código de fórmula, nombre del producto y unidad base.')
      return
    }
    if (existingSheets.some((s) => s.formulaCode.toUpperCase() === cleanCode)) {
      setError(`Ya existe una ficha técnica con el código "${cleanCode}".`)
      return
    }
    if (materials.some((m) => !m.name.trim() || m.costCOP < 0)) {
      setError('Verifique que todos los insumos tengan nombre y costo válido.')
      return
    }
    if (computedTotalCost <= 0) {
      setError('El costo unitario total debe ser mayor a $0.')
      return
    }

    const newSheet: TechnicalSheet = {
      id: `sheet-${Date.now()}`,
      formulaCode: cleanCode,
      productName: cleanName,
      baseUnitLabel: cleanUnit,
      materials: materials.map((m) => ({
        ...m,
        name: m.name.trim(),
        quantitySpec: m.quantitySpec.trim() || 'Según fórmula',
        costCOP: Math.round(Number(m.costCOP) || 0),
      })),
      overheads: [
        {
          id: `o-mod-${Date.now()}`,
          name: 'MOD Moldeo, Vaciado y Empaque',
          detailSpec: 'Tarifa estándar planta',
          costCOP: modNum,
          isLabor: true,
        },
        {
          id: 'o-gas',
          name: 'Gas Industrial Calderas y Pailas',
          detailSpec: 'Prorrateo térmico por lote',
          costCOP: Math.round(Number(gasCost) || 0),
        },
        {
          id: 'o-ene',
          name: 'Energía Eléctrica y Maquinaria',
          detailSpec: 'Consumo extractores y luz',
          costCOP: Math.round(Number(energyCost) || 0),
        },
        {
          id: 'o-dep',
          name: 'Depreciación Moldes y Arriendo Planta',
          detailSpec: 'Cuota fija imputada',
          costCOP: Math.round(Number(depreciationCost) || 0),
        },
      ],
    }

    setError(null)
    onCreateSheet(newSheet)
    setFormulaCode('')
    setProductName('')
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-new-sheet"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-new-sheet" className="text-base font-bold text-foreground">
              Nueva Ficha Técnica y Hoja de Costos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de ficha técnica"
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
              <label htmlFor="sheet-code" className="font-semibold text-foreground">
                Código Fórmula *
              </label>
              <Input
                id="sheet-code"
                required
                placeholder="Ej. FORM-CIR-BAUT"
                value={formulaCode}
                onChange={(e) => setFormulaCode(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="sheet-name" className="font-semibold text-foreground">
                Nombre del Producto / Receta *
              </label>
              <Input
                id="sheet-name"
                required
                placeholder="Ej. Cirio para Bautizo 5x30 cm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sheet-unit" className="font-semibold text-foreground">
              Unidad Base *
            </label>
            <Input
              id="sheet-unit"
              required
              value={baseUnitLabel}
              onChange={(e) => setBaseUnitLabel(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Insumos Directos (Panel A) */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-foreground">
                Insumos Directos (Panel A): {formatCurrency(rawMaterialsTotal)}
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={handleAddMaterialRow}
                className="gap-1 text-[0.6875rem]"
              >
                <Plus className="size-3" aria-hidden="true" />
                Agregar Insumo
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {materials.map((mat, index) => (
                <div key={mat.id} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                  <div className="sm:col-span-5">
                    <label htmlFor={`mat-name-${mat.id}`} className="sr-only">
                      Insumo {index + 1}
                    </label>
                    <Input
                      id={`mat-name-${mat.id}`}
                      placeholder="Nombre insumo / materia prima"
                      value={mat.name}
                      onChange={(e) => handleUpdateMaterialRow(mat.id, 'name', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label htmlFor={`mat-spec-${mat.id}`} className="sr-only">
                      Dosificación {index + 1}
                    </label>
                    <Input
                      id={`mat-spec-${mat.id}`}
                      placeholder="Cant. / % merma"
                      value={mat.quantitySpec}
                      onChange={(e) =>
                        handleUpdateMaterialRow(mat.id, 'quantitySpec', e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`mat-cost-${mat.id}`} className="sr-only">
                      Costo COP {index + 1}
                    </label>
                    <Input
                      id={`mat-cost-${mat.id}`}
                      type="number"
                      min={0}
                      step={1}
                      value={mat.costCOP}
                      onChange={(e) =>
                        handleUpdateMaterialRow(mat.id, 'costCOP', Number(e.target.value))
                      }
                      className="h-8 text-right font-mono text-xs"
                    />
                  </div>
                  <div className="flex justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterialRow(mat.id)}
                      disabled={materials.length <= 1}
                      aria-label={`Eliminar insumo ${index + 1}`}
                      className="p-1 text-muted-foreground hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MOD y CIF (Panel B) */}
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="mb-2 font-bold text-foreground">
              MOD y CIF Prorrateados (Panel B): {formatCurrency(modNum + cifNum)}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="sheet-mod" className="text-[0.6875rem] font-medium">
                  MOD Operarios ($)
                </label>
                <Input
                  id="sheet-mod"
                  type="number"
                  min={0}
                  step={1}
                  value={modCost}
                  onChange={(e) => setModCost(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sheet-gas" className="text-[0.6875rem] font-medium">
                  Gas Calderas ($)
                </label>
                <Input
                  id="sheet-gas"
                  type="number"
                  min={0}
                  step={1}
                  value={gasCost}
                  onChange={(e) => setGasCost(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sheet-energy" className="text-[0.6875rem] font-medium">
                  Energía Eléctrica ($)
                </label>
                <Input
                  id="sheet-energy"
                  type="number"
                  min={0}
                  step={1}
                  value={energyCost}
                  onChange={(e) => setEnergyCost(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sheet-depr" className="text-[0.6875rem] font-medium">
                  Deprec. y Arriendo ($)
                </label>
                <Input
                  id="sheet-depr"
                  type="number"
                  min={0}
                  step={1}
                  value={depreciationCost}
                  onChange={(e) => setDepreciationCost(e.target.value)}
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5">
            <span className="font-semibold text-foreground">Costo Unitario Total Calculado:</span>
            <span className="font-mono text-sm font-bold text-primary">
              {formatCurrency(computedTotalCost)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Guardar Ficha Técnica
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
