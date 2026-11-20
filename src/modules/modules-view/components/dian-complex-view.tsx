'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isWithinRange, type DateRange } from '@/components/ui/date-range-filter'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DianDocument } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import { DIAN_RESOLUTIONS, getResolutionStatus } from '@/lib/dian-resolutions'
import { DianCertificateTab } from './dian/dian-certificate-tab'
import { DianInboxTab } from './dian/dian-inbox-tab'
import { DianResolutionsTab } from './dian/dian-resolutions-tab'
import {
  DIAN_ENVIRONMENTS,
  getCertificateValidity,
  getDefaultDianDateRange,
  INITIAL_DIAN_CERTIFICATE,
  isDianTab,
  matchesDianDocType,
  SIMULATED_PING_DELAY_MS,
  SIMULATED_SYNC_DELAY_MS,
  toLocalDocumentRecord,
  type DianCertificateInfo,
  type DianDocTypeFilter,
  type DianDocumentRecord,
  type DianEnvironmentKey,
  type DianPingResult,
  type DianStatusFilter,
  type DianTab,
} from './dian/dian-types'

interface DianComplexViewProps {
  documents: DianDocument[]
}

const CREDIT_NOTE_START_SEQ = 19

function computeSimulatedLatency(range: readonly [number, number]): number {
  const [minMs, maxMs] = range
  return Math.round(minMs + ((Date.now() % 97) / 96) * (maxMs - minMs))
}

function formatCurrentTimeCO(): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date())
}

