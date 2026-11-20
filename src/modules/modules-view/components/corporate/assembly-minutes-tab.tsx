'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/config'
import {
  CORPORATE_COMPANY,
  formatFileSize,
  type AssemblyMinuteRecord,
  type ChamberRegistryStatus,
  type CorporateBaseDocument,
  type MeetingType,
} from './corporate-constants'

interface AssemblyMinutesTabProps {
  minutes: AssemblyMinuteRecord[]
  baseDocuments: CorporateBaseDocument[]
  onAddMinute: (minute: AssemblyMinuteRecord) => void
  onUpdateBaseDocument: (docId: CorporateBaseDocument['id'], file: File) => void
  onPrintMinute: (minute: AssemblyMinuteRecord) => void
}

function getNextMinuteNumber(minutes: AssemblyMinuteRecord[]): string {
  const maxNum = minutes.reduce((max, item) => {
    const match = item.minuteNumber.match(/(\d+)/)
    const parsed = match ? Number.parseInt(match[1], 10) : 0
    return Number.isNaN(parsed) ? max : Math.max(max, parsed)
  }, 0)
  return `Acta No. ${String(maxNum + 1).padStart(2, '0')}`
}

export function PrintableMinuteDocument({ minute }: { minute: AssemblyMinuteRecord }) {
  return (
    <div className="space-y-4 p-6 text-xs text-foreground bg-white">
      <div className="border-b pb-3 text-center space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          {CORPORATE_COMPANY.chamberName} ({CORPORATE_COMPANY.chamberAcronym}) • Matrícula{' '}
          {CORPORATE_COMPANY.mercantileRegistration}
        </div>
        <h4 className="text-base font-bold font-serif">{CORPORATE_COMPANY.legalName}</h4>
        <div className="text-[11px] font-mono text-muted-foreground">
          NIT {CORPORATE_COMPANY.nit} • {CORPORATE_COMPANY.address}
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-2">
        <div>
          <div className="text-sm font-bold">
            {minute.minuteNumber} — {minute.title}
          </div>
          <div className="text-muted-foreground">Asamblea {minute.meetingType}</div>
        </div>
        <div className="text-right">
          <div>Fecha: {formatDate(`${minute.sessionDate}T00:00:00.000Z`)}</div>
          <div className="font-semibold">{minute.chamberStatus}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
          Resumen de Decisiones Adoptadas
        </div>
        <p className="leading-relaxed">{minute.decisionsSummary}</p>
      </div>

      <div className="pt-8 grid grid-cols-2 gap-8 text-center">
        <div className="border-t border-foreground/40 pt-2">
          <div className="font-semibold">{CORPORATE_COMPANY.legalRepresentativeName}</div>
          <div className="text-[11px] text-muted-foreground">
            {CORPORATE_COMPANY.legalRepresentativeDoc} • Presidente / Representante Legal
          </div>
        </div>
        <div className="border-t border-foreground/40 pt-2">
          <div className="font-semibold">{CORPORATE_COMPANY.legalName}</div>
          <div className="text-[11px] text-muted-foreground">Secretaría de Asamblea • Libro de Actas</div>
        </div>
      </div>
    </div>
  )
}

