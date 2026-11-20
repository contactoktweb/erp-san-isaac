'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/config'
import {
  COST_CENTER_ACCOUNTS,
  COST_CENTER_ORDER,
  type PayrollComputedSummary,
} from './payroll-calculations'

interface PayrollAccountingTabProps {
  summary: PayrollComputedSummary
}

export function PayrollAccountingTab({ summary }: PayrollAccountingTabProps) {
  const block1Diff = Math.abs(summary.block1DebitTotalCOP - summary.block1CreditTotalCOP)
  const block2Diff = Math.abs(summary.block2DebitTotalCOP - summary.block2CreditTotalCOP)
  const hasNonExemptEmployerPila =
    summary.employerNonExemptHealthCOP > 0 || summary.employerNonExemptParafiscalCOP > 0

  return (
    <div className="space-y-4">
      {/* BLOQUE 1: CAUSACIÓN DE SALARIOS, DEVENGADOS Y DEDUCCIONES */}
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                <h3 className="text-sm font-semibold">
                  Comprobante de Causación Automática de Nómina en Contabilidad
                </h3>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Mapeo CC → Cuenta PUC: CC-100 → 720501 MOD · CC-300 → 730501 CIF · CC-200 → 510506
                Admin · CC-400 → 520506 Ventas ·{' '}
                <span className="font-medium text-foreground">{summary.period.label}</span>
              </CardDescription>
            </div>
            <BalanceBadge
              isBalanced={summary.isBlock1Balanced}
              diffCOP={block1Diff}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Código PUC
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Nombre de la Cuenta
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Centro de Costo
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Débito (COP)
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Crédito (COP)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs font-mono">
                {COST_CENTER_ORDER.map((code) => {
                  const mapping = COST_CENTER_ACCOUNTS[code]
                  const ccTotals = summary.byCostCenter[code]
                  return (
                    <tr key={code}>
                      <td className="px-4 py-2 text-foreground font-semibold">
                        {mapping.salaryPucCode}
                      </td>
                      <td className="px-4 py-2 font-sans">{mapping.salaryPucName}</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">
                        {mapping.shortLabel} ({ccTotals.workerCount} trab.)
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {formatCurrency(ccTotals.grossCOP)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                  )
                })}

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">237005</td>
                  <td className="px-4 py-2 font-sans">
                    Aportes a Entidades Promotoras de Salud EPS (4% empleado)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Corriente</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.totalEmployeeSaludCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">238030</td>
                  <td className="px-4 py-2 font-sans">
                    Fondos de Cesantías y Pensiones AFP (4% empleado)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Corriente</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.totalEmployeePensionCOP)}
                  </td>
                </tr>

                {summary.totalEmployeeDiscountsCOP > 0 && (
                  <tr className="bg-muted/20">
                    <td className="px-4 py-2 text-foreground font-semibold">136595</td>
                    <td className="px-4 py-2 font-sans">
                      Cuentas por Cobrar a Trabajadores (Préstamos y Descuentos)
                    </td>
                    <td className="px-4 py-2 font-sans text-muted-foreground">
                      Deducciones Nómina
                    </td>
                    <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    <td className="px-4 py-2 text-right font-bold text-foreground">
                      {formatCurrency(summary.totalEmployeeDiscountsCOP)}
                    </td>
                  </tr>
                )}

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">250501</td>
                  <td className="px-4 py-2 font-sans">Salarios por Pagar a Trabajadores</td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Nómina</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-indigo-600">
                    {formatCurrency(summary.totalNetSalariesPayableCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/60 font-bold border-t-2 border-border">
                  <td colSpan={3} className="px-4 py-2.5 font-sans uppercase text-right">
                    Totales Comprobante de Causación Nómina:
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">
                    {formatCurrency(summary.block1DebitTotalCOP)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">
                    {formatCurrency(summary.block1CreditTotalCOP)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 2: CAUSACIÓN DE APORTES PATRONALES PILA Y PROVISIONES SOCIALES */}
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>
                <h3 className="text-sm font-semibold">
                  Causación de Aportes Patronales PILA y Provisiones de Prestaciones Sociales
                </h3>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Pensión 12%, Caja 4%, ARL ponderada (~1,72%) · Cesantías 8,33%, Intereses 1%, Prima
                8,33%, Vacaciones 4,17% → 7205/7305/5105/5205 contra 2370/2380/2610
              </CardDescription>
            </div>
            <BalanceBadge
              isBalanced={summary.isBlock2Balanced}
              diffCOP={block2Diff}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          {/* Sub-tarjetas resumen del bloque */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Aportes Patronales PILA
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                {formatCurrency(summary.totalEmployerPilaCOP)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Pensión 12% + Caja 4% + ARL pond. 1,72%
                {hasNonExemptEmployerPila ? ' + No exentos 114-1' : ''}
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Provisiones Prestaciones Sociales
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                {formatCurrency(summary.totalProvisionsCOP)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Cesantías 8,33% · Int. 1% · Prima 8,33% · Vac. 4,17%
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Validación Partida Doble
              </div>
              <div className="mt-1 text-base font-bold text-emerald-600">
                Diferencia: {formatCurrency(block2Diff)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Base IBC: {summary.ibcMode === '30d' ? '30 días estándar' : 'Días reales laborados'}
              </div>
            </div>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Código PUC
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Cuenta Contable
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Centro de Costo / Naturaleza
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Débito (COP)
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Crédito (COP)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs font-mono">
                {/* Débitos: Distribución a 7205 / 7305 / 5105 / 5205 */}
                {COST_CENTER_ORDER.map((code) => {
                  const mapping = COST_CENTER_ACCOUNTS[code]
                  const ccTotals = summary.byCostCenter[code]
                  return (
                    <tr key={`${code}-pila`}>
                      <td className="px-4 py-2 text-foreground font-semibold">
                        {mapping.pilaPucCode}
                      </td>
                      <td className="px-4 py-2 font-sans">{mapping.pilaPucName}</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">
                        {mapping.shortLabel}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {formatCurrency(ccTotals.employerPilaTotalCOP)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                  )
                })}

                {COST_CENTER_ORDER.map((code) => {
                  const mapping = COST_CENTER_ACCOUNTS[code]
                  const ccTotals = summary.byCostCenter[code]
                  return (
                    <tr key={`${code}-prov`}>
                      <td className="px-4 py-2 text-foreground font-semibold">
                        {mapping.provisionPucCode}
                      </td>
                      <td className="px-4 py-2 font-sans">{mapping.provisionPucName}</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">
                        {mapping.shortLabel}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {formatCurrency(ccTotals.provisionsTotalCOP)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                  )
                })}

                {/* Créditos: Pasivos PILA 2370 / 2380 */}
                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">238030</td>
                  <td className="px-4 py-2 font-sans">
                    Fondos de Pensiones AFP — Aporte Patronal (12%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo PILA</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.employerPensionCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">237010</td>
                  <td className="px-4 py-2 font-sans">
                    Aportes Caja de Compensación Familiar (4%)
                    {summary.employerNonExemptParafiscalCOP > 0
                      ? ' + SENA/ICBF no exento (5%)'
                      : ''}
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo PILA</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(
                      summary.employerCajaCOP + summary.employerNonExemptParafiscalCOP,
                    )}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">237006</td>
                  <td className="px-4 py-2 font-sans">
                    Aportes Administradora de Riesgos Laborales ARL (Ponderada ~1,72%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo PILA</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.employerArlCOP)}
                  </td>
                </tr>

                {summary.employerNonExemptHealthCOP > 0 && (
                  <tr className="bg-muted/20">
                    <td className="px-4 py-2 text-foreground font-semibold">237005</td>
                    <td className="px-4 py-2 font-sans">
                      Aportes Salud Patronal EPS (8,5% salarios ≥ 10 SMMLV)
                    </td>
                    <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo PILA</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    <td className="px-4 py-2 text-right font-bold text-foreground">
                      {formatCurrency(summary.employerNonExemptHealthCOP)}
                    </td>
                  </tr>
                )}

                {/* Créditos: Provisiones Prestaciones Sociales 2610 */}
                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">261005</td>
                  <td className="px-4 py-2 font-sans">
                    Provisión Para Obligaciones Laborales — Cesantías (8,33%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Provisión Social</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.provisionCesantiasCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">261010</td>
                  <td className="px-4 py-2 font-sans">
                    Provisión Intereses sobre Cesantías (1%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Provisión Social</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.provisionInteresesCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">261020</td>
                  <td className="px-4 py-2 font-sans">
                    Provisión Prima de Servicios (8,33%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Provisión Social</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.provisionPrimaCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/20">
                  <td className="px-4 py-2 text-foreground font-semibold">261015</td>
                  <td className="px-4 py-2 font-sans">
                    Provisión Vacaciones Consolidadas (4,17%)
                  </td>
                  <td className="px-4 py-2 font-sans text-muted-foreground">Provisión Social</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                  <td className="px-4 py-2 text-right font-bold text-foreground">
                    {formatCurrency(summary.provisionVacacionesCOP)}
                  </td>
                </tr>

                <tr className="bg-muted/60 font-bold border-t-2 border-border">
                  <td colSpan={3} className="px-4 py-2.5 font-sans uppercase text-right">
                    Totales Aportes Patronales y Provisiones Sociales:
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">
                    {formatCurrency(summary.block2DebitTotalCOP)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">
                    {formatCurrency(summary.block2CreditTotalCOP)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nota contable: Cesantías (8,33%), Intereses (1%) y Prima de Servicios (8,33%) se
            provisionan sobre salario + novedades salariales + auxilio de transporte; Vacaciones
            (4,17%) sobre salario básico (Art. 192 C.S.T.); Aportes PILA patronales sobre el IBC
            configurado en la pestaña Seguridad Social.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function BalanceBadge({ isBalanced, diffCOP }: { isBalanced: boolean; diffCOP: number }) {
  if (isBalanced) {
    return (
      <Badge variant="success" className="text-xs gap-1">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Sumas Iguales Cuadradas
      </Badge>
    )
  }

  return (
    <Badge variant="danger" className="text-xs gap-1">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      Descuadre ({formatCurrency(diffCOP)})
    </Badge>
  )
}