export function DianComplexView({ documents }: DianComplexViewProps) {
  const [localDocs, setLocalDocs] = useState<DianDocumentRecord[]>(() =>
    documents.map(toLocalDocumentRecord)
  )
  const [selectedTab, setSelectedTab] = useState<DianTab>('docs')
  const [docTypeFilter, setDocTypeFilter] = useState<DianDocTypeFilter>('ALL')
  const [statusFilter, setStatusFilter] = useState<DianStatusFilter>('ALL')
  const [dateRange, setDateRange] = useState<DateRange>(() => getDefaultDianDateRange())
  const [searchQuery, setSearchQuery] = useState('')

  const [isSyncingDoc, setIsSyncingDoc] = useState<string | null>(null)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  const [certificate, setCertificate] = useState<DianCertificateInfo>(INITIAL_DIAN_CERTIFICATE)
  const [environment, setEnvironment] = useState<DianEnvironmentKey>('produccion')
  const [isPinging, setIsPinging] = useState(false)
  const [lastPing, setLastPing] = useState<DianPingResult | null>(null)

  const creditNoteSeqRef = useRef(CREDIT_NOTE_START_SEQ)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const activeTimers = timersRef.current
    return () => {
      activeTimers.forEach((timerId) => clearTimeout(timerId))
    }
  }, [])

  const scheduleTimer = (fn: () => void, delayMs: number) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id)
      fn()
    }, delayMs)
    timersRef.current.push(id)
  }

  const defaultRange = useMemo(() => getDefaultDianDateRange(), [])

  const docsInScope = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return localDocs.filter((doc) => {
      const matchesType = matchesDianDocType(doc, docTypeFilter)
      const matchesDate = isWithinRange(doc.transmissionDate, dateRange)
      const matchesSearch =
        !normalizedQuery ||
        doc.documentNumber.toLowerCase().includes(normalizedQuery) ||
        doc.recipientName.toLowerCase().includes(normalizedQuery) ||
        doc.recipientNit.toLowerCase().includes(normalizedQuery) ||
        doc.cufeOrCune.toLowerCase().includes(normalizedQuery)
      return matchesType && matchesDate && matchesSearch
    })
  }, [localDocs, docTypeFilter, dateRange, searchQuery])

  const filteredDocs = useMemo(() => {
    if (statusFilter === 'ALL') return docsInScope
    return docsInScope.filter((doc) => doc.dianStatus === statusFilter)
  }, [docsInScope, statusFilter])

  const hasActiveFilters =
    docTypeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    dateRange.from !== defaultRange.from ||
    dateRange.to !== defaultRange.to

  const handleResetFilters = () => {
    setDocTypeFilter('ALL')
    setStatusFilter('ALL')
    setSearchQuery('')
    setDateRange(defaultRange)
  }

  const acceptedCount = docsInScope.filter((d) => d.dianStatus === 'Aceptada').length
  const pendingCount = docsInScope.filter((d) => d.dianStatus === 'Pendiente').length
  const rejectedCount = docsInScope.filter((d) => d.dianStatus === 'Rechazada').length
  const totalTransmittedCOP = docsInScope.reduce((acc, d) => acc + d.totalAmountCOP, 0)

  const certValidity = getCertificateValidity(certificate.expirationDate)
  const hasCriticalResolution = DIAN_RESOLUTIONS.some((res) => {
    const level = getResolutionStatus(res).alertLevel
    return level === 'critical' || level === 'expired'
  })

  const handleSimulateSync = (targetDoc: DianDocumentRecord) => {
    setIsSyncingDoc(targetDoc.documentNumber)
    setSyncFeedback(null)

    scheduleTimer(() => {
      setIsSyncingDoc(null)
      setLocalDocs((prev) =>
        prev.map((doc) =>
          doc.id === targetDoc.id
            ? {
                ...doc,
                dianStatus: 'Aceptada',
                transmissionDate: new Date().toISOString(),
              }
            : doc
        )
      )
      const msg = `Sincronización con WebService DIAN (${DIAN_ENVIRONMENTS[environment].shortLabel}) exitosa para ${targetDoc.documentNumber}. Documento aceptado.`
      setSyncFeedback(msg)
      toast.success(msg)
    }, SIMULATED_SYNC_DELAY_MS)
  }

  const handleDownloadMock = (type: 'xml' | 'pdf' | 'appresponse', docNumber: string) => {
    const labelMap = {
      xml: 'XML UBL 2.1 firmado',
      pdf: 'Representación gráfica PDF (QR + CUFE/CUDE)',
      appresponse: 'ApplicationResponse oficial DIAN',
    } as const
    toast.success(`Descarga simulada iniciada: ${labelMap[type]} de ${docNumber}.`)
  }

  const handleRetransmitRejected = (docId: string, updatedNit: string, updatedName: string) => {
    const target = localDocs.find((d) => d.id === docId)
    setLocalDocs((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              recipientNit: updatedNit,
              recipientName: updatedName,
              dianStatus: 'Aceptada',
              rejectionReason: undefined,
              transmissionDate: new Date().toISOString(),
            }
          : doc
      )
    )
    const docNum = target?.documentNumber ?? docId
    const msg = `Documento ${docNum} re-transmitido y validado por WebService DIAN (${DIAN_ENVIRONMENTS[environment].shortLabel}).`
    setSyncFeedback(msg)
    toast.success(msg)
  }

  const handleCreateCreditNote = (
    referencedDoc: DianDocumentRecord,
    amountCOP: number,
    concept: string,
    reason: string
  ) => {
    const seq = creditNoteSeqRef.current
    creditNoteSeqRef.current += 1
    const docNumber = `NC-${String(seq).padStart(3, '0')}`
    const nowIso = new Date().toISOString()

    const newNote: DianDocumentRecord = {
      id: `dian-nc-${Date.now()}`,
      documentNumber: docNumber,
      prefix: 'NC',
      documentType: 'Nota crédito electrónica',
      resolucionDian: `Nota Crédito UBL 2.1 — Ref. ${referencedDoc.documentNumber}`,
      issuerNit: referencedDoc.issuerNit,
      recipientName: referencedDoc.recipientName,
      recipientNit: referencedDoc.recipientNit,
      issueDate: nowIso,
      transmissionDate: nowIso,
      cufeOrCune: `cude-nc-${seq}-9014737044-${nowIso.slice(0, 10).replace(/-/g, '')}-demo`,
      totalAmountCOP: amountCOP,
      dianStatus: 'Aceptada',
      referencedDocument: referencedDoc.documentNumber,
      rejectionReason: reason ? `${concept}: ${reason}` : undefined,
      xmlSignedUrl: `/mock/dian/${docNumber}-signed.xml`,
      pdfUrl: `/mock/dian/${docNumber}-grafica.pdf`,
      dianResponseXmlUrl: `/mock/dian/${docNumber}-appresponse.xml`,
    }

    setLocalDocs((prev) => [newNote, ...prev])
    toast.success(
      `Nota Crédito ${docNumber} emitida por ${formatCurrency(amountCOP)} vinculada a ${referencedDoc.documentNumber}.`
    )
  }

  const handleEnvironmentChange = (nextEnv: DianEnvironmentKey) => {
    setEnvironment(nextEnv)
    toast.info(`Ambiente DIAN cambiado a ${DIAN_ENVIRONMENTS[nextEnv].label} (sesión local).`)
  }

  const handleTestPing = () => {
    setIsPinging(true)
    const activeEnv = environment
    scheduleTimer(() => {
      const latencyMs = computeSimulatedLatency(DIAN_ENVIRONMENTS[activeEnv].simulatedLatencyRangeMs)
      const result: DianPingResult = {
        latencyMs,
        environment: activeEnv,
        checkedAt: formatCurrentTimeCO(),
        statusText: 'Operacional',
      }
      setIsPinging(false)
      setLastPing(result)
      toast.success(
        `Ping DIAN (${DIAN_ENVIRONMENTS[activeEnv].label}) exitoso: ${latencyMs} ms — WebService operacional.`
      )
    }, SIMULATED_PING_DELAY_MS)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* KPI Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aceptadas por DIAN
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{acceptedCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">Con CUFE / CUNE / CUDE validado</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En Trámite / Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 tabular-nums">{pendingCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">En cola de transmisión o sync</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rechazadas / Con Error
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">{rejectedCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren ajuste de datos</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monto Transmitido
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formatCurrency(totalTransmittedCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {docsInScope.length} documentos en el alcance actual
            </p>
          </CardContent>
        </Card>
      </div>

      {syncFeedback && (
        <div
          role="status"
          className="flex items-center justify-between gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-medium underline-offset-2 hover:underline"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={(value) => {
          if (isDianTab(value)) setSelectedTab(value)
        }}
        className="w-full"
      >
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="docs" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Documentos DIAN ({localDocs.length})
          </TabsTrigger>
          <TabsTrigger
            value="certificate"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap gap-1.5"
          >
            Certificado y Configuración UBL 2.1
            {certValidity.level === 'expired' && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                Vencido
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap gap-1.5"
          >
            Resolución y Rangos Autorizados
            {hasCriticalResolution && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                Alerta
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="pt-4">
          <DianInboxTab
            documents={filteredDocs}
            totalCount={localDocs.length}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            docTypeFilter={docTypeFilter}
            onDocTypeFilterChange={setDocTypeFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            isSyncingDoc={isSyncingDoc}
            onSimulateSync={handleSimulateSync}
            onDownloadMock={handleDownloadMock}
            onRetransmitRejected={handleRetransmitRejected}
            onCreateCreditNote={handleCreateCreditNote}
          />
        </TabsContent>

        <TabsContent value="certificate" className="pt-4">
          <DianCertificateTab
            certificate={certificate}
            onRenewCertificate={setCertificate}
            environment={environment}
            onEnvironmentChange={handleEnvironmentChange}
            isPinging={isPinging}
            lastPing={lastPing}
            onTestPing={handleTestPing}
          />
        </TabsContent>

        <TabsContent value="stats" className="pt-4">
          <DianResolutionsTab certificate={certificate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
