'use client'

import { useId, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, FilePlus2, Plus, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/config'
import { COMMON_PUC_CATALOG, THIRD_PARTY_SUGGESTIONS } from './accounting-data'
import {
  COST_CENTERS,
  VOUCHER_TYPES,
  type ExtendedAccountEntry,
  type JournalVoucher,
  type JournalVoucherLine,
  type VoucherType,
} from './types'

interface PucJournalModalProps {
  isOpen: boolean
  accounts: ExtendedAccountEntry[]
  nextVoucherNumber: string
  isFiscalPeriodClosed: boolean
  onClose: () => void
  onSave: (voucher: JournalVoucher) => void
}

function createEmptyLine(index: number, defaultCode: string, defaultName: string): JournalVoucherLine {
  return {
    id: `line-${Date.now()}-${index}`,
    accountCode: defaultCode,
    accountName: defaultName,
    thirdParty: '',
    costCenter: COST_CENTERS[1],
    debitCOP: 0,
    creditCOP: 0,
  }
}

export function PucJournalModal({
  isOpen,
  accounts,
  nextVoucherNumber,
  isFiscalPeriodClosed,
  onClose,
  onSave,
}: PucJournalModalProps) {
  const titleId = useId()
  const datalistId = useId()
  const voucherNumberId = useId()
  const dateId = useId()
  const typeId = useId()
  const descriptionId = useId()

  const accountOptions = useMemo(() => {
    const existing = accounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      defaultCostCenter: acc.costCenter,
    }))
    const extras = COMMON_PUC_CATALOG.filter(
      (item) => !existing.some((acc) => acc.code === item.code)
    )
    return [...existing, ...extras].sort((a, b) => a.code.localeCompare(b.code))
  }, [accounts])

  const defaultFirst = accountOptions[0] ?? { code: '111005', name: 'Bancos Nacionales', defaultCostCenter: COST_CENTERS[1] }
  const defaultSecond = accountOptions[1] ?? { code: '220501', name: 'Proveedores Nacionales', defaultCostCenter: COST_CENTERS[1] }

  const [voucherNumber, setVoucherNumber] = useState(nextVoucherNumber)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [type, setType] = useState<VoucherType>('Comprobante de Diario')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<JournalVoucherLine[]>(() => [
    createEmptyLine(1, defaultFirst.code, defaultFirst.name),
    createEmptyLine(2, defaultSecond.code, defaultSecond.name),
  ])

  if (!isOpen) return null

  const totalDebitCOP = lines.reduce((sum, line) => sum + (Number.isFinite(line.debitCOP) ? line.debitCOP : 0), 0)
  const totalCreditCOP = lines.reduce((sum, line) => sum + (Number.isFinite(line.creditCOP) ? line.creditCOP : 0), 0)
  const differenceCOP = Math.abs(totalDebitCOP - totalCreditCOP)
  const hasValidLines = lines.every(
    (line) => line.accountCode.trim().length > 0 && (line.debitCOP > 0 || line.creditCOP > 0)
  )
  const isBalancedAndPositive =
    totalDebitCOP > 0 &&
    totalDebitCOP === totalCreditCOP &&
    hasValidLines &&
    description.trim().length > 0 &&
    !isFiscalPeriodClosed

  const handleSelectAccount = (lineId: string, selectedCode: string) => {
    const found = accountOptions.find((opt) => opt.code === selectedCode)
    setLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              accountCode: selectedCode,
              accountName: found?.name ?? line.accountName,
              costCenter: found?.defaultCostCenter ?? line.costCenter,
            }
          : line
      )
    )
  }

  const handleUpdateLine = <K extends keyof JournalVoucherLine>(
    lineId: string,
    field: K,
    value: JournalVoucherLine[K]
  ) => {
    setLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, [field]: value } : line))
    )
  }

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      createEmptyLine(prev.length + 1, defaultFirst.code, defaultFirst.name),
    ])
  }

  const handleRemoveLine = (lineId: string) => {
    if (lines.length <= 2) return
    setLines((prev) => prev.filter((line) => line.id !== lineId))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isBalancedAndPositive) return

    onSave({
      id: `vch-${Date.now()}`,
      voucherNumber: voucherNumber.trim() || nextVoucherNumber,
      date,
      type,
      description: description.trim(),
      totalDebitCOP,
      totalCreditCOP,
      lines: lines.map((line) => ({
        ...line,
        thirdParty: line.thirdParty.trim() || 'Velas, Velones y Cirios San Isaac SAS (901473704-4)',
      })),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FilePlus2 className="size-4 text-primary" aria-hidden="true" />
            <h3 id={titleId} className="text-base font-bold text-foreground">
              Nuevo Comprobante / Asiento Diario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de comprobante contable"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {isFiscalPeriodClosed && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span>
              El periodo fiscal está bloqueado. Desbloquee el periodo desde la pestaña PUC antes de contabilizar nuevos comprobantes.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={voucherNumberId} className="font-semibold text-foreground">
                Consecutivo *
              </label>
              <Input
                id={voucherNumberId}
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                required
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={dateId} className="font-semibold text-foreground">
                Fecha Contable *
              </label>
              <Input
                id={dateId}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor={typeId} className="font-semibold text-foreground">
                Tipo de Comprobante *
              </label>
              <select
                id={typeId}
                value={type}
                onChange={(e) => setType(e.target.value as VoucherType)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {VOUCHER_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={descriptionId} className="font-semibold text-foreground">
              Concepto / Descripción del Asiento *
            </label>
            <Input
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Causación factura de gas planta Guaduas o ajuste de inventario"
              required
              className="h-9 text-xs"
            />
          </div>

          <datalist id={datalistId}>
            {THIRD_PARTY_SUGGESTIONS.map((tp) => (
              <option key={tp} value={tp} />
            ))}
          </datalist>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Líneas de Imputación Contable (Partida Doble)
              </h4>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddLine}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Agregar línea
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-2.5 py-2">Cuenta PUC</th>
                    <th scope="col" className="px-2.5 py-2">Tercero / NIT</th>
                    <th scope="col" className="px-2.5 py-2">Centro Costos</th>
                    <th scope="col" className="px-2.5 py-2 text-right">Débito ($)</th>
                    <th scope="col" className="px-2.5 py-2 text-right">Crédito ($)</th>
                    <th scope="col" className="px-2 py-2 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lines.map((line, index) => (
                    <tr key={line.id}>
                      <td className="p-2 min-w-[210px]">
                        <select
                          aria-label={`Cuenta PUC línea ${index + 1}`}
                          value={line.accountCode}
                          onChange={(e) => handleSelectAccount(line.id, e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {accountOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.code} — {opt.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 min-w-[170px]">
                        <Input
                          aria-label={`Tercero línea ${index + 1}`}
                          list={datalistId}
                          value={line.thirdParty}
                          onChange={(e) => handleUpdateLine(line.id, 'thirdParty', e.target.value)}
                          placeholder="NIT o Razón Social"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2 min-w-[155px]">
                        <select
                          aria-label={`Centro de costos línea ${index + 1}`}
                          value={line.costCenter}
                          onChange={(e) => handleUpdateLine(line.id, 'costCenter', e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {COST_CENTERS.map((cc) => (
                            <option key={cc} value={cc}>
                              {cc}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 w-32">
                        <Input
                          aria-label={`Valor débito línea ${index + 1}`}
                          type="number"
                          min={0}
                          step={1}
                          value={line.debitCOP || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const nextDebit = Math.max(0, Math.round(Number(e.target.value) || 0))
                            setLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? {
                                      ...item,
                                      debitCOP: nextDebit,
                                      creditCOP: nextDebit > 0 ? 0 : item.creditCOP,
                                    }
                                  : item
                              )
                            )
                          }}
                          className="h-8 text-right font-mono text-xs"
                        />
                      </td>
                      <td className="p-2 w-32">
                        <Input
                          aria-label={`Valor crédito línea ${index + 1}`}
                          type="number"
                          min={0}
                          step={1}
                          value={line.creditCOP || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const nextCredit = Math.max(0, Math.round(Number(e.target.value) || 0))
                            setLines((prev) =>
                              prev.map((item) =>
                                item.id === line.id
                                  ? {
                                      ...item,
                                      creditCOP: nextCredit,
                                      debitCOP: nextCredit > 0 ? 0 : item.debitCOP,
                                    }
                                  : item
                              )
                            )
                          }}
                          className="h-8 text-right font-mono text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          disabled={lines.length <= 2}
                          onClick={() => handleRemoveLine(line.id)}
                          aria-label={`Eliminar línea ${index + 1}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-muted-foreground">Suma Débitos: </span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(totalDebitCOP)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Suma Créditos: </span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(totalCreditCOP)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Diferencia: </span>
                <span
                  className={`font-mono font-bold ${
                    differenceCOP === 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatCurrency(differenceCOP)}
                </span>
              </div>
            </div>

            {totalDebitCOP > 0 && totalDebitCOP === totalCreditCOP ? (
              <Badge variant="success" className="gap-1 text-xs">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Partida Doble Cuadrada
              </Badge>
            ) : (
              <Badge variant="danger" className="gap-1 text-xs">
                <AlertCircle className="size-3.5" aria-hidden="true" />
                {totalDebitCOP === 0 && totalCreditCOP === 0
                  ? 'Ingrese montos mayores a $0'
                  : 'Débitos y Créditos deben ser iguales'}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isBalancedAndPositive}
              className="font-semibold"
            >
              Contabilizar Comprobante
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
