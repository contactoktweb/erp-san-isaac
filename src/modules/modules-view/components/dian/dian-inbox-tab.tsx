'use client'

import { Fragment, useId, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileCode,
  FilePlus2,
  FileText,
  Info,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DateRangeFilter, type DateRange } from '@/components/ui/date-range-filter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/config'
import {
  DIAN_DOC_TYPE_OPTIONS,
  DIAN_STATUS_OPTIONS,
  isDianDocTypeFilter,
  type DianDocTypeFilter,
  type DianDocumentRecord,
  type DianStatusFilter,
} from './dian-types'

interface DianInboxTabProps {
  documents: DianDocumentRecord[]
  totalCount: number
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  docTypeFilter: DianDocTypeFilter
  onDocTypeFilterChange: (value: DianDocTypeFilter) => void
  statusFilter: DianStatusFilter
  onStatusFilterChange: (value: DianStatusFilter) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  onResetFilters: () => void
  hasActiveFilters: boolean
  isSyncingDoc: string | null
  onSimulateSync: (doc: DianDocumentRecord) => void
  onDownloadMock: (type: 'xml' | 'pdf' | 'appresponse', docNumber: string) => void
  onRetransmitRejected: (docId: string, updatedNit: string, updatedName: string) => void
  onCreateCreditNote: (
    referencedDoc: DianDocumentRecord,
    amountCOP: number,
    concept: string,
    reason: string
  ) => void
}

const CREDIT_NOTE_CONCEPTS = [
  'Devolución parcial de mercancía o cambio de referencia',
  'Anulación total de factura electrónica',
  'Rebaja o descuento comercial otorgado',
  'Ajuste por diferencia en valor facturado',
] as const

