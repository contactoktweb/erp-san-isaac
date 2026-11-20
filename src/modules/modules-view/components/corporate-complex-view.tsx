'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Award,
  Building,
  CheckCircle2,
  Clock,
  FileDown,
  Plus,
  Scale,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ShareholderRecord } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'
import { AssemblyMinutesTab, PrintableMinuteDocument } from './corporate/assembly-minutes-tab'
import {
  CompositionCertificateModal,
  CompositionCertificatePrintable,
} from './corporate/composition-certificate-modal'
import {
  buildInitialShareMovements,
  calculateEquitySummary,
  CORPORATE_COMPANY,
  INITIAL_ASSEMBLY_MINUTES,
  INITIAL_BASE_DOCUMENTS,
  PUC_EQUITY_ACCOUNTS,
  type AssemblyMinuteRecord,
  type CorporateBaseDocument,
  type ShareMovementRecord,
} from './corporate/corporate-constants'
import { CorporatePrintPortal, useCorporatePrint } from './corporate/corporate-print-portal'
import { ShareCertificateDocument, ShareCertificatePreview } from './corporate/share-certificate-preview'
import { ShareMovementModal } from './corporate/share-movement-modal'

interface CorporateComplexViewProps {
  shareholders: ShareholderRecord[]
}

export function CorporateComplexView({ shareholders }: CorporateComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<'book' | 'certificates' | 'minutes'>('book')
  const [localShareholders, setLocalShareholders] = useState<ShareholderRecord[]>(shareholders)
  const [shareMovements, setShareMovements] = useState<ShareMovementRecord[]>(() =>
    buildInitialShareMovements(shareholders)
  )
  const [selectedCertificateId, setSelectedCertificateId] = useState<string>(() => {
    const defaultCert =
      shareholders.find((sh) => sh.shareCertificateNumber === 'TIT-001') ??
      shareholders.find((sh) => sh.shareCount > 0)
    return defaultCert?.id ?? ''
  })

  const [minutes, setMinutes] = useState<AssemblyMinuteRecord[]>(INITIAL_ASSEMBLY_MINUTES)
  const [baseDocuments, setBaseDocuments] = useState<CorporateBaseDocument[]>(INITIAL_BASE_DOCUMENTS)

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false)

  const { printContent, triggerPrint } = useCorporatePrint()
  const baseDocUrlsRef = useRef<string[]>([])

  useEffect(() => {
    const urls = baseDocUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const equity = calculateEquitySummary(localShareholders)
  const overdueCount = localShareholders.filter(
    (sh) => sh.paymentStatus === 'Plazo Vencido'
  ).length
  const activeShareholderCount = localShareholders.filter((sh) => sh.shareCount > 0).length

  const handleApplyMovement = (
    updatedShareholders: ShareholderRecord[],
    movement: ShareMovementRecord
  ) => {
    setLocalShareholders(updatedShareholders)
    setShareMovements((prev) => [movement, ...prev])
    toast.success(`${movement.movementType} registrada correctamente`, {
      description: `${movement.shares} acciones (${formatCurrency(movement.nominalTotalCOP)}) — ${movement.shareholderName}`,
    })
  }

  const handleUpdateBaseDocument = (docId: CorporateBaseDocument['id'], file: File) => {
    const fileObjectUrl = URL.createObjectURL(file)
    baseDocUrlsRef.current.push(fileObjectUrl)
    const todayIso = new Date().toISOString().slice(0, 10)

    setBaseDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              fileName: file.name,
              fileSizeBytes: file.size,
              fileObjectUrl,
              updatedAt: todayIso,
              statusLabel: `Actualizado • ${CORPORATE_COMPANY.chamberAcronym}`,
            }
          : doc
      )
    )
    toast.success('Documento societario actualizado', {
      description: `Se cargó ${file.name} con vigencia ${formatDate(`${todayIso}T00:00:00.000Z`)}.`,
    })
  }

  const handleAddMinute = (newMinute: AssemblyMinuteRecord) => {
    setMinutes((prev) => [newMinute, ...prev])
    toast.success(`${newMinute.minuteNumber} registrada correctamente`, {
      description: `PDF firmado adjunto: ${newMinute.fileName} (${newMinute.chamberStatus}).`,
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Autorizado SAS
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(CORPORATE_COMPANY.authorizedCapitalCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {CORPORATE_COMPANY.authorizedShares} acciones valor nominal{' '}
              {formatCurrency(CORPORATE_COMPANY.nominalValuePerShareCOP)} c/u
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Suscrito
            </CardTitle>
            <Scale className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(equity.totalSubscribedCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {equity.subscribedPercentage}% del autorizado • {equity.reserveShares} acc. en reserva
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Efectivamente Pagado
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(equity.totalPaidCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {equity.paidPercentage}% del suscrito ingresado a bancos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo por Cobrar Accionistas
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(equity.totalPendingCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Plazo máx. {CORPORATE_COMPANY.maxPaymentYearsLey1258} años (Ley 1258 Art. 9)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ley 1258 Warning Notice */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-800 dark:text-rose-300 text-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
          <div>
            <div className="font-semibold text-sm">
              Alerta Legal Estatutaria: {overdueCount} aporte con plazo legal vencido (Ley 1258 de 2008)
            </div>
            <p className="mt-1">
              De conformidad con el Artículo 9 de la Ley 1258, las acciones suscritas en una SAS deben pagarse en un
              término no mayor a dos (2) años. El accionista en mora debe ser requerido formalmente o someter las
              acciones a la asamblea para cobro judicial o disminución del capital social.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={(v) => setSelectedTab(v as 'book' | 'certificates' | 'minutes')}
        className="w-full"
      >
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="book" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Libro de Accionistas ({activeShareholderCount})
          </TabsTrigger>
          <TabsTrigger
            value="certificates"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Títulos de Acciones (Títulos Nominativos)
          </TabsTrigger>
          <TabsTrigger value="minutes" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Actas de Asamblea ({minutes.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Shareholders Book */}
        <TabsContent value="book" className="space-y-5 pt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                Registro de Accionistas y Participación de Capital
              </h3>
              <p className="text-xs text-muted-foreground">
                {CORPORATE_COMPANY.legalName} • NIT {CORPORATE_COMPANY.nit} • Matrícula{' '}
                {CORPORATE_COMPANY.mercantileRegistration} ({CORPORATE_COMPANY.chamberAcronym}) •{' '}
                <strong>{equity.reserveShares} acciones en reserva</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setIsCompositionModalOpen(true)}
              >
                <FileDown className="size-3.5" aria-hidden="true" />
                Descargar Certificado de Composición Accionaria (PDF)
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs gap-1.5 font-semibold"
                onClick={() => setIsMovementModalOpen(true)}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Registrar Movimiento Accionario (Emisión / Suscripción / Cesión)
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Accionista / Documento</th>
                  <th scope="col" className="px-4 py-3 text-right">No. Acciones</th>
                  <th scope="col" className="px-4 py-3 text-center">Participación</th>
                  <th scope="col" className="px-4 py-3 text-right">Capital Suscrito</th>
                  <th scope="col" className="px-4 py-3 text-right">Capital Pagado</th>
                  <th scope="col" className="px-4 py-3 text-right">Saldo Pendiente</th>
                  <th scope="col" className="px-4 py-3 text-center">Estado de Pago</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {localShareholders.map((sh) => {
                  const subscribed = sh.subscribedCapitalCOP ?? sh.totalCapitalCOP
                  const paid = sh.paidCapitalCOP ?? subscribed
                  const pending = sh.pendingCapitalCOP ?? Math.max(0, subscribed - paid)
                  const isFullyPaid = sh.paymentStatus === '100% Pagado' || pending === 0
                  const isOverdue = sh.paymentStatus === 'Plazo Vencido'

                  return (
                    <tr key={sh.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{sh.shareholderName}</div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {sh.documentNumberMasked} • {sh.shareType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {sh.shareCount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {sh.sharePercentage}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground">
                        {formatCurrency(subscribed)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium">
                        {pending > 0 ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-amber-600'}>
                            {formatCurrency(pending)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isFullyPaid ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                          className="text-[11px]"
                        >
                          {sh.paymentStatus ?? '100% Pagado'}
                        </Badge>
                        {sh.paymentDeadline && !isFullyPaid && sh.shareCount > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Plazo: {formatDate(sh.paymentDeadline)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sh.shareCount > 0 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => {
                              setSelectedCertificateId(sh.id)
                              setSelectedTab('certificates')
                            }}
                          >
                            <Award className="h-3 w-3 mr-1" aria-hidden="true" />
                            Ver Título
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Sin saldo vigente</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Estructura Contable PUC 310505 / 310510 / 310515 */}
          <section aria-label="Estructura contable PUC del capital" className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conciliación Contable del Capital Social (PUC Grupo 3105)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PUC_EQUITY_ACCOUNTS.map((acc) => {
                const value =
                  acc.code === '310505'
                    ? CORPORATE_COMPANY.authorizedCapitalCOP
                    : acc.code === '310510'
                      ? equity.reserveCapitalCOP
                      : equity.totalPendingCOP
                const detail =
                  acc.code === '310505'
                    ? `${CORPORATE_COMPANY.authorizedShares} acciones autorizadas`
                    : acc.code === '310510'
                      ? `${equity.reserveShares} acciones disponibles en reserva`
                      : equity.totalPendingCOP > 0
                        ? 'Pendiente de recaudo (Ley 1258 Art. 9)'
                        : '100% del capital suscrito recaudado'

                return (
                  <div
                    key={acc.code}
                    className="rounded-lg border border-border/80 bg-card p-3.5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-foreground">
                        {acc.code} · {acc.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {acc.nature}
                      </Badge>
                    </div>
                    <div className="text-base font-bold text-foreground">{formatCurrency(value)}</div>
                    <p className="text-[11px] text-muted-foreground">{detail}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Historial de Movimientos Accionarios */}
          <section aria-label="Historial de movimientos accionarios" className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Historial de Movimientos Accionarios ({shareMovements.length})
            </h3>
            <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/50 uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Fecha</th>
                    <th scope="col" className="px-4 py-2.5">Movimiento</th>
                    <th scope="col" className="px-4 py-2.5">Titular / Beneficiario</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Acciones</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Valor Nominal</th>
                    <th scope="col" className="px-4 py-2.5">Título / Acta</th>
                    <th scope="col" className="px-4 py-2.5">Imputación PUC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {shareMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono whitespace-nowrap">
                        {formatDate(`${mov.date}T00:00:00.000Z`)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-[10px]">
                          {mov.movementType}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-foreground">{mov.shareholderName}</div>
                        {mov.counterpartyName && (
                          <div className="text-[10px] text-muted-foreground">
                            Cedente: {mov.counterpartyName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {mov.shares.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(mov.nominalTotalCOP)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-semibold">{mov.certificateNumber}</span>
                        <div className="text-[10px] text-muted-foreground">{mov.minuteReference}</div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                        {mov.pucSummary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        {/* Tab 2: Share Certificates */}
        <TabsContent value="certificates" className="space-y-4 pt-4">
          <ShareCertificatePreview
            shareholders={localShareholders}
            selectedId={selectedCertificateId}
            onSelectId={setSelectedCertificateId}
            onPrintCertificate={(certificate) =>
              triggerPrint(<ShareCertificateDocument certificate={certificate} />)
            }
          />
        </TabsContent>

        {/* Tab 3: Minutes Repository */}
        <TabsContent value="minutes" className="space-y-4 pt-4">
          <AssemblyMinutesTab
            minutes={minutes}
            baseDocuments={baseDocuments}
            onAddMinute={handleAddMinute}
            onUpdateBaseDocument={handleUpdateBaseDocument}
            onPrintMinute={(minute) => triggerPrint(<PrintableMinuteDocument minute={minute} />)}
          />
        </TabsContent>
      </Tabs>

      <ShareMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        shareholders={localShareholders}
        reserveShares={equity.reserveShares}
        onApplyMovement={handleApplyMovement}
      />

      <CompositionCertificateModal
        isOpen={isCompositionModalOpen}
        onClose={() => setIsCompositionModalOpen(false)}
        shareholders={localShareholders}
        onPrint={() =>
          triggerPrint(<CompositionCertificatePrintable shareholders={localShareholders} />)
        }
      />

      <CorporatePrintPortal content={printContent} />
    </div>
  )
}
