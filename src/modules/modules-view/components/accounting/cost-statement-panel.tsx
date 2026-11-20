'use client'

import { useId, useState } from 'react'
import { FileSpreadsheet, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DateRangeFilter,
  getCurrentMonthRange,
  type DateRange,
} from '@/components/ui/date-range-filter'
import { FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import { CostStatementTable } from '@/modules/modules-view/components/shared/cost-statement-table'
import { exportCostStatementExcel, getCostStatementForPeriod } from './accounting-helpers'
import type { CostStatementPeriod } from './types'

const COST_PERIOD_OPTIONS: readonly CostStatementPeriod[] = [
  'Mensual',
  'Trimestral',
  'Anual',
  'Rango de fechas',
] as const

export function CostStatementPanel() {
  const periodSelectId = useId()
  const [period, setPeriod] = useState<CostStatementPeriod>('Trimestral')
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const current = getCurrentMonthRange()
    const fiscalStart = `${FISCAL_PARAMETERS.fiscalYear}-01-01`
    return { from: fiscalStart, to: current.to >= fiscalStart ? current.to : `${FISCAL_PARAMETERS.fiscalYear}-12-31` }
  })

  const { values, badgeLabel } = getCostStatementForPeriod(period, dateRange)

  const handleExportExcel = () => {
    const fileName = exportCostStatementExcel(values, badgeLabel)
    toast.success(`Estado de Costos exportado a Excel (${fileName}) con las 13 líneas.`)
  }

  const handleExportPdf = () => {
    toast.info('Abriendo diálogo de impresión / exportación PDF del Estado de Costos...')
    window.print()
  }

  return (
    <section aria-label="Estado de Costos de Producción y Ventas" className="flex flex-col gap-4">
      <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
        <strong>Estado de Costos de Producción y Ventas (Numerales 8 y 14):</strong> Consolida matemáticamente el inventario inicial/final de materias primas (140501), compras, mano de obra directa (720501), costos indirectos (730501), inventarios en proceso (141001) y producto terminado (143005) para fijar el Costo de Ventas en la cuenta 612095.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={periodSelectId} className="text-xs font-semibold text-foreground">
              Periodo:
            </label>
            <select
              id={periodSelectId}
              value={period}
              onChange={(e) => setPeriod(e.target.value as CostStatementPeriod)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {COST_PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {period === 'Rango de fechas' && (
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              label="Rango de fechas para Estado de Costos"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-8 gap-1.5 text-xs"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-600" aria-hidden="true" />
            Exportar Excel (.xlsx)
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleExportPdf}
            className="h-8 gap-1.5 text-xs"
          >
            <Printer className="size-3.5 text-primary" aria-hidden="true" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-xs">
        <h3 className="text-sm font-bold text-foreground border-b pb-2 mb-3 flex flex-wrap items-center justify-between gap-2">
          <span>Informe de Costos de Producción y Ventas — {period}</span>
          <Badge variant="outline">{badgeLabel}</Badge>
        </h3>

        <CostStatementTable values={values} />
      </div>
    </section>
  )
}
