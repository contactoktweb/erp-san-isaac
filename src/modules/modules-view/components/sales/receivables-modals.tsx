'use client'

import { useEffect, useState } from 'react'
import { Receipt, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/config'
import { PUC_SALES_ACCOUNTS, type ReceivableRecord } from './sales-constants'

interface CollectionModalProps {
  isOpen: boolean
  receivables: ReceivableRecord[]
  initialReceivableId: string | null
  onClose: () => void
  onConfirmCollection: (payload: {
    receivableId: string
    operationType: 'ABONO_CARTERA' | 'ANTICIPO_280505'
    paymentMethod: string
    reference: string
    amountCOP: number
    notes: string
  }) => void
}

export function CollectionPaymentModal({
  isOpen,
  receivables,
  initialReceivableId,
  onClose,
  onConfirmCollection,
}: CollectionModalProps) {
  const pendingReceivables = receivables.filter((r) => r.pendingBalanceCOP > 0)
  const [selectedReceivableId, setSelectedReceivableId] = useState<string>('')
  const [operationType, setOperationType] = useState<'ABONO_CARTERA' | 'ANTICIPO_280505'>(
    'ABONO_CARTERA'
  )
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancolombia')
  const [reference, setReference] = useState('')
  const [amountCOP, setAmountCOP] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const defaultTarget =
      pendingReceivables.find((r) => r.id === initialReceivableId) ?? pendingReceivables[0]
    if (defaultTarget) {
      setSelectedReceivableId(defaultTarget.id)
      setAmountCOP(defaultTarget.pendingBalanceCOP)
    } else {
      setSelectedReceivableId('')
      setAmountCOP(0)
    }
    setReference(`RC-${Math.floor(1000 + Math.random() * 8999)}`)
    setNotes('')
    setErrorMessage(null)
  }, [isOpen, initialReceivableId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  const activeReceivable = pendingReceivables.find((r) => r.id === selectedReceivableId)
  const maxPayable = activeReceivable?.pendingBalanceCOP ?? 0

  const handleReceivableChange = (id: string) => {
    setSelectedReceivableId(id)
    const found = pendingReceivables.find((r) => r.id === id)
    setAmountCOP(found?.pendingBalanceCOP ?? 0)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!activeReceivable) {
      setErrorMessage('No hay una factura con saldo pendiente seleccionada.')
      return
    }
    if (amountCOP <= 0 || Number.isNaN(amountCOP)) {
      setErrorMessage('El valor del recaudo o anticipo debe ser mayor a cero.')
      return
    }
    if (amountCOP > maxPayable) {
      setErrorMessage(
        `El valor ingresado (${formatCurrency(amountCOP)}) supera el saldo pendiente de la factura (${formatCurrency(maxPayable)}).`
      )
      return
    }

    onConfirmCollection({
      receivableId: activeReceivable.id,
      operationType,
      paymentMethod,
      reference: reference.trim() || `RC-${Date.now()}`,
      amountCOP,
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-collection"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-collection" className="text-base font-bold text-foreground">
              Registrar Recaudo / Abono de Cartera
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal de recaudo"
          >
            <X className="size-4" />
          </button>
        </div>

        {pendingReceivables.length === 0 ? (
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-muted-foreground">
              Todas las facturas registradas en cartera se encuentran en Paz y Salvo ($0 pendiente).
            </p>
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-800 dark:text-rose-300"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="collection-op-type" className="font-semibold text-foreground">
                Concepto Contable PUC *
              </label>
              <select
                id="collection-op-type"
                value={operationType}
                onChange={(e) =>
                  setOperationType(e.target.value as 'ABONO_CARTERA' | 'ANTICIPO_280505')
                }
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ABONO_CARTERA">
                  Abono / Recaudo a Factura (PUC {PUC_SALES_ACCOUNTS.CXC_CLIENTES} Clientes)
                </option>
                <option value="ANTICIPO_280505">
                  Anticipo de Cliente Aplicado (PUC {PUC_SALES_ACCOUNTS.ANTICIPO_CLIENTES} Anticipos)
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="collection-invoice" className="font-semibold text-foreground">
                Factura FEDV / Cliente *
              </label>
              <select
                id="collection-invoice"
                value={selectedReceivableId}
                onChange={(e) => handleReceivableChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                {pendingReceivables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.invoiceNumber} · {r.clientName} (Saldo: {formatCurrency(r.pendingBalanceCOP)})
                  </option>
                ))}
              </select>
            </div>

            {activeReceivable && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Saldo pendiente actual:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(activeReceivable.pendingBalanceCOP)}
                  </span>
                </div>
                <div className="mt-1 text-[0.6875rem] text-muted-foreground">
                  {operationType === 'ANTICIPO_280505'
                    ? `Contabilización: Débito 111005/110505 — Crédito PUC ${PUC_SALES_ACCOUNTS.ANTICIPO_CLIENTES} (Anticipo aplicado a saldo)`
                    : `Contabilización: Débito 111005/110505 — Crédito PUC ${PUC_SALES_ACCOUNTS.CXC_CLIENTES} (Cartera CxC)`}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="collection-amount" className="font-semibold text-foreground">
                  Valor Recibido (COP) *
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="collection-amount"
                    type="number"
                    min={1}
                    max={maxPayable}
                    required
                    value={amountCOP}
                    onChange={(e) => setAmountCOP(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountCOP(maxPayable)}
                    className="shrink-0 text-[0.6875rem]"
                  >
                    Total
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="collection-method" className="font-semibold text-foreground">
                  Medio de Recaudo *
                </label>
                <select
                  id="collection-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
                  <option value="Nequi / Daviplata">Nequi / Daviplata</option>
                  <option value="Efectivo Caja General">Efectivo Caja General</option>
                  <option value="Consignación / Cheque">Consignación / Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="collection-ref" className="font-semibold text-foreground">
                  No. Recibo / Comprobante
                </label>
                <Input
                  id="collection-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="collection-notes" className="font-semibold text-foreground">
                  Observación
                </label>
                <Input
                  id="collection-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                {operationType === 'ANTICIPO_280505'
                  ? 'Registrar Anticipo (PUC 280505)'
                  : 'Registrar Recaudo / Abono'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

interface AuthorizeExceptionModalProps {
  receivable: ReceivableRecord | null
  adminUserName: string
  onClose: () => void
  onAuthorize: (receivable: ReceivableRecord, reason: string) => void
}

export function AuthorizeExceptionModal({
  receivable,
  adminUserName,
  onClose,
  onAuthorize,
}: AuthorizeExceptionModalProps) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (receivable) {
      setReason('Acuerdo de pago radicado por Gerencia — autorización temporal de despacho')
    }
  }, [receivable])

  if (!receivable) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!reason.trim()) return
    onAuthorize(receivable, reason.trim())
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-exception"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-amber-600" aria-hidden="true" />
            <h3 id="modal-title-exception" className="text-base font-bold text-foreground">
              Autorizar Excepción de Pedido (ADMIN)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal de excepción"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-950 dark:text-amber-200">
            <div className="font-semibold">{receivable.clientName}</div>
            <div className="mt-0.5 font-mono text-[0.6875rem]">
              NIT: {receivable.clientNit} · Factura: {receivable.invoiceNumber}
            </div>
            <div className="mt-1 text-[0.6875rem]">
              Mora: <strong>{receivable.overdueDays} días</strong> · Saldo pendiente:{' '}
              <strong>{formatCurrency(receivable.pendingBalanceCOP)}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="exception-reason" className="font-semibold text-foreground">
              Justificación de la Excepción Comercial *
            </label>
            <textarea
              id="exception-reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describa el acuerdo de pago o respaldo gerencial..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-[0.6875rem] text-muted-foreground">
              Responsable registrado en auditoría: <strong>{adminUserName}</strong> (Rol ADMIN)
            </span>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              Autorizar y Registrar en Auditoría
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
