'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Boxes, Lock, PackagePlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PackingBox, PackingBoxItem, SalesOrder } from '@/database/schemas'
import { formatNumber } from '@/lib/config'
import { getSuggestedPepsBatches, recalculateOrderFromBoxes } from './sales-constants'

interface BoxLineDraft {
  productId: string
  productName: string
  orderedQuantityBase: number
  packedInOtherBoxes: number
  maxAllowedBase: number
  quantityBase: number
  batchNumber: string
  availableBatches: string[]
}

interface PackingBoxModalProps {
  order: SalesOrder | null
  initialBoxId: string | null // null = Armar nueva caja, string = Corregir caja existente
  onClose: () => void
  onSaveOrder: (updatedOrder: SalesOrder, message: string) => void
}

function buildLineDrafts(order: SalesOrder, targetBox: PackingBox | null): BoxLineDraft[] {
  return order.items.map((item) => {
    const existingBoxItem = targetBox?.items.find((bi) => bi.productId === item.productId)
    const currentBoxQty = existingBoxItem?.quantityBase ?? 0
    const packedInOtherBoxes = Math.max(0, item.packedQuantityBase - currentBoxQty)
    const maxAllowedBase = Math.max(0, item.orderedQuantityBase - packedInOtherBoxes)
    const batches = getSuggestedPepsBatches(item.productId, existingBoxItem?.batchNumber)

    return {
      productId: item.productId,
      productName: item.productName,
      orderedQuantityBase: item.orderedQuantityBase,
      packedInOtherBoxes,
      maxAllowedBase,
      quantityBase: currentBoxQty,
      batchNumber: existingBoxItem?.batchNumber ?? batches[0],
      availableBatches: batches,
    }
  })
}

