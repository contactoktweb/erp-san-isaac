'use client'

import { useEffect } from 'react'
import { FileCheck, Printer, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ShareholderRecord } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'
import { calculateEquitySummary, CORPORATE_COMPANY } from './corporate-constants'

interface CompositionCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  shareholders: ShareholderRecord[]
  onPrint: () => void
}

export function CompositionCertificatePrintable({
  shareholders,
}: {
  shareholders: ShareholderRecord[]
}) {
  const equity = calculateEquitySummary(shareholders)
  const activeShareholders = shareholders.filter((sh) => sh.shareCount > 0)
  const expeditionDate = formatDate(new Date())

  return (
    <div className="space-y-5 text-xs text-foreground bg-card p-6 rounded-lg border border-border print:border-0 print:p-2">
      <div className="border-b pb-4 text-center space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {CORPORATE_COMPANY.chamberName} ({CORPORATE_COMPANY.chamberAcronym}) • Matrícula{' '}
          {CORPORATE_COMPANY.mercantileRegistration}
        </div>
        <h4 className="text-base font-bold font-serif uppercase tracking-tight">
          {CORPORATE_COMPANY.legalName}
        </h4>
        <div className="text-[11px] font-mono text-muted-foreground">
          NIT {CORPORATE_COMPANY.nit} • {CORPORATE_COMPANY.address} • CIIU {CORPORATE_COMPANY.ciiu}
        </div>
        <div className="pt-2">
          <span className="inline-block rounded bg-muted px-3 py-1 font-bold uppercase tracking-wide text-xs">
            Certificado de Composición Accionaria
          </span>
        </div>
      </div>

      <p className="leading-relaxed">
        El suscrito Representante Legal de <strong>{CORPORATE_COMPANY.legalName}</strong>, sociedad por acciones
        simplificada identificada con NIT <strong>{CORPORATE_COMPANY.nit}</strong> y Matrícula Mercantil No.{' '}
        <strong>{CORPORATE_COMPANY.mercantileRegistration}</strong> ante la {CORPORATE_COMPANY.chamberName} (
        {CORPORATE_COMPANY.chamberAcronym}), <strong>CERTIFICA</strong> que al <strong>{expeditionDate}</strong>, de
        conformidad con el Libro de Registro de Accionistas, el capital social y la participación accionaria se
        encuentran conformados así:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border bg-muted/30 p-3 text-[11px]">
        <div>
          <span className="text-muted-foreground">310505 Capital Autorizado:</span>
          <div className="font-bold">{formatCurrency(CORPORATE_COMPANY.authorizedCapitalCOP)}</div>
          <div className="text-muted-foreground">{CORPORATE_COMPANY.authorizedShares} acciones</div>
        </div>
        <div>
          <span className="text-muted-foreground">310510 En Reserva:</span>
          <div className="font-bold">{formatCurrency(equity.reserveCapitalCOP)}</div>
          <div className="text-muted-foreground">{equity.reserveShares} acciones</div>
        </div>
        <div>
          <span className="text-muted-foreground">Capital Suscrito:</span>
          <div className="font-bold">{formatCurrency(equity.totalSubscribedCOP)}</div>
          <div className="text-muted-foreground">{equity.totalSubscribedShares} acciones</div>
        </div>
        <div>
          <span className="text-muted-foreground">310515 Por Cobrar:</span>
          <div className="font-bold">{formatCurrency(equity.totalPendingCOP)}</div>
          <div className="text-muted-foreground">Pagado: {formatCurrency(equity.totalPaidCOP)}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2">Accionista / Documento</th>
              <th scope="col" className="px-3 py-2">Título</th>
              <th scope="col" className="px-3 py-2 text-right">Acciones</th>
              <th scope="col" className="px-3 py-2 text-center">% Part.</th>
              <th scope="col" className="px-3 py-2 text-right">Suscrito</th>
              <th scope="col" className="px-3 py-2 text-right">Pagado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeShareholders.map((sh) => {
              const subscribed = sh.subscribedCapitalCOP ?? sh.totalCapitalCOP
              const paid = sh.paidCapitalCOP ?? subscribed
              return (
                <tr key={sh.id}>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{sh.shareholderName}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {sh.documentNumberMasked}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono">{sh.shareCertificateNumber ?? 'TIT-001'}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {sh.shareCount.toLocaleString('es-CO')}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {sh.sharePercentage}%
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right">{formatCurrency(subscribed)}</td>
                  <td className="px-3 py-2 text-right text-emerald-700 font-medium">
                    {formatCurrency(paid)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
        <div className="border-t border-foreground/40 pt-2">
          <div className="font-semibold">{CORPORATE_COMPANY.legalRepresentativeName}</div>
          <div className="text-[11px] text-muted-foreground">
            {CORPORATE_COMPANY.legalRepresentativeDoc} • Representante Legal
          </div>
          <div className="text-[10px] text-muted-foreground">{CORPORATE_COMPANY.legalName}</div>
        </div>
        <div className="border-t border-foreground/40 pt-2">
          <div className="font-semibold">Expedido en Guaduas, Cundinamarca</div>
          <div className="text-[11px] text-muted-foreground">Fecha de expedición: {expeditionDate}</div>
          <div className="text-[10px] text-muted-foreground">Uso bancario, notarial y comercial</div>
        </div>
      </div>
    </div>
  )
}

export function CompositionCertificateModal({
  isOpen,
  onClose,
  shareholders,
  onPrint,
}: CompositionCertificateModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-composition-cert"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-composition-cert" className="text-base font-bold text-foreground">
              Vista Imprimible — Certificado de Composición Accionaria
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa de certificado"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <CompositionCertificatePrintable shareholders={shareholders} />

        <div className="flex items-center justify-end gap-2 border-t pt-4 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" size="sm" className="gap-1.5 font-semibold" onClick={onPrint}>
            <Printer className="size-3.5" aria-hidden="true" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
