'use client'

import { useEffect, useId, useRef, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Flame,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangeFilter, getCurrentMonthRange, type DateRange } from '@/components/ui/date-range-filter'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReportDefinition } from '@/database/schemas'
import { formatCurrency, formatNumber } from '@/lib/config'
import {
  FISCAL_PARAMETERS,
  STATUTORY_AUDIT_THRESHOLDS_SMMLV,
  smmlvToPesos,
} from '@/lib/fiscal-parameters'
import { CostStatementTable } from './shared/cost-statement-table'

interface ReportsComplexViewProps {
  reports: ReportDefinition[]
}

type ReportTab = 'catalog' | 'cost_statement' | 'thresholds'
type ExportFormat = 'Excel' | 'PDF'

interface ExportFeedback {
  reportCode: string
  format: ExportFormat
  rangeLabel: string
}

const REPORT_KPI_SUMMARY = {
  accumulatedSalesCOP: 128_055_500,
  salesGrowthPercent: 14.2,
  grossMarginPercent: 42.8,
  paraffinRotationDays: 18.4,
  safetyStockDays: 45,
  thermalWastePercent: 1.84,
  thermalWasteTolerancePercent: 2.0,
  netOperatingFlowCOP: 41_200_000,
} as const

const SAN_ISAAC_AUDIT_ACTUALS = {
  grossIncomeCOP: 945_000_000,
  grossAssetsCOP: 1_280_000_000,
} as const

const EXPORT_SIMULATION_DELAY_MS = 600
const MAX_PROGRESS_PERCENT = 100

const HIGHLIGHTED_REPORT_CODES = new Set([
  'REP-CST-09',
  'REP-FIN-10',
  'REP-TRI-11',
  'REP-POS-12',
  'REP-TES-13',
  'REP-EXO-14',
])

const isReportTab = (value: string): value is ReportTab =>
  value === 'catalog' || value === 'cost_statement' || value === 'thresholds'