export function PackingBoxModal({
  order,
  initialBoxId,
  onClose,
  onSaveOrder,
}: PackingBoxModalProps) {
  const editableBoxes = order?.boxes.filter((b) => !b.isLocked) ?? []
  const [mode, setMode] = useState<'create' | 'edit'>(initialBoxId ? 'edit' : 'create')
  const [selectedBoxId, setSelectedBoxId] = useState<string>(
    initialBoxId ?? editableBoxes[0]?.id ?? ''
  )
  const [lineDrafts, setLineDrafts] = useState<BoxLineDraft[]>([])
  const [packerUser, setPackerUser] = useState('Jorge Eliécer Duarte')
  const [weightKg, setWeightKg] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!order) return
    const targetBox =
      mode === 'edit' ? order.boxes.find((b) => b.id === selectedBoxId) ?? null : null
    setLineDrafts(buildLineDrafts(order, targetBox))
    if (targetBox) {
      setPackerUser(targetBox.packerUser)
      setWeightKg(targetBox.weightKg !== undefined ? String(targetBox.weightKg) : '')
      setNotes(targetBox.notes ?? '')
    } else {
      setPackerUser('Jorge Eliécer Duarte')
      setWeightKg('')
      setNotes('')
    }
  }, [order, mode, selectedBoxId])

  if (!order) return null

  const isOrderLocked =
    order.orderStatus === 'Despachado/Entregado' || order.orderStatus === 'Cancelado'

  const overpackViolations = lineDrafts.filter((line) => line.quantityBase > line.maxAllowedBase)
  const totalUnitsInBox = lineDrafts.reduce((sum, line) => sum + Math.max(0, line.quantityBase), 0)
  const hasValidationError = overpackViolations.length > 0 || totalUnitsInBox <= 0 || isOrderLocked

  const handleModeSwitch = (nextMode: 'create' | 'edit') => {
    setMode(nextMode)
    if (nextMode === 'edit' && !selectedBoxId && editableBoxes.length > 0) {
      setSelectedBoxId(editableBoxes[0].id)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (hasValidationError) return

    const packedItems: PackingBoxItem[] = lineDrafts
      .filter((line) => line.quantityBase > 0)
      .map((line) => ({
        productId: line.productId,
        productName: line.productName,
        quantityBase: line.quantityBase,
        batchNumber: line.batchNumber,
      }))

    const parsedWeight = weightKg.trim() ? Number(weightKg) : undefined

    let nextBoxes: PackingBox[]
    let feedback: string

    if (mode === 'edit' && selectedBoxId) {
      nextBoxes = order.boxes.map((box) =>
        box.id === selectedBoxId
          ? {
              ...box,
              packerUser: packerUser.trim() || box.packerUser,
              weightKg:
                parsedWeight !== undefined && !Number.isNaN(parsedWeight)
                  ? parsedWeight
                  : box.weightKg,
              notes: notes.trim() || undefined,
              items: packedItems,
            }
          : box
      )
      const targetBox = order.boxes.find((b) => b.id === selectedBoxId)
      feedback = `Caja #${targetBox?.boxNumber ?? ''} corregida en ${order.orderNumber}. Saldos y stock PEPS recalculados.`
    } else {
      const nextNum = order.boxes.length + 1
      const newBox: PackingBox = {
        id: `box-${Date.now()}`,
        boxNumber: nextNum,
        boxLabel: `Caja ${nextNum} de ${nextNum}`,
        packingDate: new Date().toISOString(),
        packerUser: packerUser.trim() || 'Jorge Eliécer Duarte',
        weightKg:
          parsedWeight !== undefined && !Number.isNaN(parsedWeight) ? parsedWeight : undefined,
        notes: notes.trim() || undefined,
        isLocked: false,
        items: packedItems,
      }
      nextBoxes = [...order.boxes, newBox]
      feedback = `Caja #${nextNum} armada en ${order.orderNumber} (${formatNumber(totalUnitsInBox)} uds base con lote PEPS).`
    }

    const updatedOrder = recalculateOrderFromBoxes(order, nextBoxes)
    onSaveOrder(updatedOrder, feedback)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-packing-box"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-packing-box" className="text-base font-bold text-foreground">
              Armar / Corregir Caja Mixta — {order.orderNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal de empaque"
          >
            <X className="size-4" />
          </button>
        </div>

        {isOrderLocked ? (
          <div className="flex flex-col gap-4 text-xs">
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-800 dark:text-rose-300">
              <Lock className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>Bloqueo por Despacho:</strong> Este pedido se encuentra en estado{' '}
                <strong>{order.orderStatus}</strong> y sus cajas de empaque no pueden modificarse.
              </span>
            </div>
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            {/* Selector Armar vs Corregir */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-2.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'create' ? 'default' : 'outline'}
                  onClick={() => handleModeSwitch('create')}
                  className="h-7 gap-1 text-xs"
                >
                  <PackagePlus className="size-3.5" /> Armar Nueva Caja (#{order.boxes.length + 1})
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  disabled={editableBoxes.length === 0}
                  onClick={() => handleModeSwitch('edit')}
                  className="h-7 gap-1 text-xs"
                >
                  Corregir Caja Existente ({editableBoxes.length})
                </Button>
              </div>

              {mode === 'edit' && editableBoxes.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="select-box-to-edit" className="font-medium text-muted-foreground">
                    Caja:
                  </label>
                  <select
                    id="select-box-to-edit"
                    value={selectedBoxId}
                    onChange={(e) => setSelectedBoxId(e.target.value)}
                    className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground"
                  >
                    {editableBoxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.boxLabel}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Alertas de bloqueo de sobre-empaque */}
            {overpackViolations.length > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-rose-800 dark:text-rose-300"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
                <div>
                  <div className="font-bold">Bloqueo Estricto de Sobre-Empaque</div>
                  {overpackViolations.map((v) => (
                    <div key={v.productId} className="text-[0.6875rem]">
                      • {v.productName}: ingresó {formatNumber(v.quantityBase)} uds base, pero el
                      saldo máximo disponible para empacar es {formatNumber(v.maxAllowedBase)} uds.
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla de referencias del pedido con asignación PEPS */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Referencias y Lotes PEPS de la Caja
                </span>
                <Badge variant="outline" className="text-[0.625rem]">
                  Sugerencia automática PEPS (FIFO)
                </Badge>
              </div>

              <div className="divide-y rounded-lg border bg-background">
                {lineDrafts.map((line, idx) => {
                  const isOver = line.quantityBase > line.maxAllowedBase
                  return (
                    <div
                      key={line.productId}
                      className={`grid grid-cols-1 gap-2 p-3 sm:grid-cols-12 sm:items-center ${
                        isOver ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <div className="sm:col-span-5">
                        <div className="font-semibold text-foreground">{line.productName}</div>
                        <div className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                          Pedido: <strong>{formatNumber(line.orderedQuantityBase)}</strong> · Otras
                          cajas: {formatNumber(line.packedInOtherBoxes)} ·{' '}
                          <span className="font-semibold text-foreground">
                            Máx: {formatNumber(line.maxAllowedBase)} uds
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-4">
                        <label
                          htmlFor={`box-batch-${idx}`}
                          className="text-[0.6875rem] font-medium text-muted-foreground"
                        >
                          Lote PEPS
                        </label>
                        <select
                          id={`box-batch-${idx}`}
                          value={line.batchNumber}
                          onChange={(e) => {
                            const val = e.target.value
                            setLineDrafts((prev) =>
                              prev.map((d) =>
                                d.productId === line.productId ? { ...d, batchNumber: val } : d
                              )
                            )
                          }}
                          className="h-8 rounded border border-input bg-background px-2 font-mono text-[0.6875rem] text-foreground"
                        >
                          {line.availableBatches.map((batch, bIdx) => (
                            <option key={batch} value={batch}>
                              {batch}
                              {bIdx === 0 ? ' (PEPS)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1 sm:col-span-3">
                        <label
                          htmlFor={`box-qty-${idx}`}
                          className="text-[0.6875rem] font-medium text-muted-foreground"
                        >
                          Uds en esta caja
                        </label>
                        <div className="flex items-center gap-1">
                          <Input
                            id={`box-qty-${idx}`}
                            type="number"
                            min={0}
                            value={line.quantityBase}
                            aria-invalid={isOver}
                            onChange={(e) => {
                              const qty = Math.max(0, Math.floor(Number(e.target.value) || 0))
                              setLineDrafts((prev) =>
                                prev.map((d) =>
                                  d.productId === line.productId ? { ...d, quantityBase: qty } : d
                                )
                              )
                            }}
                            className="h-8 text-right font-mono text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={line.maxAllowedBase === 0}
                            onClick={() => {
                              setLineDrafts((prev) =>
                                prev.map((d) =>
                                  d.productId === line.productId
                                    ? { ...d, quantityBase: d.maxAllowedBase }
                                    : d
                                )
                              )
                            }}
                            className="h-8 px-2 text-[0.625rem]"
                            title="Completar saldo pendiente"
                          >
                            Máx
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Datos de empaque */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="box-packer" className="font-semibold text-foreground">
                  Operario Empacador *
                </label>
                <Input
                  id="box-packer"
                  required
                  value={packerUser}
                  onChange={(e) => setPackerUser(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="box-weight" className="font-semibold text-foreground">
                  Peso Total Caja (kg)
                </label>
                <Input
                  id="box-weight"
                  type="number"
                  step="0.1"
                  min={0}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Ej. 21.5"
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="box-notes" className="font-semibold text-foreground">
                  Observaciones
                </label>
                <Input
                  id="box-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Protección burbuja / ajuste cubicaje"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between border-t pt-4">
              <span className="text-[0.6875rem] text-muted-foreground">
                Total unidades en caja:{' '}
                <strong className="font-mono text-foreground">
                  {formatNumber(totalUnitsInBox)} uds base
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={hasValidationError}
                  className="font-semibold"
                >
                  {mode === 'edit' ? 'Guardar Corrección de Caja' : 'Registrar Caja en Pedido'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
