'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BookMarked, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ShareholderRecord } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import {
  CORPORATE_COMPANY,
  getNextCertificateNumber,
  type ShareMovementRecord,
  type ShareMovementType,
} from './corporate-constants'

interface ShareMovementModalProps {
  isOpen: boolean
  onClose: () => void
  shareholders: ShareholderRecord[]
  reserveShares: number
  onApplyMovement: (
    updatedShareholders: ShareholderRecord[],
    movement: ShareMovementRecord
  ) => void
}

function recalculatePercentages(list: ShareholderRecord[]): ShareholderRecord[] {
  const totalShares = list.reduce((sum, item) => sum + item.shareCount, 0)
  return list.map((item) => ({
    ...item,
    sharePercentage:
      totalShares > 0 ? Number(((item.shareCount / totalShares) * 100).toFixed(2)) : 0,
  }))
}

export function ShareMovementModal({
  isOpen,
  onClose,
  shareholders,
  reserveShares,
  onApplyMovement,
}: ShareMovementModalProps) {
  const activeShareholders = shareholders.filter((sh) => sh.shareCount > 0)

  const [movementType, setMovementType] = useState<ShareMovementType>('Emisión')
  const [targetMode, setTargetMode] = useState<'new' | 'existing'>('new')
  const [existingTargetId, setExistingTargetId] = useState<string>(
    activeShareholders[0]?.id ?? ''
  )
  const [cedentId, setCedentId] = useState<string>(activeShareholders[0]?.id ?? '')
  const [newName, setNewName] = useState('')
  const [newDocument, setNewDocument] = useState('')
  const [shareType, setShareType] = useState('Ordinarias de capital — únicas con voz y voto')
  const [sharesInput, setSharesInput] = useState('10')
  const [paidAmountInput, setPaidAmountInput] = useState('3000000')
  const [isPaidAutoSynced, setIsPaidAutoSynced] = useState(true)
  const [movementDate, setMovementDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [minuteReference, setMinuteReference] = useState('Acta No. 10 — Asamblea Extraordinaria')
  const [certificateNumber, setCertificateNumber] = useState(() =>
    getNextCertificateNumber(shareholders)
  )
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const firstActive = shareholders.find((sh) => sh.shareCount > 0)?.id ?? ''
    setMovementType('Emisión')
    setTargetMode('new')
    setExistingTargetId(firstActive)
    setCedentId(firstActive)
    setNewName('')
    setNewDocument('')
    setShareType('Ordinarias de capital — únicas con voz y voto')
    setSharesInput('10')
    setPaidAmountInput(String(10 * CORPORATE_COMPANY.nominalValuePerShareCOP))
    setIsPaidAutoSynced(true)
    setMovementDate(new Date().toISOString().slice(0, 10))
    setMinuteReference('Acta No. 10 — Asamblea Extraordinaria')
    setCertificateNumber(getNextCertificateNumber(shareholders))
    setFormError(null)
  }, [isOpen, shareholders])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const parsedShares = Number.parseInt(sharesInput, 10)
  const safeShares = Number.isNaN(parsedShares) || parsedShares < 0 ? 0 : parsedShares
  const nominalTotalCOP = safeShares * CORPORATE_COMPANY.nominalValuePerShareCOP

  const parsedPaid = Number.parseInt(paidAmountInput, 10)
  const safePaidCOP =
    movementType === 'Cesión'
      ? nominalTotalCOP
      : Number.isNaN(parsedPaid) || parsedPaid < 0
        ? 0
        : parsedPaid
  const pendingCOP = Math.max(0, nominalTotalCOP - safePaidCOP)

  const cedent = activeShareholders.find((sh) => sh.id === cedentId)
  const maxCedentShares = cedent?.shareCount ?? 0

  const exceedsReserve =
    movementType !== 'Cesión' && safeShares > reserveShares
  const exceedsCedent =
    movementType === 'Cesión' && safeShares > maxCedentShares
  const paidExceedsNominal =
    movementType !== 'Cesión' && safePaidCOP > nominalTotalCOP

  const handleSharesChange = (val: string) => {
    setSharesInput(val)
    setFormError(null)
    if (isPaidAutoSynced) {
      const n = Number.parseInt(val, 10)
      if (!Number.isNaN(n) && n >= 0) {
        setPaidAmountInput(String(n * CORPORATE_COMPANY.nominalValuePerShareCOP))
      } else {
        setPaidAmountInput('0')
      }
    }
  }

  const handleMovementTypeChange = (nextType: ShareMovementType) => {
    setMovementType(nextType)
    setFormError(null)
    if (nextType === 'Cesión') {
      const defaultCedent = activeShareholders[0]?.id ?? ''
      setCedentId(defaultCedent)
      setTargetMode('new')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (safeShares <= 0) {
      setFormError('Debe ingresar una cantidad entera mayor a cero (0) acciones.')
      return
    }

    if (exceedsReserve) {
      setFormError(
        `No puede emitir ni suscribir ${safeShares} acciones: supera las ${reserveShares} acciones disponibles en reserva (de ${CORPORATE_COMPANY.authorizedShares} autorizadas).`
      )
      return
    }

    if (paidExceedsNominal) {
      setFormError('El valor pagado no puede superar el valor nominal suscrito.')
      return
    }

    if (movementType === 'Cesión') {
      if (!cedent) {
        setFormError('Seleccione el accionista cedente.')
        return
      }
      if (exceedsCedent) {
        setFormError(
          `El cedente ${cedent.shareholderName} solo dispone de ${cedent.shareCount} acciones.`
        )
        return
      }
      if (targetMode === 'existing' && existingTargetId === cedent.id) {
        setFormError('El cesionario debe ser un accionista distinto al cedente.')
        return
      }
    }

    if (targetMode === 'new' && (!newName.trim() || !newDocument.trim())) {
      setFormError('Ingrese el nombre completo y el documento de identificación del accionista.')
      return
    }

    const deadlineDate = new Date(`${movementDate}T00:00:00.000Z`)
    deadlineDate.setFullYear(
      deadlineDate.getFullYear() + CORPORATE_COMPANY.maxPaymentYearsLey1258
    )
    const entryIso = `${movementDate}T00:00:00.000Z`

    let nextShareholders = [...shareholders]
    let movementRecord: ShareMovementRecord

    if (movementType === 'Cesión' && cedent) {
      const cedentSubscribed = cedent.subscribedCapitalCOP ?? cedent.totalCapitalCOP
      const cedentPaid = cedent.paidCapitalCOP ?? cedentSubscribed
      const transferRatio = safeShares / cedent.shareCount
      const transferredPaid = Math.round(cedentPaid * transferRatio)
      const transferredPending = Math.max(0, nominalTotalCOP - transferredPaid)

      const remainingShares = cedent.shareCount - safeShares
      const remainingSubscribed = remainingShares * CORPORATE_COMPANY.nominalValuePerShareCOP
      const remainingPaid = Math.max(0, cedentPaid - transferredPaid)
      const remainingPending = Math.max(0, remainingSubscribed - remainingPaid)

      nextShareholders = nextShareholders.map((sh) => {
        if (sh.id !== cedent.id) return sh
        return {
          ...sh,
          shareCount: remainingShares,
          totalCapitalCOP: remainingSubscribed,
          subscribedCapitalCOP: remainingSubscribed,
          paidCapitalCOP: remainingPaid,
          pendingCapitalCOP: remainingPending,
          paymentStatus:
            remainingShares === 0
              ? 'Cesión Total'
              : remainingPending === 0
                ? '100% Pagado'
                : 'Pago Parcial en Plazo',
          status: remainingShares === 0 ? 'Inactivo' : sh.status,
          lastMinuteRecord: minuteReference.trim() || sh.lastMinuteRecord,
        }
      })

      if (targetMode === 'existing') {
        const target = nextShareholders.find((sh) => sh.id === existingTargetId)
        if (!target) return
        const prevSubscribed = target.subscribedCapitalCOP ?? target.totalCapitalCOP
        const prevPaid = target.paidCapitalCOP ?? prevSubscribed
        const newShares = target.shareCount + safeShares
        const newSubscribed = prevSubscribed + nominalTotalCOP
        const newPaid = prevPaid + transferredPaid
        const newPending = Math.max(0, newSubscribed - newPaid)

        nextShareholders = nextShareholders.map((sh) =>
          sh.id === target.id
            ? {
                ...sh,
                shareCount: newShares,
                totalCapitalCOP: newSubscribed,
                subscribedCapitalCOP: newSubscribed,
                paidCapitalCOP: newPaid,
                pendingCapitalCOP: newPending,
                paymentStatus: newPending === 0 ? '100% Pagado' : 'Pago Parcial en Plazo',
                lastMinuteRecord: minuteReference.trim() || sh.lastMinuteRecord,
              }
            : sh
        )

        movementRecord = {
          id: `mov-${Date.now()}`,
          date: movementDate,
          movementType: 'Cesión',
          shareholderName: target.shareholderName,
          counterpartyName: cedent.shareholderName,
          shares: safeShares,
          nominalTotalCOP,
          paidCOP: transferredPaid,
          pendingCOP: transferredPending,
          certificateNumber: target.shareCertificateNumber ?? certificateNumber,
          minuteReference: minuteReference.trim() || 'Cesión registrada',
          pucSummary: 'Reclasificación auxiliar de accionistas en cuenta 310505/310510 (sin variación de capital)',
        }
      } else {
        const assignedCert = certificateNumber.trim() || getNextCertificateNumber(nextShareholders)
        const newRecord: ShareholderRecord = {
          id: `sh-${Date.now()}`,
          shareholderName: newName.trim(),
          documentNumberMasked: newDocument.trim(),
          shareCount: safeShares,
          sharePercentage: 0,
          nominalValuePerShareCOP: CORPORATE_COMPANY.nominalValuePerShareCOP,
          totalCapitalCOP: nominalTotalCOP,
          subscribedCapitalCOP: nominalTotalCOP,
          paidCapitalCOP: transferredPaid,
          pendingCapitalCOP: transferredPending,
          paymentDeadline: deadlineDate.toISOString(),
          paymentStatus: transferredPending === 0 ? '100% Pagado' : 'Pago Parcial en Plazo',
          shareCertificateNumber: assignedCert,
          shareType,
          entryDate: entryIso,
          lastMinuteRecord: minuteReference.trim() || 'Cesión de acciones SAS',
          status: 'Activo',
        }
        nextShareholders.push(newRecord)

        movementRecord = {
          id: `mov-${Date.now()}`,
          date: movementDate,
          movementType: 'Cesión',
          shareholderName: newRecord.shareholderName,
          counterpartyName: cedent.shareholderName,
          shares: safeShares,
          nominalTotalCOP,
          paidCOP: transferredPaid,
          pendingCOP: transferredPending,
          certificateNumber: assignedCert,
          minuteReference: minuteReference.trim() || 'Cesión registrada',
          pucSummary: 'Endoso y registro en Libro de Accionistas (sin variación en 310510)',
        }
      }
    } else {
      // Emisión o Suscripción desde acciones en reserva
      if (targetMode === 'existing') {
        const target = nextShareholders.find((sh) => sh.id === existingTargetId)
        if (!target) {
          setFormError('Seleccione un accionista válido.')
          return
        }
        const prevSubscribed = target.subscribedCapitalCOP ?? target.totalCapitalCOP
        const prevPaid = target.paidCapitalCOP ?? prevSubscribed
        const newShares = target.shareCount + safeShares
        const newSubscribed = prevSubscribed + nominalTotalCOP
        const newPaid = prevPaid + safePaidCOP
        const newPending = Math.max(0, newSubscribed - newPaid)

        nextShareholders = nextShareholders.map((sh) =>
          sh.id === target.id
            ? {
                ...sh,
                shareCount: newShares,
                totalCapitalCOP: newSubscribed,
                subscribedCapitalCOP: newSubscribed,
                paidCapitalCOP: newPaid,
                pendingCapitalCOP: newPending,
                paymentDeadline:
                  newPending > 0 ? deadlineDate.toISOString() : sh.paymentDeadline,
                paymentStatus: newPending === 0 ? '100% Pagado' : 'Pago Parcial en Plazo',
                lastMinuteRecord: minuteReference.trim() || sh.lastMinuteRecord,
              }
            : sh
        )

        movementRecord = {
          id: `mov-${Date.now()}`,
          date: movementDate,
          movementType,
          shareholderName: target.shareholderName,
          shares: safeShares,
          nominalTotalCOP,
          paidCOP: safePaidCOP,
          pendingCOP,
          certificateNumber: target.shareCertificateNumber ?? certificateNumber,
          minuteReference: minuteReference.trim() || `${movementType} de acciones`,
          pucSummary:
            pendingCOP > 0
              ? 'DB 111005 / DB 310515 · CR 310510 (Capital por Suscribir)'
              : 'DB 111005 Bancos · CR 310510 (Capital por Suscribir)',
        }
      } else {
        const assignedCert = certificateNumber.trim() || getNextCertificateNumber(nextShareholders)
        const newRecord: ShareholderRecord = {
          id: `sh-${Date.now()}`,
          shareholderName: newName.trim(),
          documentNumberMasked: newDocument.trim(),
          shareCount: safeShares,
          sharePercentage: 0,
          nominalValuePerShareCOP: CORPORATE_COMPANY.nominalValuePerShareCOP,
          totalCapitalCOP: nominalTotalCOP,
          subscribedCapitalCOP: nominalTotalCOP,
          paidCapitalCOP: safePaidCOP,
          pendingCapitalCOP: pendingCOP,
          paymentDeadline: deadlineDate.toISOString(),
          paymentStatus: pendingCOP === 0 ? '100% Pagado' : 'Pago Parcial en Plazo',
          shareCertificateNumber: assignedCert,
          shareType,
          entryDate: entryIso,
          lastMinuteRecord: minuteReference.trim() || `${movementType} de acciones SAS`,
          status: 'Activo',
        }
        nextShareholders.push(newRecord)

        movementRecord = {
          id: `mov-${Date.now()}`,
          date: movementDate,
          movementType,
          shareholderName: newRecord.shareholderName,
          shares: safeShares,
          nominalTotalCOP,
          paidCOP: safePaidCOP,
          pendingCOP,
          certificateNumber: assignedCert,
          minuteReference: minuteReference.trim() || `${movementType} de acciones`,
          pucSummary:
            pendingCOP > 0
              ? 'DB 111005 / DB 310515 · CR 310510 (Capital por Suscribir)'
              : 'DB 111005 Bancos · CR 310510 (Capital por Suscribir)',
        }
      }
    }

    onApplyMovement(recalculatePercentages(nextShareholders), movementRecord)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-share-movement"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-share-movement" className="text-base font-bold text-foreground">
              Registrar Movimiento Accionario
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de movimiento accionario"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Reserve status banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2">
            <span>
              Capital autorizado: <strong>{CORPORATE_COMPANY.authorizedShares} acciones</strong> (
              {formatCurrency(CORPORATE_COMPANY.nominalValuePerShareCOP)} c/u)
            </span>
            <Badge variant={reserveShares > 0 ? 'info' : 'warning'} className="text-[11px]">
              Disponibles en reserva: {reserveShares} acciones
            </Badge>
          </div>

          {/* Movement type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-type" className="font-semibold text-foreground">
                Tipo de Movimiento *
              </label>
              <select
                id="mov-type"
                value={movementType}
                onChange={(e) => handleMovementTypeChange(e.target.value as ShareMovementType)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Emisión">Emisión (Colocación de acciones en reserva)</option>
                <option value="Suscripción">Suscripción (Aporte nuevo o incremento)</option>
                <option value="Cesión">Cesión (Transferencia entre accionistas)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-date" className="font-semibold text-foreground">
                Fecha de Operación *
              </label>
              <Input
                id="mov-date"
                type="date"
                required
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Cedent selector (only for Cesión) */}
          {movementType === 'Cesión' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-cedent" className="font-semibold text-foreground">
                Accionista Cedente (Origen) *
              </label>
              <select
                id="mov-cedent"
                value={cedentId}
                onChange={(e) => {
                  setCedentId(e.target.value)
                  setFormError(null)
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {activeShareholders.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.shareholderName} ({sh.shareCount} acciones · {sh.shareCertificateNumber ?? 'TIT'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Beneficiary selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-target-mode" className="font-semibold text-foreground">
                {movementType === 'Cesión' ? 'Destinatario (Cesionario) *' : 'Accionista Beneficiario *'}
              </label>
              <select
                id="mov-target-mode"
                value={targetMode}
                onChange={(e) => {
                  setTargetMode(e.target.value as 'new' | 'existing')
                  setFormError(null)
                }}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="new">Registrar nuevo accionista</option>
                <option value="existing">Accionista existente en libro</option>
              </select>
            </div>

            {targetMode === 'existing' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-existing-target" className="font-semibold text-foreground">
                  Seleccionar Accionista *
                </label>
                <select
                  id="mov-existing-target"
                  value={existingTargetId}
                  onChange={(e) => setExistingTargetId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {shareholders.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.shareholderName} ({sh.shareCount} acc.)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-cert-num" className="font-semibold text-foreground">
                  N.° Título Nominativo a Expedir *
                </label>
                <Input
                  id="mov-cert-num"
                  required
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="Ej. TIT-002"
                  className="text-xs font-mono"
                />
              </div>
            )}
          </div>

          {targetMode === 'new' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-new-name" className="font-semibold text-foreground">
                  Nombre o Razón Social *
                </label>
                <Input
                  id="mov-new-name"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. María Fernanda Silva López"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-new-doc" className="font-semibold text-foreground">
                  Documento de Identificación (CC / NIT) *
                </label>
                <Input
                  id="mov-new-doc"
                  required
                  value={newDocument}
                  onChange={(e) => setNewDocument(e.target.value)}
                  placeholder="Ej. CC 52.841.920"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Share count, nominal value & paid amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-shares" className="font-semibold text-foreground">
                Cantidad de Acciones *
              </label>
              <Input
                id="mov-shares"
                type="number"
                min={1}
                max={movementType === 'Cesión' ? maxCedentShares : reserveShares}
                required
                value={sharesInput}
                onChange={(e) => handleSharesChange(e.target.value)}
                aria-invalid={exceedsReserve || exceedsCedent}
                className="text-xs font-mono"
              />
              <span className="text-[11px] text-muted-foreground">
                {movementType === 'Cesión'
                  ? `Máx. cedente: ${maxCedentShares} acc.`
                  : `Máx. reserva: ${reserveShares} acc.`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="mov-nominal-total" className="font-semibold text-foreground">
                Valor Nominal Total
              </label>
              <Input
                id="mov-nominal-total"
                readOnly
                value={formatCurrency(nominalTotalCOP)}
                className="text-xs font-semibold bg-muted/40"
              />
              <span className="text-[11px] text-muted-foreground">
                {formatCurrency(CORPORATE_COMPANY.nominalValuePerShareCOP)} c/u
              </span>
            </div>

            {movementType !== 'Cesión' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-paid-cop" className="font-semibold text-foreground">
                  Valor Pagado Inicial (COP) *
                </label>
                <Input
                  id="mov-paid-cop"
                  type="number"
                  min={0}
                  max={nominalTotalCOP}
                  required
                  value={paidAmountInput}
                  onChange={(e) => {
                    setIsPaidAutoSynced(false)
                    setPaidAmountInput(e.target.value)
                    setFormError(null)
                  }}
                  aria-invalid={paidExceedsNominal}
                  className="text-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground">
                  Por cobrar (310515): {formatCurrency(pendingCOP)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="mov-share-class" className="font-semibold text-foreground">
                  Clase de Acción
                </label>
                <Input
                  id="mov-share-class"
                  value={shareType}
                  onChange={(e) => setShareType(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mov-minute-ref" className="font-semibold text-foreground">
              Soporte / Acta de Asamblea
            </label>
            <Input
              id="mov-minute-ref"
              value={minuteReference}
              onChange={(e) => setMinuteReference(e.target.value)}
              placeholder="Ej. Acta No. 10 — Asamblea Extraordinaria"
              className="text-xs"
            />
          </div>

          {/* Live validation warning */}
          {(exceedsReserve || exceedsCedent || paidExceedsNominal || formError) && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-800 dark:text-rose-300"
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>
                {formError ??
                  (exceedsReserve
                    ? `No puede superar las ${reserveShares} acciones disponibles en reserva (de ${CORPORATE_COMPANY.authorizedShares} autorizadas).`
                    : exceedsCedent
                      ? `La cantidad a ceder (${safeShares}) supera las ${maxCedentShares} acciones del cedente.`
                      : 'El valor pagado inicial no puede superar el valor nominal suscrito.')}
              </span>
            </div>
          )}

          {/* PUC 310505 / 310510 / 310515 accounting preview */}
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2">
            <div className="font-semibold text-foreground">
              Impacto Contable PUC — Grupo 3105 (Capital Social)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="rounded border bg-card p-2">
                <div className="font-mono font-semibold text-foreground">310505 · Capital Autorizado</div>
                <div className="text-muted-foreground mt-0.5">
                  Saldo fijo: {formatCurrency(CORPORATE_COMPANY.authorizedCapitalCOP)} (500 acc.)
                </div>
              </div>
              <div className="rounded border bg-card p-2">
                <div className="font-mono font-semibold text-foreground">310510 · Capital por Suscribir</div>
                <div className="text-muted-foreground mt-0.5">
                  {movementType === 'Cesión'
                    ? 'Sin variación (cesión entre socios)'
                    : `CR ${formatCurrency(nominalTotalCOP)} (Reserva pasa a ${Math.max(0, reserveShares - safeShares)} acc.)`}
                </div>
              </div>
              <div className="rounded border bg-card p-2">
                <div className="font-mono font-semibold text-foreground">310515 · Suscrito por Cobrar</div>
                <div className="text-muted-foreground mt-0.5">
                  {movementType === 'Cesión'
                    ? 'Traspaso proporcional entre socios'
                    : pendingCOP > 0
                      ? `DB ${formatCurrency(pendingCOP)} (Plazo Ley 1258)`
                      : `$0 (DB 111005 Bancos ${formatCurrency(safePaidCOP)})`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={exceedsReserve || exceedsCedent || paidExceedsNominal || safeShares <= 0}
              className="font-semibold"
            >
              Registrar Movimiento
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