export function DianInboxTab({
  documents,
  totalCount,
  searchQuery,
  onSearchQueryChange,
  docTypeFilter,
  onDocTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
  hasActiveFilters,
  isSyncingDoc,
  onSimulateSync,
  onDownloadMock,
  onRetransmitRejected,
  onCreateCreditNote,
}: DianInboxTabProps) {
  const searchInputId = useId()
  const docTypeSelectId = useId()
  const editNameId = useId()
  const editNitId = useId()
  const ncConceptId = useId()
  const ncAmountId = useId()
  const ncReasonId = useId()

  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({})
  const [activeDocDetail, setActiveDocDetail] = useState<DianDocumentRecord | null>(null)
  const [isEditingRecipient, setIsEditingRecipient] = useState(false)
  const [editedRecipientName, setEditedRecipientName] = useState('')
  const [editedRecipientNit, setEditedRecipientNit] = useState('')

  const [creditNoteTarget, setCreditNoteTarget] = useState<DianDocumentRecord | null>(null)
  const [ncConcept, setNcConcept] = useState<string>(CREDIT_NOTE_CONCEPTS[0])
  const [ncAmountInput, setNcAmountInput] = useState('')
  const [ncReason, setNcReason] = useState('')

  const hasNomInView =
    docTypeFilter === 'NOM' || documents.some((doc) => doc.prefix.toUpperCase() === 'NOM')

  const toggleBatch = (docId: string) => {
    setExpandedBatches((prev) => ({ ...prev, [docId]: !prev[docId] }))
  }

  const handleOpenRejectionDetail = (doc: DianDocumentRecord) => {
    setActiveDocDetail(doc)
    setIsEditingRecipient(false)
    setEditedRecipientName(doc.recipientName)
    setEditedRecipientNit(doc.recipientNit)
  }

  const handleOpenCreditNoteModal = (doc: DianDocumentRecord) => {
    setCreditNoteTarget(doc)
    setNcConcept(CREDIT_NOTE_CONCEPTS[0])
    setNcAmountInput(String(doc.totalAmountCOP))
    setNcReason('')
  }

  const handleSubmitCreditNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!creditNoteTarget) return

    const parsedAmount = Math.round(Number(ncAmountInput))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Ingrese un valor válido mayor a $0 COP para la Nota Crédito.')
      return
    }
    if (parsedAmount > creditNoteTarget.totalAmountCOP) {
      toast.error(
        `El valor no puede superar el total del documento referenciado (${formatCurrency(creditNoteTarget.totalAmountCOP)}).`
      )
      return
    }

    onCreateCreditNote(creditNoteTarget, parsedAmount, ncConcept, ncReason.trim())
    setCreditNoteTarget(null)
  }

  const handleConfirmRetransmit = () => {
    if (!activeDocDetail) return
    const nextNit = editedRecipientNit.trim() || activeDocDetail.recipientNit
    const nextName = editedRecipientName.trim() || activeDocDetail.recipientName
    onRetransmitRejected(activeDocDetail.id, nextNit, nextName)
    setActiveDocDetail(null)
    setIsEditingRecipient(false)
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Label htmlFor={searchInputId} className="sr-only">
              Buscar por Folio, Adquirente, NIT o CUFE
            </Label>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchInputId}
              placeholder="Buscar por Folio, Cliente, NIT o CUFE / CUNE..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={docTypeSelectId}
                className="text-xs font-medium text-muted-foreground whitespace-nowrap"
              >
                Tipo de Documento:
              </Label>
              <select
                id={docTypeSelectId}
                value={docTypeFilter}
                onChange={(e) => {
                  if (isDianDocTypeFilter(e.target.value)) {
                    onDocTypeFilterChange(e.target.value)
                  }
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {DIAN_DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <DateRangeFilter
              value={dateRange}
              onChange={onDateRangeChange}
              label="Rango de fechas de documentos DIAN"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium mr-1">Estado DIAN:</span>
            {DIAN_STATUS_OPTIONS.map((st) => (
              <Button
                key={st}
                type="button"
                variant={statusFilter === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusFilterChange(st)}
                className="h-7 text-xs font-medium px-2.5"
              >
                {st === 'ALL' ? 'Todos' : st}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground">
            <span>
              Mostrando <strong className="text-foreground">{documents.length}</strong> de{' '}
              <strong className="text-foreground">{totalCount}</strong> documentos
            </span>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nota informativa obligatoria para Nómina Electrónica (NOM) */}
      {hasNomInView && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-50/70 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200"
        >
          <Info className="size-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" aria-hidden="true" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Regla DIAN de Nómina Electrónica (NOM):</strong> La DIAN exige la
            generación y transmisión de un <strong>XML y CUNE individual por cada trabajador</strong>. En esta bandeja
            se agrupan por período como un <strong>lote desplegable</strong> para facilitar la consulta contable; expanda
            el lote para inspeccionar o descargar el soporte individual de cada colaborador.
          </div>
        </div>
      )}

      {/* Tabla de documentos DIAN */}
      <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Folio / Tipo</th>
              <th scope="col" className="px-4 py-3">Adquirente / Receptor</th>
              <th scope="col" className="px-4 py-3">Fecha y CUFE / CUNE</th>
              <th scope="col" className="px-4 py-3 text-right">Total Documento</th>
              <th scope="col" className="px-4 py-3 text-center">Estado DIAN</th>
              <th scope="col" className="px-4 py-3 text-center">Soportes Legales</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">
                  <p className="mb-2">No se encontraron documentos electrónicos con los filtros aplicados.</p>
                  {hasActiveFilters && (
                    <Button type="button" variant="outline" size="sm" onClick={onResetFilters} className="h-7 text-xs">
                      Restablecer filtros
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              documents.map((doc) => {
                const isAccepted = doc.dianStatus === 'Aceptada'
                const isPending = doc.dianStatus === 'Pendiente'
                const isRejected = doc.dianStatus === 'Rechazada'
                const isNom = doc.prefix.toUpperCase() === 'NOM'
                const isNote =
                  doc.prefix.toUpperCase() === 'NC' ||
                  doc.prefix.toUpperCase() === 'ND' ||
                  doc.documentType.toLowerCase().includes('nota')
                const batchItems = Array.isArray(doc.batchItems) ? doc.batchItems : []
                const isBatchExpanded = Boolean(expandedBatches[doc.id])

                return (
                  <Fragment key={doc.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{doc.documentNumber}</span>
                          {doc.prefix.toUpperCase() === 'POS' && (
                            <Badge variant="info" className="text-[10px] px-1.5 py-0">
                              POS
                            </Badge>
                          )}
                          {isNote && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {doc.prefix}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{doc.documentType}</div>
                        {doc.referencedDocument && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Ref. documento: {doc.referencedDocument}
                          </div>
                        )}
                        {isNom && batchItems.length > 0 && (
                          <button
                            type="button"
                            aria-expanded={isBatchExpanded}
                            onClick={() => toggleBatch(doc.id)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                          >
                            {isBatchExpanded ? (
                              <ChevronDown className="size-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="size-3.5" aria-hidden="true" />
                            )}
                            {isBatchExpanded
                              ? `Ocultar lote (${batchItems.length} XML/CUNE)`
                              : `Desplegar lote (${batchItems.length} XML/CUNE)`}
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{doc.recipientName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          NIT/Doc: {doc.recipientNit}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs text-foreground">{formatDate(doc.transmissionDate)}</div>
                        <div
                          className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]"
                          title={doc.cufeOrCune}
                        >
                          {doc.cufeOrCune.substring(0, 20)}...
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                        {formatCurrency(doc.totalAmountCOP)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isAccepted ? 'success' : isPending ? 'warning' : 'danger'}
                          className="text-[11px] font-medium"
                        >
                          {doc.dianStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Descargar XML UBL 2.1 firmado"
                            aria-label={`Descargar XML UBL 2.1 de ${doc.documentNumber}`}
                            onClick={() => onDownloadMock('xml', doc.documentNumber)}
                          >
                            <FileCode className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Descargar PDF con QR y CUFE/CUDE"
                            aria-label={`Descargar PDF de ${doc.documentNumber}`}
                            onClick={() => onDownloadMock('pdf', doc.documentNumber)}
                          >
                            <FileText className="h-4 w-4 text-rose-600" aria-hidden="true" />
                          </Button>
                          {isAccepted && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Descargar ApplicationResponse DIAN"
                              aria-label={`Descargar ApplicationResponse de ${doc.documentNumber}`}
                              onClick={() => onDownloadMock('appresponse', doc.documentNumber)}
                            >
                              <FileCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAccepted && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() =>
                                  toast.success(
                                    `Documento ${doc.documentNumber} reenviado al buzón tributario de ${doc.recipientName}.`
                                  )
                                }
                              >
                                <Mail className="h-3 w-3 mr-1" aria-hidden="true" />
                                Reenviar
                              </Button>
                              {!isNote && !isNom && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2 text-amber-700 hover:text-amber-800 dark:text-amber-400"
                                  onClick={() => handleOpenCreditNoteModal(doc)}
                                >
                                  <FilePlus2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                  Nota Crédito
                                </Button>
                              )}
                            </>
                          )}

                          {isPending && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs px-2"
                              disabled={isSyncingDoc === doc.documentNumber}
                              onClick={() => onSimulateSync(doc)}
                            >
                              <RefreshCw
                                className={`h-3 w-3 mr-1 ${isSyncingDoc === doc.documentNumber ? 'animate-spin' : ''}`}
                                aria-hidden="true"
                              />
                              Ping DIAN
                            </Button>
                          )}

                          {isRejected && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => handleOpenRejectionDetail(doc)}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                              Ver Error y Corregir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Sub-tabla desplegable del lote NOM (1 XML/CUNE por trabajador) */}
                    {isNom && isBatchExpanded && batchItems.length > 0 && (
                      <tr className="bg-muted/25">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="rounded-md border border-border/70 bg-background p-3 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <span className="font-semibold text-foreground">
                                Detalle de Transmisión Individual por Trabajador — {doc.documentNumber}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {batchItems.length} archivos XML/CUNE individuales validados ante la DIAN
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="border-b bg-muted/40 text-[11px] uppercase text-muted-foreground">
                                  <tr>
                                    <th scope="col" className="px-3 py-2">Soporte NIE</th>
                                    <th scope="col" className="px-3 py-2">Trabajador / Documento</th>
                                    <th scope="col" className="px-3 py-2">CUNE Individual</th>
                                    <th scope="col" className="px-3 py-2 text-right">Neto Reportado</th>
                                    <th scope="col" className="px-3 py-2 text-center">Estado</th>
                                    <th scope="col" className="px-3 py-2 text-right">XML / PDF</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                  {batchItems.map((worker) => (
                                    <tr key={worker.documentNumber} className="hover:bg-muted/20">
                                      <td className="px-3 py-2 font-mono font-semibold text-foreground">
                                        {worker.documentNumber}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="font-medium text-foreground">{worker.workerName}</div>
                                        <div className="text-[11px] text-muted-foreground font-mono">
                                          {worker.workerId}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                        {worker.cune}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                                        {formatCurrency(worker.netAmountCOP)}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        <Badge variant="success" className="text-[10px]">
                                          {worker.dianStatus}
                                        </Badge>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="inline-flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            title={`Descargar XML individual de ${worker.workerName}`}
                                            aria-label={`Descargar XML individual ${worker.documentNumber}`}
                                            onClick={() => onDownloadMock('xml', worker.documentNumber)}
                                          >
                                            <FileCode className="size-3.5" aria-hidden="true" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            title={`Descargar PDF individual de ${worker.workerName}`}
                                            aria-label={`Descargar PDF individual ${worker.documentNumber}`}
                                            onClick={() => onDownloadMock('pdf', worker.documentNumber)}
                                          >
                                            <FileText className="size-3.5 text-rose-600" aria-hidden="true" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Panel de detalle de rechazo y corrección inline */}
      {activeDocDetail && (
        <Card className="border-rose-500/40 bg-rose-500/5 mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h3>Detalle de Rechazo Validación Previa DIAN — {activeDocDetail.documentNumber}</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveDocDetail(null)}
                className="h-7 text-xs"
              >
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-background border border-rose-200 dark:border-rose-900/50 rounded-md">
              <div className="font-medium text-xs uppercase text-rose-600 mb-1">
                Diagnóstico del WebService DIAN (Código de Error UBL):
              </div>
              <p className="text-xs text-foreground font-mono">
                {activeDocDetail.rejectionReason ||
                  'Regla FAS01: Error de validación previa en dígito de verificación del Adquirente.'}
              </p>
            </div>

            {isEditingRecipient && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-md border border-border bg-background text-xs">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={editNameId} className="text-xs font-semibold">
                    Razón Social del Adquirente
                  </Label>
                  <Input
                    id={editNameId}
                    value={editedRecipientName}
                    onChange={(e) => setEditedRecipientName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={editNitId} className="text-xs font-semibold">
                    NIT con Dígito de Verificación (Módulo 11)
                  </Label>
                  <Input
                    id={editNitId}
                    value={editedRecipientNit}
                    onChange={(e) => setEditedRecipientNit(e.target.value)}
                    placeholder="Ej. 900.412.009-5"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <span className="text-xs text-muted-foreground">
                Corrija el NIT o dígito de verificación del tercero antes de re-transmitir a la DIAN (simulación local).
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setIsEditingRecipient((prev) => !prev)}
                >
                  {isEditingRecipient ? 'Ocultar Editor' : 'Editar Tercero'}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleConfirmRetransmit}
                >
                  <Send className="h-3 w-3 mr-1" aria-hidden="true" />
                  Re-transmitir a la DIAN
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal: Emitir Nota Crédito Electrónica */}
      {creditNoteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-credit-note"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FilePlus2 className="size-4 text-primary" aria-hidden="true" />
                <h3 id="modal-title-credit-note" className="text-base font-bold text-foreground">
                  Emitir Nota Crédito Electrónica
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal de Nota Crédito"
                onClick={() => setCreditNoteTarget(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreditNote} className="flex flex-col gap-4 text-xs">
              <div className="rounded-md bg-muted/40 p-3 space-y-1">
                <div className="font-semibold text-foreground">
                  Documento referenciado: {creditNoteTarget.documentNumber} ({creditNoteTarget.documentType})
                </div>
                <div className="text-muted-foreground">
                  Adquirente: {creditNoteTarget.recipientName} — NIT {creditNoteTarget.recipientNit}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground truncate">
                  CUFE/CUDE: {creditNoteTarget.cufeOrCune}
                </div>
                <div className="text-muted-foreground">
                  Monto máximo acreditable:{' '}
                  <strong className="text-foreground">{formatCurrency(creditNoteTarget.totalAmountCOP)}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ncConceptId} className="text-xs font-semibold">
                  Concepto DIAN de Nota Crédito *
                </Label>
                <select
                  id={ncConceptId}
                  value={ncConcept}
                  onChange={(e) => setNcConcept(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CREDIT_NOTE_CONCEPTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ncAmountId} className="text-xs font-semibold">
                  Valor de la Nota Crédito (COP) *
                </Label>
                <Input
                  id={ncAmountId}
                  type="number"
                  min={1}
                  max={creditNoteTarget.totalAmountCOP}
                  required
                  value={ncAmountInput}
                  onChange={(e) => setNcAmountInput(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={ncReasonId} className="text-xs font-semibold">
                  Observación / Justificación
                </Label>
                <Input
                  id={ncReasonId}
                  type="text"
                  value={ncReason}
                  onChange={(e) => setNcReason(e.target.value)}
                  placeholder="Ej. Ajuste por devolución de velones referencia V-104"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreditNoteTarget(null)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-semibold gap-1.5">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Transmitir Nota Crédito (Demo)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
