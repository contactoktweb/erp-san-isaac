'use client'

import { CheckCircle2, FileSpreadsheet, Scale, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/config'
import { computeNiifStatements } from './accounting-helpers'
import type { ExtendedAccountEntry, NiifLineItem } from './types'

interface FinancialStatementsNiifProps {
  accounts: ExtendedAccountEntry[]
}

function StatementGroupRows({
  items,
  emptyLabel,
}: {
  items: NiifLineItem[]
  emptyLabel: string
}) {
  if (items.length === 0) {
    return (
      <div className="py-2 text-xs text-muted-foreground italic">{emptyLabel}</div>
    )
  }
  return (
    <>
      {items.map((item) => (
        <div key={item.code} className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <div className="min-w-0">
            <span className="font-mono font-semibold text-foreground mr-1.5">{item.code}</span>
            <span className="text-foreground">{item.name}</span>
            {item.classification.includes('Menor valor') && (
              <span className="ml-1.5 text-[0.6875rem] text-muted-foreground">
                ({item.classification})
              </span>
            )}
          </div>
          <span
            className={`shrink-0 font-mono font-medium ${
              item.amountCOP < 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
            }`}
          >
            {formatCurrency(item.amountCOP)}
          </span>
        </div>
      ))}
    </>
  )
}

export function FinancialStatementsNiif({ accounts }: FinancialStatementsNiifProps) {
  const statements = computeNiifStatements(accounts)

  return (
    <section aria-label="Estados Financieros NIIF" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
        <div>
          <strong>Estados Financieros NIIF PYMES (Grupo 2):</strong> Balance General (Estado de Situación Financiera) y Estado de Resultados Integral derivados dinámicamente de las {accounts.length} cuentas activas del PUC.
        </div>
        {statements.isBalanceSheetBalanced ? (
          <Badge variant="success" className="gap-1 text-xs">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Ecuación Patrimonial Cuadrada (A = P + Pt)
          </Badge>
        ) : (
          <Badge variant="danger" className="gap-1 text-xs">
            <AlertCircle className="size-3.5" aria-hidden="true" />
            Diferencia en Ecuación Patrimonial
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* BALANCE GENERAL / ESTADO DE SITUACIÓN FINANCIERA */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground">
                Estado de Situación Financiera (Balance General NIIF)
              </h3>
            </div>
            <Badge variant="outline" className="text-[0.6875rem]">NIIF</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-1 mb-1">
                Activos (Clase 1)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows items={statements.assets} emptyLabel="Sin cuentas de activo." />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Total Activos</span>
                <span className="font-mono text-primary">{formatCurrency(statements.totalAssetsCOP)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 border-b pb-1 mb-1">
                Pasivos (Clase 2 — incluye menor valor 240802)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows items={statements.liabilities} emptyLabel="Sin cuentas de pasivo." />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Total Pasivos</span>
                <span className="font-mono">{formatCurrency(statements.totalLiabilitiesCOP)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 border-b pb-1 mb-1">
                Patrimonio (Clase 3 + Resultado del Ejercicio)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows items={statements.equity} emptyLabel="Sin cuentas de patrimonio." />
                <div className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-foreground font-medium">
                    Resultado Neto del Ejercicio (del Estado de Resultados)
                  </span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(statements.netIncomeCOP)}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Total Patrimonio</span>
                <span className="font-mono">{formatCurrency(statements.totalEquityCOP)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary">
              <span>Total Pasivo + Patrimonio</span>
              <span className="font-mono text-sm">
                {formatCurrency(statements.totalLiabilitiesAndEquityCOP)}
              </span>
            </div>
          </div>
        </div>

        {/* ESTADO DE RESULTADOS INTEGRAL */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground">
                Estado de Resultados Integral (PyG NIIF)
              </h3>
            </div>
            <Badge variant="outline" className="text-[0.6875rem]">Acumulado 2026</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b pb-1 mb-1">
                Ingresos de Actividades Ordinarias (Clase 4)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows items={statements.revenues} emptyLabel="Sin ingresos registrados." />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Total Ingresos Operacionales</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(statements.totalRevenuesCOP)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-1 mb-1">
                (-) Costo de Ventas (Clase 6 — 612095)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows items={statements.costOfSales} emptyLabel="Sin costo de ventas." />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Utilidad Bruta sobre Costo de Ventas</span>
                <span className="font-mono">{formatCurrency(statements.grossProfitOverCostOfSalesCOP)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 border-b pb-1 mb-1">
                (-) Costos de Producción del Periodo por Absorber (Clase 7)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows
                  items={statements.productionCosts}
                  emptyLabel="Sin saldos abiertos en costos de producción."
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded bg-muted/40 px-2.5 py-2 text-xs font-bold text-foreground">
                <span>Subtotal Costos de Producción (MOD / CIF / MP)</span>
                <span className="font-mono">{formatCurrency(statements.totalProductionCostsCOP)}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 mb-1">
                (-) Gastos Operacionales de Administración y Ventas (Clase 5)
              </h4>
              <div className="divide-y divide-border/40">
                <StatementGroupRows
                  items={statements.operatingExpenses}
                  emptyLabel="Sin gastos operacionales registrados en el periodo."
                />
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span>(=) Resultado / Utilidad Neta antes de Impuestos</span>
              <span className="font-mono text-sm">{formatCurrency(statements.netIncomeCOP)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
