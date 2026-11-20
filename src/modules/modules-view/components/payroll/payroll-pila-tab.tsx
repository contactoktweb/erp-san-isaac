'use client'

import { Download, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/config'
import { ART_114_1_SMMLV_LIMIT, FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import {
  PAYROLL_RATES,
  buildPilaFlatFileContent,
  type IbcMode,
  type PayrollComputedSummary,
} from './payroll-calculations'

interface PayrollPilaTabProps {
  summary: PayrollComputedSummary
  ibcMode: IbcMode
  onIbcModeChange: (mode: IbcMode) => void
  realDaysByWorkerId: Record<string, number>
  onRealDaysChange: (workerId: string, days: number) => void
}

export function PayrollPilaTab({
  summary,
  ibcMode,
  onIbcModeChange,
  realDaysByWorkerId,
  onRealDaysChange,
}: PayrollPilaTabProps) {
  const hasNonExemptWorkers = summary.nonExemptPilaIbcCOP > 0
  const healthEmployerRateLabel = hasNonExemptWorkers ? '8.5% (parcial)' : '0.0% (Exento)'
  const parafiscalEmployerRateLabel = hasNonExemptWorkers ? '5.0% (parcial)' : '0.0% (Exento)'

  function handleExportPilaFile() {
    const content = buildPilaFlatFileContent(summary)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const filename = `PILA_SanIsaac_${summary.period.id}_${ibcMode}.txt`

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    toast.success(
      `Archivo plano PILA ${filename} exportado (${summary.workersComputed.length} cotizantes).`,
    )
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              <h3 className="text-sm font-semibold">
                Consolidado de Seguridad Social Patronal (PILA)
              </h3>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Liquidación de aportes del empleador aplicando beneficio del Art. 114-1 E.T. ·{' '}
              <span className="font-medium text-foreground">{summary.period.label}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
              Beneficio Tributario Ley 1819 Activo
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportPilaFile}
              className="h-8 text-xs gap-1.5"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Exportar Archivo Plano PILA / Resumen Seguridad Social
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Configuración de Base IBC: 30 días vs Días reales laborados */}
        <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-foreground">
              Configuración de Ingreso Base de Cotización (IBC)
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define si la liquidación PILA toma mes estándar de {PAYROLL_RATES.DAYS_IN_STANDARD_MONTH}{' '}
              días o los días reales laborados por trabajador.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Configuración de Base IBC"
            className="inline-flex rounded-lg border border-border bg-background p-1 gap-1 self-start sm:self-auto"
          >
            <Button
              type="button"
              role="radio"
              aria-checked={ibcMode === '30d'}
              size="xs"
              variant={ibcMode === '30d' ? 'default' : 'ghost'}
              onClick={() => onIbcModeChange('30d')}
              className="text-xs"
            >
              30 días estándar
            </Button>
            <Button
              type="button"
              role="radio"
              aria-checked={ibcMode === 'real_days'}
              size="xs"
              variant={ibcMode === 'real_days' ? 'default' : 'ghost'}
              onClick={() => onIbcModeChange('real_days')}
              className="text-xs"
            >
              Días reales laborados
            </Button>
          </div>
        </div>

        {/* Tabla editable por trabajador cuando se selecciona 'Días reales laborados' */}
        {ibcMode === 'real_days' && (
          <div className="rounded-lg border border-border/80 bg-card overflow-x-auto">
            <div className="border-b bg-muted/40 px-4 py-2 flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Ajuste de Días Reales Laborados para Base IBC
              </span>
              <span className="text-[11px] text-muted-foreground">
                Rango permitido: 1 a {PAYROLL_RATES.DAYS_IN_STANDARD_MONTH} días
              </span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2">
                    Trabajador
                  </th>
                  <th scope="col" className="px-4 py-2">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    IBC Base Periodo
                  </th>
                  <th scope="col" className="px-4 py-2 text-center">
                    Días Laborados
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    IBC Proporcional PILA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.workersComputed.map((item) => {
                  const inputId = `ibc-days-${item.worker.id}`
                  const daysValue = realDaysByWorkerId[item.worker.id] ?? item.pilaDays
                  return (
                    <tr key={item.worker.id}>
                      <td className="px-4 py-2">
                        <div className="font-medium text-foreground">{item.worker.fullName}</div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {item.worker.employeeCode} · {item.costCenterCode}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={item.worker.status === 'Activo' ? 'secondary' : 'outline'}
                          className="text-[11px]"
                        >
                          {item.worker.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(item.periodMonthlyIbcCOP)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <label htmlFor={inputId} className="sr-only">
                          Días laborados de {item.worker.fullName}
                        </label>
                        <Input
                          id={inputId}
                          type="number"
                          min={1}
                          max={PAYROLL_RATES.DAYS_IN_STANDARD_MONTH}
                          value={daysValue}
                          onChange={(e) => {
                            const parsed = Number(e.target.value)
                            if (Number.isFinite(parsed)) {
                              onRealDaysChange(
                                item.worker.id,
                                Math.min(
                                  PAYROLL_RATES.DAYS_IN_STANDARD_MONTH,
                                  Math.max(1, Math.round(parsed)),
                                ),
                              )
                            }
                          }}
                          className="mx-auto h-7 w-16 text-center text-xs font-mono"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(item.pilaIbcCOP)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Nota legal Art. 114-1 E.T. */}
        <div className="p-3 bg-muted/30 border border-border/80 rounded-lg flex items-start gap-3">
          <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="font-semibold text-foreground text-sm">
              Exoneración de Aportes Parafiscales y Salud (Art. 114-1 E.T.)
            </div>
            <p className="text-muted-foreground mt-1">
              Como sociedad contribuyente declarante de Renta, Velas San Isaac SAS está exonerada de
              realizar aportes patronales al SENA (2%), ICBF (3%) y Salud Empleador (8.5%) por todos
              los trabajadores que devenguen menos de {ART_114_1_SMMLV_LIMIT} SMMLV (
              {formatCurrency(summary.art114ThresholdCOP)} con SMMLV {FISCAL_PARAMETERS.fiscalYear}{' '}
              de {formatCurrency(FISCAL_PARAMETERS.smmlvCOP)}). Solo se realiza aporte a Caja de
              Compensación (4%), Pensión Empleador (12%) y ARL según clase de riesgo.
            </p>
          </div>
        </div>

        {/* Tabla consolidada de aportes patronales PILA */}
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5">
                  Concepto PILA
                </th>
                <th scope="col" className="px-4 py-2.5 text-center">
                  Tarifa Legal
                </th>
                <th scope="col" className="px-4 py-2.5 text-center">
                  Tarifa Aplicada (San Isaac SAS)
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Base Gravable (IBC)
                </th>
                <th scope="col" className="px-4 py-2.5 text-right">
                  Aporte del Periodo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              <tr>
                <td className="px-4 py-2.5 font-medium">Pensión Patronal</td>
                <td className="px-4 py-2.5 text-center">12.0%</td>
                <td className="px-4 py-2.5 text-center font-bold">12.0%</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(summary.totalPilaIbcCOP)}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatCurrency(summary.employerPensionCOP)}
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="px-4 py-2.5 font-medium text-emerald-700 dark:text-emerald-300">
                  Salud Patronal (Art. 114-1 E.T.)
                </td>
                <td className="px-4 py-2.5 text-center line-through text-muted-foreground">8.5%</td>
                <td className="px-4 py-2.5 text-center font-bold text-emerald-600">
                  {healthEmployerRateLabel}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatCurrency(
                    hasNonExemptWorkers ? summary.nonExemptPilaIbcCOP : summary.totalPilaIbcCOP,
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                  {hasNonExemptWorkers
                    ? formatCurrency(summary.employerNonExemptHealthCOP)
                    : '$0 COP'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">
                  Caja de Compensación Familiar (Compensar)
                </td>
                <td className="px-4 py-2.5 text-center">4.0%</td>
                <td className="px-4 py-2.5 text-center font-bold">4.0%</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(summary.totalPilaIbcCOP)}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatCurrency(summary.employerCajaCOP)}
                </td>
              </tr>
              <tr className="bg-emerald-500/5">
                <td className="px-4 py-2.5 font-medium text-emerald-700 dark:text-emerald-300">
                  SENA e ICBF (Art. 114-1 E.T.)
                </td>
                <td className="px-4 py-2.5 text-center line-through text-muted-foreground">
                  5.0% (2% + 3%)
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-emerald-600">
                  {parafiscalEmployerRateLabel}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {formatCurrency(
                    hasNonExemptWorkers ? summary.nonExemptPilaIbcCOP : summary.totalPilaIbcCOP,
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                  {hasNonExemptWorkers
                    ? formatCurrency(summary.employerNonExemptParafiscalCOP)
                    : '$0 COP'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">
                  ARL Positiva (Ponderado Riesgo I, II y III)
                </td>
                <td className="px-4 py-2.5 text-center">0.522% a 2.436%</td>
                <td className="px-4 py-2.5 text-center font-bold">~1.72% prom.</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(summary.totalPilaIbcCOP)}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {formatCurrency(summary.employerArlCOP)}
                </td>
              </tr>
              <tr className="bg-muted/60 font-bold border-t-2 border-border">
                <td colSpan={4} className="px-4 py-2.5 text-right uppercase">
                  Total Aportes Patronales PILA a Causar:
                </td>
                <td className="px-4 py-2.5 text-right text-foreground">
                  {formatCurrency(summary.totalEmployerPilaCOP)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