function formatIsoDateLabel(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

function formatDateRangeLabel(range: DateRange): string {
  if (range.from && range.to) {
    return `del ${formatIsoDateLabel(range.from)} al ${formatIsoDateLabel(range.to)}`
  }
  if (range.from) {
    return `desde el ${formatIsoDateLabel(range.from)}`
  }
  if (range.to) {
    return `hasta el ${formatIsoDateLabel(range.to)}`
  }
  return 'histórico completo (sin límite de fechas)'
}

export function ReportsComplexView({ reports }: ReportsComplexViewProps) {
  const searchInputId = useId()
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedTab, setSelectedTab] = useState<ReportTab>('catalog')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange>(() => getCurrentMonthRange())
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [lastExportFeedback, setLastExportFeedback] = useState<ExportFeedback | null>(null)

  useEffect(() => {
    return () => {
      if (exportTimerRef.current) {
        clearTimeout(exportTimerRef.current)
      }
    }
  }, [])

  const categories = ['ALL', ...Array.from(new Set(reports.map((r) => r.category)))]
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isDateRangeInvalid = Boolean(dateRange.from && dateRange.to && dateRange.from > dateRange.to)
  const activeRangeLabel = formatDateRangeLabel(dateRange)

  const filteredReports = reports.filter((r) => {
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory
    const matchesSearch =
      !normalizedQuery ||
      r.reportCode.toLowerCase().includes(normalizedQuery) ||
      r.title.toLowerCase().includes(normalizedQuery) ||
      r.description.toLowerCase().includes(normalizedQuery) ||
      r.category.toLowerCase().includes(normalizedQuery) ||
      r.authorizedRole.toLowerCase().includes(normalizedQuery)
    return matchesCategory && matchesSearch
  })

  const handleSimulateExport = (reportCode: string, format: ExportFormat) => {
    if (isDateRangeInvalid) {
      toast.error('Rango de fechas inválido', {
        description: 'La fecha inicial ("Desde") no puede ser posterior a la fecha final ("Hasta").',
      })
      return
    }

    if (exportTimerRef.current) {
      clearTimeout(exportTimerRef.current)
    }

    const rangeLabel = formatDateRangeLabel(dateRange)
    setGeneratingReport(reportCode)

    exportTimerRef.current = setTimeout(() => {
      setGeneratingReport(null)
      setLastExportFeedback({ reportCode, format, rangeLabel })
      toast.success(`Reporte ${reportCode} exportado en ${format}`, {
        description: `Rango aplicado: ${rangeLabel}.`,
      })
    }, EXPORT_SIMULATION_DELAY_MS)
  }

  // Topes legales de Revisoría Fiscal calculados dinámicamente desde parámetros fiscales
  const grossIncomeThresholdCOP = smmlvToPesos(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossIncome)
  const grossAssetsThresholdCOP = smmlvToPesos(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossAssets)
  const grossIncomePercent =
    grossIncomeThresholdCOP > 0
      ? (SAN_ISAAC_AUDIT_ACTUALS.grossIncomeCOP / grossIncomeThresholdCOP) * MAX_PROGRESS_PERCENT
      : 0
  const grossAssetsPercent =
    grossAssetsThresholdCOP > 0
      ? (SAN_ISAAC_AUDIT_ACTUALS.grossAssetsCOP / grossAssetsThresholdCOP) * MAX_PROGRESS_PERCENT
      : 0
  const requiresStatutoryAudit =
    SAN_ISAAC_AUDIT_ACTUALS.grossIncomeCOP >= grossIncomeThresholdCOP ||
    SAN_ISAAC_AUDIT_ACTUALS.grossAssetsCOP >= grossAssetsThresholdCOP

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Executive KPI Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Indicadores ejecutivos">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ventas Acumuladas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(REPORT_KPI_SUMMARY.accumulatedSalesCOP)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              +{REPORT_KPI_SUMMARY.salesGrowthPercent}% vs presupuesto
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Margen Bruto Fabril
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{REPORT_KPI_SUMMARY.grossMarginPercent}%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Margen industrial vela y velón</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rotación Parafina
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{REPORT_KPI_SUMMARY.paraffinRotationDays} días</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Stock de seguridad {REPORT_KPI_SUMMARY.safetyStockDays} días
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Merma Térmica Pailas
            </CardTitle>
            <Flame className="h-4 w-4 text-purple-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">{REPORT_KPI_SUMMARY.thermalWastePercent}%</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              En tolerancia óptima (&lt;{REPORT_KPI_SUMMARY.thermalWasteTolerancePercent.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flujo Operativo Neto
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(REPORT_KPI_SUMMARY.netOperatingFlowCOP)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Caja neta disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Global Export Feedback Banner */}
      {lastExportFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              Reporte <strong>{lastExportFeedback.reportCode}</strong> generado en formato{' '}
              <strong>{lastExportFeedback.format}</strong> para el rango{' '}
              <strong>{lastExportFeedback.rangeLabel}</strong>.
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setLastExportFeedback(null)}
            className="h-6 w-6 p-0 text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-200"
            aria-label="Cerrar aviso de exportación"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={(v) => {
          if (isReportTab(v)) setSelectedTab(v)
        }}
        className="w-full"
      >
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="catalog" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Catálogo de Reportes ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="cost_statement" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Estado de Costos (REP-CST-09)
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Topes Legales SAS y Revisoría
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Catalog */}
        <TabsContent value="catalog" className="space-y-4 pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <label htmlFor={searchInputId} className="sr-only">
                  Buscar reportes por código, título, área o rol
                </label>
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id={searchInputId}
                  placeholder="Buscar por código, título o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <DateRangeFilter
                value={dateRange}
                onChange={setDateRange}
                label="Rango de fechas global aplicado a la exportación de reportes"
              />
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
              role="group"
              aria-label="Filtrar catálogo por área"
            >
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="h-8 text-xs px-2.5 font-medium shrink-0"
                >
                  {cat === 'ALL' ? 'Todos los Reportes' : cat}
                </Button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <Card className="border-dashed border-border/80">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  No se encontraron reportes que coincidan con el filtro aplicado.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('ALL')
                  }}
                  className="text-xs"
                >
                  Limpiar filtros de búsqueda
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const isHighlight = HIGHLIGHTED_REPORT_CODES.has(report.reportCode)
                const isGenerating = generatingReport === report.reportCode

                return (
                  <Card
                    key={report.id}
                    className={`border transition-all flex flex-col justify-between ${
                      isHighlight
                        ? 'border-foreground/30 shadow-sm bg-muted/20'
                        : 'border-border/70 hover:border-border'
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                          {report.reportCode}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {report.frequency}
                        </Badge>
                      </div>
                      <CardTitle className="mt-1">
                        <h3 className="text-sm font-semibold leading-snug text-foreground">{report.title}</h3>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 text-xs space-y-3">
                      <div className="flex flex-col gap-1 text-muted-foreground text-[11px] border-t pt-2">
                        <div>
                          Área: <span className="font-medium text-foreground">{report.category}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span>Rol: {report.authorizedRole}</span>
                          <span>Ejecución: {report.estimatedExecutionTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          {report.exportFormats.map((fmt) => (
                            <span
                              key={fmt}
                              className="px-1.5 py-0.5 bg-muted/70 text-[10px] font-mono rounded text-foreground font-medium"
                            >
                              {fmt}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2"
                            disabled={isGenerating}
                            aria-label={`Exportar ${report.reportCode} a Excel (${activeRangeLabel})`}
                            onClick={() => handleSimulateExport(report.reportCode, 'Excel')}
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mr-1" aria-hidden="true" />
                            {isGenerating ? 'Generando...' : 'Excel'}
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="h-7 text-xs px-2"
                            disabled={isGenerating}
                            aria-label={`Exportar ${report.reportCode} a PDF (${activeRangeLabel})`}
                            onClick={() => handleSimulateExport(report.reportCode, 'PDF')}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                            {isGenerating ? 'Generando...' : 'PDF'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Live Cost Statement (REP-CST-09) */}
        <TabsContent value="cost_statement" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    <h3 className="text-sm font-semibold text-foreground">
                      REP-CST-09: Estado de Costos de Producción y Ventas
                    </h3>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Liquidación fabril Decreto 2650: Materias Primas (140501) + MOD (720501) + CIF (730501) +
                    Producto en Proceso (141001) + Producto Terminado (143005) hasta Costo de Ventas (612095).
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    Rango: {activeRangeLabel}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={generatingReport === 'REP-CST-09'}
                    aria-label={`Exportar REP-CST-09 en Excel (${activeRangeLabel})`}
                    onClick={() => handleSimulateExport('REP-CST-09', 'Excel')}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Exportar Excel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={generatingReport === 'REP-CST-09'}
                    aria-label={`Exportar REP-CST-09 en PDF (${activeRangeLabel})`}
                    onClick={() => handleSimulateExport('REP-CST-09', 'PDF')}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/80 p-3 sm:p-4 bg-card">
                <CostStatementTable />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Legal Thresholds and Statutory Auditor */}
        <TabsContent value="thresholds" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>
                    <h3 className="text-sm font-semibold text-foreground">
                      Monitoreo de Topes Legales y Obligación de Revisoría Fiscal (Ley 43 de 1990)
                    </h3>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Umbrales de la sociedad SAS: Ingresos Brutos ({formatNumber(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossIncome)}{' '}
                    SMMLV) y Activos Brutos ({formatNumber(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossAssets)} SMMLV) · SMMLV
                    vigente {FISCAL_PARAMETERS.fiscalYear}:{' '}
                    <strong className="text-foreground">{formatCurrency(FISCAL_PARAMETERS.smmlvCOP)} COP</strong>
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    requiresStatutoryAudit
                      ? 'text-rose-600 border-rose-300 shrink-0'
                      : 'text-emerald-600 border-emerald-300 shrink-0'
                  }
                >
                  {requiresStatutoryAudit ? 'Con Obligación de Revisoría Externa' : 'Sin Obligación de Revisoría Externa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-semibold text-foreground">
                      Tope Ingresos Brutos ({formatNumber(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossIncome)} SMMLV):
                    </h4>
                    <span className="font-bold font-mono text-foreground">
                      {formatCurrency(grossIncomeThresholdCOP)} COP
                    </span>
                  </div>
                  <Progress
                    value={grossIncomePercent}
                    className="h-2"
                    aria-label="Porcentaje utilizado del tope legal de ingresos brutos"
                  />
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Ingresos actuales San Isaac: {formatCurrency(SAN_ISAAC_AUDIT_ACTUALS.grossIncomeCOP)}</span>
                    <span
                      className={`font-medium ${
                        grossIncomePercent >= MAX_PROGRESS_PERCENT ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {grossIncomePercent.toFixed(1)}% del tope
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-semibold text-foreground">
                      Tope Activos Brutos ({formatNumber(STATUTORY_AUDIT_THRESHOLDS_SMMLV.grossAssets)} SMMLV):
                    </h4>
                    <span className="font-bold font-mono text-foreground">
                      {formatCurrency(grossAssetsThresholdCOP)} COP
                    </span>
                  </div>
                  <Progress
                    value={grossAssetsPercent}
                    className="h-2"
                    aria-label="Porcentaje utilizado del tope legal de activos brutos"
                  />
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Activos actuales San Isaac: {formatCurrency(SAN_ISAAC_AUDIT_ACTUALS.grossAssetsCOP)}</span>
                    <span
                      className={`font-medium ${
                        grossAssetsPercent >= MAX_PROGRESS_PERCENT ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {grossAssetsPercent.toFixed(1)}% del tope
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-muted/30 border border-border/80 rounded-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Dictamen de Auditoría del Sistema:</strong> Con base en el SMMLV
                vigente {FISCAL_PARAMETERS.fiscalYear} ({formatCurrency(FISCAL_PARAMETERS.smmlvCOP)} COP), Velas,
                Velones y Cirios San Isaac SAS registra ingresos brutos de{' '}
                {formatCurrency(SAN_ISAAC_AUDIT_ACTUALS.grossIncomeCOP)} ({grossIncomePercent.toFixed(1)}% del tope de{' '}
                {formatCurrency(grossIncomeThresholdCOP)}) y activos brutos de{' '}
                {formatCurrency(SAN_ISAAC_AUDIT_ACTUALS.grossAssetsCOP)} ({grossAssetsPercent.toFixed(1)}% del tope de{' '}
                {formatCurrency(grossAssetsThresholdCOP)}).{' '}
                {requiresStatutoryAudit
                  ? `Al igualar o superar al menos uno de los topes de la Ley 43 de 1990 (Art. 13, par. 2), la sociedad queda obligada a designar Revisor Fiscal externo para el periodo gravable ${FISCAL_PARAMETERS.fiscalYear}.`
                  : `Al ubicarse ampliamente por debajo de los umbrales de la Ley 43 de 1990 (Art. 13, par. 2), no existe obligación legal de contratar Revisor Fiscal externo para el periodo gravable ${FISCAL_PARAMETERS.fiscalYear}. No obstante, el ERP mantiene la conciliación bancaria mensual, el cálculo de deterioro NIIF y la generación de medios magnéticos para garantizar máxima transparencia financiera ante entidades bancarias y la DIAN.`}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
