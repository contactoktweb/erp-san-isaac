'use client'

import { useState } from 'react'
import { CalendarPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PayrollWorker } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import {
  NOVEDAD_CATEGORY_CONFIG,
  PAYROLL_RATES,
  calculateNovedadAmountCOP,
  type PayrollNovedad,
  type PayrollNovedadCategory,
  type PayrollPeriodOption,
} from './payroll-calculations'

interface RegisterNovedadModalProps {
  isOpen: boolean
  workers: PayrollWorker[]
  period: PayrollPeriodOption
  onClose: () => void
  onRegisterNovedad: (novedad: PayrollNovedad) => void
}

export function RegisterNovedadModal({
  isOpen,
  workers,
  period,
  onClose,
  onRegisterNovedad,
}: RegisterNovedadModalProps) {
  const defaultWorkerId = workers[0]?.id ?? ''
  const [workerId, setWorkerId] = useState(defaultWorkerId)
  const [category, setCategory] = useState<PayrollNovedadCategory>('horas_extras')
  const [subtypeValue, setSubtypeValue] = useState(
    NOVEDAD_CATEGORY_CONFIG.horas_extras.subtypes[0].value,
  )
  const [quantityRaw, setQuantityRaw] = useState('4')
  const [amountRaw, setAmountRaw] = useState(() => {
    const firstWorker = workers[0]
    if (!firstWorker) return '0'
    return String(
      calculateNovedadAmountCOP(
        firstWorker.baseSalaryCOP,
        'horas_extras',
        NOVEDAD_CATEGORY_CONFIG.horas_extras.subtypes[0].value,
        4,
      ),
    )
  })
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const activeWorker = workers.find((w) => w.id === workerId) ?? workers[0]
  const categoryConfig = NOVEDAD_CATEGORY_CONFIG[category]
  const activeSubtype =
    categoryConfig.subtypes.find((s) => s.value === subtypeValue) ?? categoryConfig.subtypes[0]

  const usesAutoQuantity =
    category === 'horas_extras' || category === 'recargos' || category === 'vacaciones'

  function recalculateAmount(
    targetWorkerId: string,
    nextCategory: PayrollNovedadCategory,
    nextSubtype: string,
    nextQtyRaw: string,
  ) {
    const targetWorker = workers.find((w) => w.id === targetWorkerId) ?? workers[0]
    if (!targetWorker) return
    const qty = Number(nextQtyRaw)
    const suggested = calculateNovedadAmountCOP(
      targetWorker.baseSalaryCOP,
      nextCategory,
      nextSubtype,
      qty,
    )
    if (suggested > 0) {
      setAmountRaw(String(suggested))
    } else if (nextCategory === 'comisiones' || nextCategory === 'descuentos') {
      setAmountRaw('150000')
    }
  }

  function handleWorkerChange(nextWorkerId: string) {
    setWorkerId(nextWorkerId)
    recalculateAmount(nextWorkerId, category, subtypeValue, quantityRaw)
  }

  function handleCategoryChange(nextCategory: PayrollNovedadCategory) {
    const firstSubtype = NOVEDAD_CATEGORY_CONFIG[nextCategory].subtypes[0].value
    const defaultQty =
      nextCategory === 'vacaciones' ? '5' : nextCategory === 'horas_extras' || nextCategory === 'recargos' ? '4' : '1'
    setCategory(nextCategory)
    setSubtypeValue(firstSubtype)
    setQuantityRaw(defaultQty)
    recalculateAmount(workerId, nextCategory, firstSubtype, defaultQty)
  }

  function handleSubtypeChange(nextSubtype: string) {
    setSubtypeValue(nextSubtype)
    recalculateAmount(workerId, category, nextSubtype, quantityRaw)
  }

  function handleQuantityChange(nextQtyRaw: string) {
    setQuantityRaw(nextQtyRaw)
    recalculateAmount(workerId, category, subtypeValue, nextQtyRaw)
  }

  const parsedAmount = Math.round(Number(amountRaw) || 0)
  const parsedQuantity = Number(quantityRaw) || 1

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!activeWorker || parsedAmount <= 0) return

    const novedad: PayrollNovedad = {
      id: `nov-${Date.now()}`,
      periodId: period.id,
      workerId: activeWorker.id,
      workerName: activeWorker.fullName,
      employeeCode: activeWorker.employeeCode,
      category,
      subtypeLabel: activeSubtype.label,
      quantity: parsedQuantity,
      unitLabel: categoryConfig.unitLabel,
      amountCOP: parsedAmount,
      notes: notes.trim() || `${activeSubtype.label} (${period.monthLabel})`,
      createdAt: new Date().toISOString(),
    }

    onRegisterNovedad(novedad)
    setNotes('')
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-novedad"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarPlus className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-novedad" className="text-base font-bold text-foreground">
              Registrar Novedades del Periodo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de novedades"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="rounded-md bg-muted/40 px-3 py-2 flex items-center justify-between border border-border/60">
            <span className="text-muted-foreground">Periodo de Liquidación Activo:</span>
            <span className="font-semibold text-foreground">{period.label}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="novedad-worker" className="font-semibold text-foreground">
              Trabajador *
            </label>
            <select
              id="novedad-worker"
              value={activeWorker?.id ?? ''}
              onChange={(e) => handleWorkerChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.employeeCode} — {w.fullName} ({formatCurrency(w.baseSalaryCOP)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="novedad-category" className="font-semibold text-foreground">
                Tipo de Novedad *
              </label>
              <select
                id="novedad-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PayrollNovedadCategory)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(Object.keys(NOVEDAD_CATEGORY_CONFIG) as PayrollNovedadCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {NOVEDAD_CATEGORY_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="novedad-subtype" className="font-semibold text-foreground">
                Concepto Específico *
              </label>
              <select
                id="novedad-subtype"
                value={subtypeValue}
                onChange={(e) => handleSubtypeChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {categoryConfig.subtypes.map((sub) => (
                  <option key={sub.value} value={sub.value}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="novedad-quantity" className="font-semibold text-foreground">
                Cantidad ({categoryConfig.unitLabel})
              </label>
              <Input
                id="novedad-quantity"
                type="number"
                min={1}
                step={category === 'vacaciones' ? 1 : 0.5}
                value={quantityRaw}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="text-xs font-mono"
              />
              {usesAutoQuantity && activeWorker && (
                <span className="text-[11px] text-muted-foreground">
                  {category === 'vacaciones'
                    ? `Base día: ${formatCurrency(Math.round(activeWorker.baseSalaryCOP / PAYROLL_RATES.DAYS_IN_STANDARD_MONTH))}`
                    : `Base hora (${PAYROLL_RATES.MONTHLY_ORDINARY_HOURS}h): ${formatCurrency(Math.round(activeWorker.baseSalaryCOP / PAYROLL_RATES.MONTHLY_ORDINARY_HOURS))}`}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="novedad-amount" className="font-semibold text-foreground">
                Valor {categoryConfig.impact === 'deduction' ? 'a Descontar' : 'Devengado'} (COP) *
              </label>
              <Input
                id="novedad-amount"
                type="number"
                required
                min={1}
                step={100}
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                className="text-xs font-mono"
              />
              <span
                className={
                  categoryConfig.impact === 'deduction'
                    ? 'text-[11px] text-rose-600 font-medium'
                    : 'text-[11px] text-emerald-600 font-medium'
                }
              >
                {categoryConfig.impact === 'deduction'
                  ? 'Deducción: resta del neto a pagar'
                  : categoryConfig.impact === 'earning_vacation'
                    ? 'Devengado: liquidación de vacaciones'
                    : 'Devengado salarial: suma a IBC y prestaciones'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="novedad-notes" className="font-semibold text-foreground">
              Observación / Soporte
            </label>
            <Input
              id="novedad-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Turno extra producción velón cirio / Cuota 2 de 6 préstamo"
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!activeWorker || parsedAmount <= 0}
              className="font-semibold"
            >
              Registrar Novedad
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
