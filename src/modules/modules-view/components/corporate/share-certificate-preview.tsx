'use client'

import { Award, Printer, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ShareholderRecord } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'
import { CORPORATE_COMPANY, formatTitleNumericCode } from './corporate-constants'

interface ShareCertificatePreviewProps {
  shareholders: ShareholderRecord[]
  selectedId: string
  onSelectId: (id: string) => void
  onPrintCertificate: (certificate: ShareholderRecord) => void
}

export function ShareCertificateDocument({ certificate }: { certificate: ShareholderRecord }) {
  const titleNumber = formatTitleNumericCode(certificate.shareCertificateNumber)
  const certCode = certificate.shareCertificateNumber ?? `TIT-${titleNumber}`
  const nominalUnit = certificate.nominalValuePerShareCOP || CORPORATE_COMPANY.nominalValuePerShareCOP
  const subscribedTotal = certificate.subscribedCapitalCOP ?? certificate.totalCapitalCOP
  const paidTotal = certificate.paidCapitalCOP ?? subscribedTotal
  const pendingTotal = certificate.pendingCapitalCOP ?? Math.max(0, subscribedTotal - paidTotal)

  return (
    <div className="space-y-6">
      {/* Frente / Anverso del Título */}
      <Card className="border-2 border-foreground/25 shadow-sm bg-card print:shadow-none print:border-slate-800">
        <CardHeader className="border-b pb-4 text-center">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            República de Colombia • {CORPORATE_COMPANY.chamberName} ({CORPORATE_COMPANY.chamberAcronym})
          </div>
          <CardTitle className="text-lg font-serif tracking-tight mt-1">
            {CORPORATE_COMPANY.legalName}
          </CardTitle>
          <CardDescription className="text-xs font-mono">
            NIT: {CORPORATE_COMPANY.nit} • Matrícula Mercantil No. {CORPORATE_COMPANY.mercantileRegistration} •{' '}
            {CORPORATE_COMPANY.address}
          </CardDescription>
          <div className="mt-2 inline-block px-3.5 py-1 bg-muted rounded font-mono text-xs font-bold text-foreground">
            TÍTULO NOMINATIVO N.° {titleNumber} ({certCode})
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6 text-sm">
          <p className="leading-relaxed text-foreground text-xs sm:text-sm">
            La sociedad <strong>{CORPORATE_COMPANY.legalName}</strong>, identificada con NIT{' '}
            <strong>{CORPORATE_COMPANY.nit}</strong> y Matrícula Mercantil No.{' '}
            <strong>{CORPORATE_COMPANY.mercantileRegistration}</strong> de la{' '}
            {CORPORATE_COMPANY.chamberName}, certifica que <strong>{certificate.shareholderName}</strong>,
            identificado con <strong>{certificate.documentNumberMasked}</strong>, es titular legítimo de{' '}
            <strong>{certificate.shareCount.toLocaleString('es-CO')} acciones ordinarias</strong> de capital,
            con un valor nominal de <strong>{formatCurrency(nominalUnit)} c/u</strong>, equivalentes a un valor
            nominal total de <strong>{formatCurrency(subscribedTotal)}</strong>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 border rounded-lg text-xs">
            <div>
              <span className="text-muted-foreground">Cantidad:</span>
              <div className="font-bold text-foreground">
                {certificate.shareCount.toLocaleString('es-CO')} acciones
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Nominal c/u:</span>
              <div className="font-bold text-foreground">{formatCurrency(nominalUnit)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Suscrito:</span>
              <div className="font-bold text-foreground">{formatCurrency(subscribedTotal)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Capital Pagado:</span>
              <div className="font-bold text-emerald-700">{formatCurrency(paidTotal)}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground border-b pb-3">
            <span>
              <strong>Clase:</strong> {certificate.shareType}
            </span>
            <span>
              <strong>Fecha de Inscripción:</strong> {formatDate(certificate.entryDate)} •{' '}
              <strong>Estado:</strong> {certificate.paymentStatus ?? '100% Pagado'}
              {pendingTotal > 0 ? ` (Saldo: ${formatCurrency(pendingTotal)})` : ''}
            </span>
          </div>

          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-foreground/40 pt-2">
              <div className="font-semibold text-foreground">
                {CORPORATE_COMPANY.legalRepresentativeName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {CORPORATE_COMPANY.legalRepresentativeDoc} • Representante Legal
              </div>
              <div className="text-[10px] text-muted-foreground">{CORPORATE_COMPANY.legalName}</div>
            </div>
            <div className="border-t border-foreground/40 pt-2">
              <div className="font-semibold text-foreground">{CORPORATE_COMPANY.legalName}</div>
              <div className="text-[11px] text-muted-foreground">Secretaría General de la Asamblea</div>
              <div className="text-[10px] text-muted-foreground">
                Registro Libro de Accionistas • {certCode}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dorso del Título */}
      <Card className="border border-border/90 bg-muted/20 shadow-xs print:shadow-none print:border-slate-800 print:bg-white corporate-print-page-break">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Dorso del Título N.° {titleNumber} — Constancia de Derechos Legales (Ley 1258 de 2008)
              </h4>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              Art. 401 C. de Co. • Ley 1258/2008
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs leading-relaxed text-foreground">
          <ol className="list-decimal pl-4 space-y-2 text-[11px] text-muted-foreground">
            <li>
              <strong className="text-foreground">Derechos Políticos y Económicos (Arts. 10 y 11, Ley 1258 de 2008):</strong>{' '}
              Cada acción ordinaria aquí incorporada confiere a su titular inscrito el derecho a participar en las
              deliberaciones de la Asamblea General de Accionistas con voz y un (1) voto por acción, percibir los
              dividendos decretados proporcionalmente de acuerdo con los estados financieros aprobados, inspeccionar
              los libros y documentos sociales conforme al Art. 20 de la Ley 1258 de 2008, y recibir una parte
              proporcional de los activos sociales al momento de la liquidación.
            </li>
            <li>
              <strong className="text-foreground">Plazo de Pago del Capital Suscrito (Art. 9, Ley 1258 de 2008):</strong>{' '}
              La suscripción y pago del capital podrá efectuarse en los plazos estatutarios sin exceder en ningún caso
              dos (2) años contados desde la fecha de suscripción.
            </li>
            <li>
              <strong className="text-foreground">Transferencia, Endoso y Derecho de Preferencia (Art. 406 C. de Co.):</strong>{' '}
              Las acciones representadas por este título son nominativas. Su enajenación o gravamen solo surtirá efectos
              frente a la sociedad y frente a terceros a partir de su inscripción formal en el Libro de Registro de
              Accionistas, previa verificación del derecho de preferencia establecido en los Estatutos Sociales.
            </li>
          </ol>

          <div className="rounded-md border border-dashed border-border p-3 bg-card">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Espacio Reservado para Anotación de Endosos, Cesiones o Gravámenes
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground border-b pb-1.5 font-semibold">
              <span>Fecha / Acta</span>
              <span>Cesionario / Beneficiario</span>
              <span>Acciones Transferidas / Firma</span>
            </div>
            <div className="h-10 border-b border-dotted border-border/80" />
            <div className="h-10" />
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-foreground/40 pt-2">
              <div className="font-semibold text-foreground">
                {CORPORATE_COMPANY.legalRepresentativeName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Firma Representante Legal • {CORPORATE_COMPANY.legalRepresentativeDoc}
              </div>
            </div>
            <div className="border-t border-foreground/40 pt-2">
              <div className="font-semibold text-foreground">Firma del Titular / Endosante</div>
              <div className="text-[11px] text-muted-foreground">
                {certificate.shareholderName} ({certificate.documentNumberMasked})
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ShareCertificatePreview({
  shareholders,
  selectedId,
  onSelectId,
  onPrintCertificate,
}: ShareCertificatePreviewProps) {
  const holdersWithTitles = shareholders.filter((sh) => sh.shareCount > 0)
  const activeCertificate =
    holdersWithTitles.find((sh) => sh.id === selectedId) ??
    holdersWithTitles.find((sh) => sh.shareCertificateNumber === 'TIT-001') ??
    holdersWithTitles[0] ??
    null

  if (!activeCertificate) {
    return (
      <div className="h-48 flex flex-col items-center justify-center border border-dashed rounded-lg text-muted-foreground text-xs">
        <Award className="size-7 mb-2 opacity-50" aria-hidden="true" />
        No hay títulos nominativos con acciones vigentes en el libro.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Títulos Nominativos Emitidos ({holdersWithTitles.length})
        </h3>
        {holdersWithTitles.map((sh) => {
          const isSelected = sh.id === activeCertificate.id
          return (
            <button
              key={sh.id}
              type="button"
              onClick={() => onSelectId(sh.id)}
              aria-pressed={isSelected}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-foreground bg-muted/50 shadow-sm'
                  : 'border-border/70 hover:bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground font-mono">
                  {sh.shareCertificateNumber ?? 'TIT-001'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sh.shareCount.toLocaleString('es-CO')} acc.
                </span>
              </div>
              <div className="text-xs text-foreground truncate mt-0.5">{sh.shareholderName}</div>
            </button>
          )
        })}
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Vista Previa Título Nominativo N.° {formatTitleNumericCode(activeCertificate.shareCertificateNumber)}
          </h3>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => onPrintCertificate(activeCertificate)}
          >
            <Printer className="size-3.5" aria-hidden="true" />
            Descargar / Imprimir Título PDF
          </Button>
        </div>

        <ShareCertificateDocument certificate={activeCertificate} />
      </div>
    </div>
  )
}