export function AssemblyMinutesTab({
  minutes,
  baseDocuments,
  onAddMinute,
  onUpdateBaseDocument,
  onPrintMinute,
}: AssemblyMinutesTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [minuteNumber, setMinuteNumber] = useState('')
  const [minuteTitle, setMinuteTitle] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('Ordinaria')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [decisionsSummary, setDecisionsSummary] = useState('')
  const [requiresChamberRegistry, setRequiresChamberRegistry] = useState<'yes' | 'no'>('yes')
  const [chamberStatus, setChamberStatus] = useState<ChamberRegistryStatus>('En Trámite CCHG')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const createdUrlsRef = useRef<string[]>([])

  useEffect(() => {
    const urls = createdUrlsRef.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const openRegisterModal = () => {
    setMinuteNumber(getNextMinuteNumber(minutes))
    setMinuteTitle('')
    setMeetingType('Ordinaria')
    setSessionDate(new Date().toISOString().slice(0, 10))
    setDecisionsSummary('')
    setRequiresChamberRegistry('yes')
    setChamberStatus('En Trámite CCHG')
    setAttachedFile(null)
    setFormError(null)
    setIsModalOpen(true)
  }

  const handleSubmitMinute = (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)

    if (!minuteNumber.trim() || !sessionDate || !decisionsSummary.trim()) {
      setFormError('Complete el número de acta, la fecha de sesión y el resumen de decisiones.')
      return
    }

    if (!attachedFile) {
      setFormError('Debe adjuntar el archivo PDF firmado del acta.')
      return
    }

    const fileObjectUrl = URL.createObjectURL(attachedFile)
    createdUrlsRef.current.push(fileObjectUrl)

    const normalizedNumber = minuteNumber.trim().toLowerCase().startsWith('acta')
      ? minuteNumber.trim()
      : `Acta No. ${minuteNumber.trim()}`

    const newMinute: AssemblyMinuteRecord = {
      id: `min-${Date.now()}`,
      minuteNumber: normalizedNumber,
      title: minuteTitle.trim() || `Asamblea ${meetingType}`,
      meetingType,
      sessionDate,
      decisionsSummary: decisionsSummary.trim(),
      requiresChamberRegistry: requiresChamberRegistry === 'yes',
      chamberStatus: requiresChamberRegistry === 'no' ? 'No Requiere CCHG' : chamberStatus,
      fileName: attachedFile.name,
      fileSizeBytes: attachedFile.size,
      fileObjectUrl,
    }

    onAddMinute(newMinute)
    setIsModalOpen(false)
  }

  const handleDownloadMinute = (minute: AssemblyMinuteRecord) => {
    if (minute.fileObjectUrl) {
      const link = document.createElement('a')
      link.href = minute.fileObjectUrl
      link.download = minute.fileName
      link.click()
      toast.success(`Descargando ${minute.fileName}`)
      return
    }
    onPrintMinute(minute)
    toast.info(`Preparando PDF imprimible de ${minute.minuteNumber}`)
  }

  const handleDownloadBaseDoc = (doc: CorporateBaseDocument) => {
    if (doc.fileObjectUrl) {
      const link = document.createElement('a')
      link.href = doc.fileObjectUrl
      link.download = doc.fileName
      link.click()
      toast.success(`Descargando ${doc.fileName}`)
      return
    }
    toast.success(`Documento oficial verificado: ${doc.fileName}`, {
      description: `${CORPORATE_COMPANY.legalName} — Matrícula ${CORPORATE_COMPANY.mercantileRegistration} (${CORPORATE_COMPANY.chamberAcronym}).`,
    })
  }

  const filteredMinutes = minutes.filter((m) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      m.minuteNumber.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.meetingType.toLowerCase().includes(q) ||
      m.decisionsSummary.toLowerCase().includes(q) ||
      m.chamberStatus.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Barra de Documentos Societarios Base */}
      <section aria-label="Documentos societarios vigentes" className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documentos Societarios Base ({CORPORATE_COMPANY.chamberAcronym} · Matrícula{' '}
          {CORPORATE_COMPANY.mercantileRegistration})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {baseDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col justify-between gap-3 rounded-lg border border-border/80 bg-card p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground leading-snug">{doc.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{doc.subtitle}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-mono text-muted-foreground">
                      <span className="truncate max-w-56">{doc.fileName}</span>
                      {doc.fileSizeBytes && <span>({formatFileSize(doc.fileSizeBytes)})</span>}
                      <span>• Vigencia: {formatDate(`${doc.updatedAt}T00:00:00.000Z`)}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px] shrink-0">
                  {doc.statusLabel}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/50 pt-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => handleDownloadBaseDoc(doc)}
                >
                  <Download className="size-3.5 text-blue-600" aria-hidden="true" />
                  Descargar PDF
                </Button>
                <FileUploadButton
                  accept=".pdf"
                  onFileSelected={(file) => onUpdateBaseDocument(doc.id, file)}
                  onError={(msg) => toast.error(msg)}
                >
                  Subir / Renovar PDF
                </FileUploadButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar: Buscador + Registrar Acta */}
      <section aria-label="Libro de actas de asamblea" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Buscar actas de asamblea"
              placeholder="Buscar por número de acta, tipo, decisión o estado CCHG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={openRegisterModal}
            className="text-xs gap-1.5 self-start sm:self-auto font-semibold"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Registrar Acta / Subir PDF Firmado
          </Button>
        </div>

        {/* Tabla de Actas */}
        <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Acta No. / Tipo de Reunión</th>
                <th scope="col" className="px-4 py-3">Fecha de Sesión</th>
                <th scope="col" className="px-4 py-3">Puntos Clave / Decisiones Adoptadas</th>
                <th scope="col" className="px-4 py-3 text-center">Registro CCHG</th>
                <th scope="col" className="px-4 py-3 text-right">PDF Firmado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredMinutes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron actas que coincidan con &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredMinutes.map((minute) => (
                  <tr key={minute.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="font-bold text-foreground">
                        {minute.minuteNumber} - {minute.title}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Asamblea {minute.meetingType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      {formatDate(`${minute.sessionDate}T00:00:00.000Z`)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md">
                      {minute.decisionsSummary}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {minute.chamberStatus === 'Registrada CCHG' ? (
                        <Badge variant="default" className="text-[10px]">
                          Registrada CCHG
                        </Badge>
                      ) : minute.chamberStatus === 'En Trámite CCHG' ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-700 border-amber-300 bg-amber-50"
                        >
                          En Trámite CCHG
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="text-[10px]">
                          No Requiere CCHG
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleDownloadMinute(minute)}
                        title={`Descargar ${minute.fileName}`}
                      >
                        <Download className="size-3.5 text-blue-600" aria-hidden="true" />
                        <span className="hidden sm:inline">PDF</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: + Registrar Acta / Subir PDF Firmado */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-register-minute"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                <h3 id="modal-title-register-minute" className="text-base font-bold text-foreground">
                  Registrar Acta / Subir PDF Firmado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal de registro de acta"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMinute} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-number" className="font-semibold text-foreground">
                    Número de Acta *
                  </label>
                  <Input
                    id="min-number"
                    required
                    value={minuteNumber}
                    onChange={(e) => setMinuteNumber(e.target.value)}
                    placeholder="Ej. Acta No. 10"
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-type" className="font-semibold text-foreground">
                    Tipo de Asamblea *
                  </label>
                  <select
                    id="min-type"
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Ordinaria">Ordinaria</option>
                    <option value="Extraordinaria">Extraordinaria</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-date" className="font-semibold text-foreground">
                    Fecha de Sesión *
                  </label>
                  <Input
                    id="min-date"
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-title" className="font-semibold text-foreground">
                    Asunto / Título Breve
                  </label>
                  <Input
                    id="min-title"
                    value={minuteTitle}
                    onChange={(e) => setMinuteTitle(e.target.value)}
                    placeholder="Ej. Aprobación Estados Financieros"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="min-decisions" className="font-semibold text-foreground">
                  Resumen de Decisiones *
                </label>
                <textarea
                  id="min-decisions"
                  required
                  rows={3}
                  value={decisionsSummary}
                  onChange={(e) => setDecisionsSummary(e.target.value)}
                  placeholder="Describa las decisiones aprobadas por la Asamblea General de Accionistas..."
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="min-requires-cchg" className="font-semibold text-foreground">
                    ¿Requiere registro en Cámara (CCHG)? *
                  </label>
                  <select
                    id="min-requires-cchg"
                    value={requiresChamberRegistry}
                    onChange={(e) => {
                      const val = e.target.value as 'yes' | 'no'
                      setRequiresChamberRegistry(val)
                      if (val === 'yes' && chamberStatus === 'No Requiere CCHG') {
                        setChamberStatus('En Trámite CCHG')
                      }
                    }}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="yes">Sí — Requiere registro en CCHG</option>
                    <option value="no">No — Archivo societario interno</option>
                  </select>
                </div>

                {requiresChamberRegistry === 'yes' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="min-cchg-status" className="font-semibold text-foreground">
                      Estado ante CCHG *
                    </label>
                    <select
                      id="min-cchg-status"
                      value={chamberStatus}
                      onChange={(e) => setChamberStatus(e.target.value as ChamberRegistryStatus)}
                      className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="En Trámite CCHG">En Trámite CCHG</option>
                      <option value="Registrada CCHG">Registrada CCHG</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground">Archivo PDF Firmado *</div>
                    <div className="text-[11px] text-muted-foreground">
                      Solo archivos .pdf (máx. 10 MB)
                    </div>
                  </div>
                  <FileUploadButton
                    accept=".pdf"
                    onFileSelected={(file) => {
                      setAttachedFile(file)
                      setFormError(null)
                    }}
                    onError={(msg) => setFormError(msg)}
                  >
                    {attachedFile ? 'Cambiar PDF' : 'Seleccionar PDF Firmado'}
                  </FileUploadButton>
                </div>

                {attachedFile && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{attachedFile.name}</span>
                    <span className="text-muted-foreground">
                      ({formatFileSize(attachedFile.size)})
                    </span>
                  </div>
                )}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-800"
                >
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-semibold">
                  Guardar Acta y Adjuntar PDF
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
