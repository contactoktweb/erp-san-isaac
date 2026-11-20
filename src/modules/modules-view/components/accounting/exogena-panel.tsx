'use client'

import { useId, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatNumber } from '@/lib/config'
import { FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import { EXOGENA_FORMATS } from './accounting-data'
import {
  buildMuiscaFileName,
  buildMuiscaPartitions,
  downloadBlobFile,
  exportExogenaExcel,
  generateMuiscaXmlContent,
  sanitizeIdentificationNumber,
  validateMuiscaFileName,
} from './accounting-helpers'
import {
  CUANTIAS_MENORES_NIT,
  MUISCA_FILENAME_LENGTH,
  MUISCA_MAX_RECORDS_PER_FILE,
  type ExogenaFormatCode,
  type MuiscaConcept,
} from './types'

const DEMO_LARGE_BATCH_RECORDS = 11_200

export function ExogenaPanel() {
  const yearSelectId = useId()
  const consecutivoInputId = useId()
  const conceptoSelectId = useId()
  const volumeInputId = useId()

  const baseYear = FISCAL_PARAMETERS.fiscalYear
  const availableYears = [baseYear - 2, baseYear - 1, baseYear, baseYear + 1]

  const [fiscalYear, setFiscalYear] = useState<number>(baseYear)
  const [consecutivo, setConsecutivo] = useState<number>(1)
  const [concepto, setConcepto] = useState<MuiscaConcept>('01')
  const [selectedFormatCode, setSelectedFormatCode] = useState<ExogenaFormatCode>('1001')
  const [simulatedRecordCount, setSimulatedRecordCount] = useState<number>(EXOGENA_FORMATS[0].recordCount)

  const selectedFormat = useMemo(
    () => EXOGENA_FORMATS.find((f) => f.code === selectedFormatCode) ?? EXOGENA_FORMATS[0],
    [selectedFormatCode]
  )

  const handleSelectFormat = (code: ExogenaFormatCode) => {
    setSelectedFormatCode(code)
    const found = EXOGENA_FORMATS.find((f) => f.code === code)
    if (found) {
      setSimulatedRecordCount(found.recordCount)
    }
  }

  const muiscaFileName = useMemo(
    () =>
      buildMuiscaFileName(
        concepto,
        selectedFormat.code,
        selectedFormat.version,
        fiscalYear,
        consecutivo
      ),
    [concepto, selectedFormat.code, selectedFormat.version, fiscalYear, consecutivo]
  )

  const isMuiscaFileNameValid = validateMuiscaFileName(muiscaFileName)

  const partitions = useMemo(
    () =>
      buildMuiscaPartitions(
        concepto,
        selectedFormat.code,
        selectedFormat.version,
        fiscalYear,
        consecutivo,
        simulatedRecordCount
      ),
    [concepto, selectedFormat.code, selectedFormat.version, fiscalYear, consecutivo, simulatedRecordCount]
  )

  const handleDownloadXml = (partitionIndex = 0) => {
    const targetPartition = partitions[partitionIndex] ?? partitions[0]
    const xmlContent = generateMuiscaXmlContent({
      format: selectedFormat,
      concepto,
      fiscalYear,
      consecutivo: targetPartition.consecutivo,
      partition: targetPartition,
    })
    downloadBlobFile(xmlContent, targetPartition.fileName, 'application/xml;charset=utf-8')
    toast.success(`XML MUISCA descargado: ${targetPartition.fileName}`)
  }

  const handleDownloadExcel = () => {
    const fileName = exportExogenaExcel(selectedFormat, fiscalYear)
    toast.success(`Excel Prevalidador descargado: ${fileName}`)
  }

  const minorQuantitiesRow = selectedFormat.rows.find(
    (r) => sanitizeIdentificationNumber(r.documentNumber) === CUANTIAS_MENORES_NIT
  )

  return (
    <section aria-label="Prevalidador Información Exógena DIAN" className="flex flex-col gap-4">
      <div className="rounded-lg border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 p-4 text-xs text-purple-950 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm">Asistente de Información Exógena (Numeral 16)</h3>
          <p className="mt-1">
            Cruce automático de cuentas contables por tercero, discriminación de cuantías menores (NIT {CUANTIAS_MENORES_NIT}) y exportación en formato oficial DIAN (Prevalidador y XML MUISCA con partición cada {formatNumber(MUISCA_MAX_RECORDS_PER_FILE)} registros).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleDownloadExcel}
            className="text-xs h-8 gap-1.5 bg-background"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" aria-hidden="true" />
            Descargar Excel Prevalidador
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => handleDownloadXml(0)}
            className="text-xs h-8 gap-1.5 bg-purple-700 hover:bg-purple-800 text-white"
          >
            <FileCheck2 className="size-3.5" aria-hidden="true" />
            Generar XML MUISCA
          </Button>
        </div>
      </div>

      {/* Parámetros oficiales MUISCA */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={yearSelectId} className="text-xs font-semibold text-foreground">
            Año Gravable
          </label>
          <select
            id={yearSelectId}
            value={fiscalYear}
            onChange={(e) => setFiscalYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={consecutivoInputId} className="text-xs font-semibold text-foreground">
            Consecutivo de envío del año
          </label>
          <Input
            id={consecutivoInputId}
            type="number"
            min={1}
            max={99999999}
            value={consecutivo}
            onChange={(e) => setConsecutivo(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
            className="h-9 font-mono text-xs"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={conceptoSelectId} className="text-xs font-semibold text-foreground">
            Concepto de Envío
          </label>
          <select
            id={conceptoSelectId}
            value={concepto}
            onChange={(e) => setConcepto(e.target.value as MuiscaConcept)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="01">01 - Inserción/Nuevo</option>
            <option value="02">02 - Reemplazo</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Archivo MUISCA Generado</span>
          <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-purple-300 bg-purple-500/5 px-2.5 dark:border-purple-800">
            <code className="truncate font-mono text-[0.6875rem] font-bold text-purple-800 dark:text-purple-300">
              {muiscaFileName}
            </code>
            <Badge
              variant={isMuiscaFileNameValid ? 'success' : 'danger'}
              className="shrink-0 text-[0.625rem]"
            >
              {muiscaFileName.length}/{MUISCA_FILENAME_LENGTH}
            </Badge>
          </div>
        </div>
      </div>

      {/* Partición de archivos (máx 5.000 registros) */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-purple-600" aria-hidden="true" />
            <h4 className="text-xs font-bold text-foreground">
              Partición Automática MUISCA (Máx. {formatNumber(MUISCA_MAX_RECORDS_PER_FILE)} registros por archivo)
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={volumeInputId} className="text-[0.6875rem] font-medium text-muted-foreground">
              Registros en lote:
            </label>
            <Input
              id={volumeInputId}
              type="number"
              min={1}
              max={100000}
              value={simulatedRecordCount}
              onChange={(e) => setSimulatedRecordCount(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
              className="h-7 w-24 font-mono text-xs"
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setSimulatedRecordCount(DEMO_LARGE_BATCH_RECORDS)}
            >
              Simular {formatNumber(DEMO_LARGE_BATCH_RECORDS)} reg.
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Formato <strong className="text-foreground">{selectedFormat.code} v{selectedFormat.version}</strong> ·{' '}
            <strong className="text-foreground">{formatNumber(simulatedRecordCount)}</strong> registros totales →{' '}
            <strong className="text-purple-700 dark:text-purple-300">
              {partitions.length} {partitions.length === 1 ? 'archivo XML' : 'archivos XML'}
            </strong>
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {partitions.map((part, idx) => (
            <li
              key={part.fileName}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-bold text-foreground truncate">
                  <FileCode2 className="size-3.5 shrink-0 text-purple-600" aria-hidden="true" />
                  <span className="truncate">{part.fileName}</span>
                </div>
                <div className="text-[0.6875rem] text-muted-foreground">
                  Parte {part.partNumber}/{part.totalParts} · Registros {formatNumber(part.recordFrom)}–
                  {formatNumber(part.recordTo)} ({formatNumber(part.recordCount)} reg.)
                </div>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => handleDownloadXml(idx)}
                aria-label={`Descargar XML ${part.fileName}`}
                className="shrink-0"
              >
                <Download className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* 7 Tarjetas de formato clicables */}
      <div>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Formatos Exógena DIAN ({EXOGENA_FORMATS.length} disponibles — haga clic para cambiar vista previa)
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXOGENA_FORMATS.map((fmt) => {
            const isSelected = fmt.code === selectedFormat.code
            return (
              <button
                key={fmt.code}
                type="button"
                onClick={() => handleSelectFormat(fmt.code)}
                aria-pressed={isSelected}
                className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-600 bg-purple-500/5 ring-2 ring-purple-600/20 shadow-xs'
                    : 'border-border bg-card hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">{fmt.title}</span>
                  <Badge variant="outline" className={`text-[10px] ${fmt.badgeClass}`}>
                    {fmt.badgeText}
                  </Badge>
                </div>
                <p className="text-[0.6875rem] text-muted-foreground mt-1 line-clamp-2">
                  {fmt.subtitle}
                </p>
                <div className="mt-3 flex items-center justify-between border-t pt-2">
                  <span className="text-[0.6875rem] text-muted-foreground">{fmt.countLabel}</span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {formatCurrency(fmt.totalAmountCOP)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabla del formato activo */}
      <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
        <div className="bg-muted/40 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-foreground">
            Vista Previa {selectedFormat.title} — {selectedFormat.subtitle}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedFormat.code === '1001' && minorQuantitiesRow && (
              <Badge variant="info" className="text-[10px]">
                Cuantías menores agrupadas en NIT {CUANTIAS_MENORES_NIT}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground font-mono">
              NIT sin puntos ni guiones + DV separado
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5">Concepto</th>
                <th scope="col" className="px-4 py-2.5">Tipo Doc</th>
                <th scope="col" className="px-4 py-2.5">Número Identificación</th>
                <th scope="col" className="px-4 py-2.5 text-center">DV</th>
                <th scope="col" className="px-4 py-2.5">Razón Social / Beneficiario</th>
                <th scope="col" className="px-4 py-2.5 text-right">{selectedFormat.primaryColumnLabel}</th>
                <th scope="col" className="px-4 py-2.5 text-right">{selectedFormat.secondaryColumnLabel}</th>
                <th scope="col" className="px-4 py-2.5 text-center">Estado Validación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {selectedFormat.rows.map((row) => {
                const cleanDoc = sanitizeIdentificationNumber(row.documentNumber)
                return (
                  <tr
                    key={row.id}
                    className={
                      row.isMinorQuantities
                        ? 'bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50/80'
                        : 'hover:bg-muted/30'
                    }
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">
                      {row.conceptLabel}
                    </td>
                    <td className="px-4 py-2.5">{row.docTypeLabel}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-foreground">{cleanDoc}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-muted-foreground">
                      {row.dv || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{row.businessName}</td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium">
                      {formatCurrency(row.primaryAmountCOP)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.secondaryAmountCOP)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          row.isMinorQuantities
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="size-3" aria-hidden="true" /> {row.validationStatus}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
