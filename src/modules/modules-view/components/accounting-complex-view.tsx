'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  Layers,
  Lock,
  Plus,
  Scale,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DateRangeFilter,
  getCurrentMonthRange,
  isWithinRange,
  type DateRange,
} from '@/components/ui/date-range-filter'
import { Input } from '@/components/ui/input'
import type { AccountEntry } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'
import { FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import { INITIAL_VOUCHERS } from './accounting/accounting-data'
import {
  getAccountTypeBadgeVariant,
  inferPucAccountType,
} from './accounting/accounting-helpers'
import { BankReconciliationPanel } from './accounting/bank-reconciliation-panel'
import { CostStatementPanel } from './accounting/cost-statement-panel'
import { ExogenaPanel } from './accounting/exogena-panel'
import { FinancialStatementsNiif } from './accounting/financial-statements-niif'
import { PucJournalModal } from './accounting/puc-journal-modal'
import type { ExtendedAccountEntry, JournalVoucher } from './accounting/types'

interface Props {
  accounts: AccountEntry[]
}

type AccountingTab = 'puc' | 'costStatement' | 'bankReconciliation' | 'exogena'

export function AccountingComplexView({ accounts }: Props) {
  const [activeTab, setActiveTab] = useState<AccountingTab>('puc')
  const [localAccounts, setLocalAccounts] = useState<ExtendedAccountEntry[]>(
    () => accounts as ExtendedAccountEntry[]
  )
  const [vouchers, setVouchers] = useState<JournalVoucher[]>(INITIAL_VOUCHERS)
  const [isFiscalPeriodClosed, setIsFiscalPeriodClosed] = useState<boolean>(false)
  const [showNiifStatements, setShowNiifStatements] = useState<boolean>(false)
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false)

  const [pucSearchQuery, setPucSearchQuery] = useState<string>('')
  const [pucDateRange, setPucDateRange] = useState<DateRange>(() => {
    const current = getCurrentMonthRange()
    const fiscalStart = `${FISCAL_PARAMETERS.fiscalYear}-01-01`
    return {
      from: fiscalStart,
      to: current.to >= fiscalStart ? current.to : `${FISCAL_PARAMETERS.fiscalYear}-12-31`,
    }
  })

  // Totalizadores globales de partida doble
  const allDebits = useMemo(
    () => localAccounts.reduce((acc, item) => acc + item.debitCOP, 0),
    [localAccounts]
  )
  const allCredits = useMemo(
    () => localAccounts.reduce((acc, item) => acc + item.creditCOP, 0),
    [localAccounts]
  )
  const isGlobalBalanced = allDebits === allCredits && allDebits > 0

  // Cuentas filtradas por rango de fechas y buscador de cuenta/tercero
  const filteredAccounts = useMemo(() => {
    const q = pucSearchQuery.trim().toLowerCase()
    return localAccounts.filter((acc) => {
      if (!isWithinRange(acc.lastUpdated, pucDateRange)) return false
      if (!q) return true
      return (
        acc.code.toLowerCase().includes(q) ||
        acc.name.toLowerCase().includes(q) ||
        acc.accountType.toLowerCase().includes(q) ||
        acc.costCenter.toLowerCase().includes(q) ||
        (acc.thirdParty ?? '').toLowerCase().includes(q)
      )
    })
  }, [localAccounts, pucDateRange, pucSearchQuery])

  const filteredVouchers = useMemo(() => {
    const q = pucSearchQuery.trim().toLowerCase()
    return vouchers.filter((voucher) => {
      if (!isWithinRange(voucher.date, pucDateRange)) return false
      if (!q) return true
      return (
        voucher.voucherNumber.toLowerCase().includes(q) ||
        voucher.description.toLowerCase().includes(q) ||
        voucher.type.toLowerCase().includes(q) ||
        voucher.lines.some(
          (line) =>
            line.accountCode.toLowerCase().includes(q) ||
            line.accountName.toLowerCase().includes(q) ||
            line.thirdParty.toLowerCase().includes(q)
        )
      )
    })
  }, [vouchers, pucDateRange, pucSearchQuery])

  const filteredDebits = useMemo(
    () => filteredAccounts.reduce((acc, item) => acc + item.debitCOP, 0),
    [filteredAccounts]
  )
  const filteredCredits = useMemo(
    () => filteredAccounts.reduce((acc, item) => acc + item.creditCOP, 0),
    [filteredAccounts]
  )
  const isFilteredBalanced = filteredDebits === filteredCredits

  const nextVoucherNumber = `CD-${FISCAL_PARAMETERS.fiscalYear}-${String(40 + vouchers.length).padStart(3, '0')}`

  const handleTogglePeriodLock = () => {
    const nextState = !isFiscalPeriodClosed
    setIsFiscalPeriodClosed(nextState)
    toast.info(
      nextState
        ? 'Periodo contable bloqueado para proteger la integridad fiscal.'
        : 'Periodo contable abierto para registro de comprobantes.'
    )
  }

  const handleSaveVoucher = (voucher: JournalVoucher) => {
    if (voucher.totalDebitCOP <= 0 || voucher.totalDebitCOP !== voucher.totalCreditCOP) {
      toast.error('El comprobante debe tener sumas iguales (Débitos = Créditos) y mayores a $0.')
      return
    }

    setVouchers((prev) => [voucher, ...prev])

    setLocalAccounts((prevAccounts) => {
      const updated = [...prevAccounts]
      const isoDate = `${voucher.date}T12:00:00.000Z`

      for (const line of voucher.lines) {
        const idx = updated.findIndex((acc) => acc.code === line.accountCode)
        if (idx >= 0) {
          const existing = updated[idx]
          const nextDebit = existing.debitCOP + line.debitCOP
          const nextCredit = existing.creditCOP + line.creditCOP
          const existingThirdParty = existing.thirdParty ?? ''
          const nextThirdParty =
            line.thirdParty && !existingThirdParty.includes(line.thirdParty)
              ? existingThirdParty
                ? `${existingThirdParty} · ${line.thirdParty}`
                : line.thirdParty
              : existingThirdParty

          updated[idx] = {
            ...existing,
            debitCOP: nextDebit,
            creditCOP: nextCredit,
            currentBalanceCOP: nextDebit - nextCredit,
            thirdParty: nextThirdParty,
            lastUpdated: isoDate,
          }
        } else {
          updated.push({
            id: `acc-${Date.now()}-${line.accountCode}`,
            code: line.accountCode,
            name: line.accountName,
            accountType: inferPucAccountType(line.accountCode),
            thirdParty: line.thirdParty,
            debitCOP: line.debitCOP,
            creditCOP: line.creditCOP,
            currentBalanceCOP: line.debitCOP - line.creditCOP,
            costCenter: line.costCenter,
            lastUpdated: isoDate,
          })
        }
      }

      return updated.sort((a, b) => a.code.localeCompare(b.code))
    })

    setIsJournalModalOpen(false)
    toast.success(
      `Comprobante ${voucher.voucherNumber} contabilizado por ${formatCurrency(voucher.totalDebitCOP)}.`
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Selector de sub-vistas contables */}
      <nav aria-label="Submódulos de contabilidad" className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'puc' ? 'default' : 'outline'}
          onClick={() => setActiveTab('puc')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <BookOpen className="size-3.5" aria-hidden="true" />
          Plan Único de Cuentas (PUC) &amp; Partida Doble ({localAccounts.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'costStatement' ? 'default' : 'outline'}
          onClick={() => setActiveTab('costStatement')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <Layers className="size-3.5" aria-hidden="true" />
          Estado de Costos de Producción y Ventas (Tarjeta #14)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'bankReconciliation' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bankReconciliation')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <Landmark className="size-3.5" aria-hidden="true" />
          Conciliación Bancaria por Extractos (Tarjeta #15)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'exogena' ? 'default' : 'outline'}
          onClick={() => setActiveTab('exogena')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none bg-purple-600/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 border-purple-300 dark:border-purple-800"
        >
          <FileSpreadsheet className="size-3.5 text-purple-600" aria-hidden="true" />
          Prevalidador Medios Magnéticos Exógena (Tarjeta #16)
        </Button>
      </nav>

      {/* PESTAÑA 1: PUC, COMPROBANTES Y ESTADOS FINANCIEROS NIIF */}
      {activeTab === 'puc' && (
        <div className="flex flex-col gap-4">
          {/* Barra superior de filtros y acciones */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <DateRangeFilter
                value={pucDateRange}
                onChange={setPucDateRange}
                label="Rango de fechas contable PUC"
              />

              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search
                  className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Buscar cuenta PUC o tercero"
                  placeholder="Buscar cuenta, código PUC o tercero..."
                  value={pucSearchQuery}
                  onChange={(e) => setPucSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={showNiifStatements ? 'secondary' : 'outline'}
                onClick={() => setShowNiifStatements((prev) => !prev)}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <Scale className="size-3.5" aria-hidden="true" />
                {showNiifStatements ? 'Ver Catálogo PUC' : 'Estados Financieros NIIF'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsJournalModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                + Nuevo Comprobante / Asiento Diario
              </Button>
            </div>
          </div>

          {/* Banner de Partida Doble y Control de Periodo Cerrado */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Suma Débitos ({filteredAccounts.length} cuentas)
                </div>
                <div className="text-sm font-bold font-mono text-foreground">
                  {formatCurrency(filteredDebits)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="size-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">
                  Suma Créditos ({filteredAccounts.length} cuentas)
                </div>
                <div className="text-sm font-bold font-mono text-foreground">
                  {formatCurrency(filteredCredits)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Estado Partida Doble</div>
                {isGlobalBalanced && isFilteredBalanced ? (
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> 🟢 Sumas Iguales / Balanceada
                  </div>
                ) : isGlobalBalanced ? (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="size-4" aria-hidden="true" /> Filtro parcial (Global balanceado)
                  </div>
                ) : (
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="size-4" aria-hidden="true" /> 🔴 Descuadre Contable
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant={isFiscalPeriodClosed ? 'default' : 'outline'}
                onClick={handleTogglePeriodLock}
                className="text-xs gap-1 shrink-0"
              >
                <Lock className="size-3" aria-hidden="true" />
                {isFiscalPeriodClosed ? '🔒 Periodo Bloqueado' : 'Periodo Abierto'}
              </Button>
            </div>
          </div>

          {showNiifStatements ? (
            <FinancialStatementsNiif accounts={localAccounts} />
          ) : (
            <>
              <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
                <strong>Cuentas Esenciales de Manufactura Integradas (Numerales 5, 7 y 13):</strong>{' '}
                Cuentas de anticipo (135515/135595), Producto en Proceso (141001), Retenciones e impuestos (2365/2368/240802), Costo de Ventas (612095) y Costos Directos e Indirectos (7205 MOD / 7305 CIF).
              </div>

              {/* Tabla PUC */}
              <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2.5">Código PUC</th>
                      <th scope="col" className="px-3 py-2.5">Nombre de la Cuenta y Tercero</th>
                      <th scope="col" className="px-3 py-2.5">Clasificación</th>
                      <th scope="col" className="px-3 py-2.5">Centro de Costos</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Débito ($)</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Crédito ($)</th>
                      <th scope="col" className="px-3 py-2.5 text-right">Saldo Neto ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-xs text-muted-foreground">
                          No hay cuentas PUC que coincidan con el rango de fechas y búsqueda seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                            {acc.code}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-medium text-foreground">{acc.name}</div>
                            {acc.thirdParty && (
                              <div className="text-[0.6875rem] text-muted-foreground">
                                Tercero: {acc.thirdParty}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge
                              variant={getAccountTypeBadgeVariant(acc.accountType)}
                              className="text-[0.6875rem]"
                            >
                              {acc.accountType}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                            {acc.costCenter}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                            {formatCurrency(acc.debitCOP)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                            {formatCurrency(acc.creditCOP)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                            {formatCurrency(acc.currentBalanceCOP)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Comprobantes de Diario recientes */}
              <section aria-label="Comprobantes y asientos de diario" className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Comprobantes y Asientos de Diario ({filteredVouchers.length})
                  </h3>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2">Comprobante</th>
                        <th scope="col" className="px-3 py-2">Fecha</th>
                        <th scope="col" className="px-3 py-2">Tipo</th>
                        <th scope="col" className="px-3 py-2">Concepto y Líneas</th>
                        <th scope="col" className="px-3 py-2 text-right">Débitos ($)</th>
                        <th scope="col" className="px-3 py-2 text-right">Créditos ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredVouchers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                            Sin comprobantes en el rango o búsqueda seleccionada.
                          </td>
                        </tr>
                      ) : (
                        filteredVouchers.map((voucher) => (
                          <tr key={voucher.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2.5 font-mono font-bold text-primary whitespace-nowrap">
                              {voucher.voucherNumber}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                              {formatDate(`${voucher.date}T12:00:00.000Z`)}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge variant="outline" className="text-[0.6875rem]">
                                {voucher.type}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-medium text-foreground">{voucher.description}</div>
                              <div className="text-[0.6875rem] text-muted-foreground">
                                {voucher.lines.length} líneas ·{' '}
                                {voucher.lines.map((l) => l.accountCode).join(' / ')}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-medium">
                              {formatCurrency(voucher.totalDebitCOP)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-medium">
                              {formatCurrency(voucher.totalCreditCOP)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* PESTAÑA 2: ESTADO DE COSTOS DE PRODUCCIÓN Y VENTAS INTEGRADO */}
      {activeTab === 'costStatement' && <CostStatementPanel />}

      {/* PESTAÑA 3: CONCILIACIÓN BANCARIA POR EXTRACTOS */}
      {activeTab === 'bankReconciliation' && <BankReconciliationPanel />}

      {/* PESTAÑA 4: ASISTENTE DE INFORMACIÓN EXÓGENA DIAN */}
      {activeTab === 'exogena' && <ExogenaPanel />}

      {/* MODAL: NUEVO COMPROBANTE / ASIENTO DIARIO */}
      {isJournalModalOpen && (
        <PucJournalModal
          isOpen={isJournalModalOpen}
          accounts={localAccounts}
          nextVoucherNumber={nextVoucherNumber}
          isFiscalPeriodClosed={isFiscalPeriodClosed}
          onClose={() => setIsJournalModalOpen(false)}
          onSave={handleSaveVoucher}
        />
      )}
    </div>
  )
}
