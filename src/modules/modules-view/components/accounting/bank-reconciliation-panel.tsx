'use client'

import { useId, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Landmark,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { formatCurrency } from '@/lib/config'
import { BANK_ACCOUNTS_CONFIG, INITIAL_BANK_RECON_BY_ACCOUNT } from './accounting-data'
import {
  downloadBankStatementTemplate,
  parseBankStatementWorkbook,
} from './accounting-helpers'
import type { BankAccountId, BankReconciliationRow } from './types'

const BANK_ACCOUNT_ORDER: readonly BankAccountId[] = [
  'bancolombia-111005',
  'nequi',
  'daviplata',
] as const

export function BankReconciliationPanel() {
  const accountSelectId = useId()
  const [selectedAccountId, setSelectedAccountId] = useState<BankAccountId>('bancolombia-111005')
  const [rowsByAccount, setRowsByAccount] = useState<Record<BankAccountId, BankReconciliationRow[]>>(
    INITIAL_BANK_RECON_BY_ACCOUNT
  )

  const accountConfig = BANK_ACCOUNTS_CONFIG[selectedAccountId]
  const currentRows = rowsByAccount[selectedAccountId]

  // Saldo en Libros parte del saldo contable base + partidas causadas posteriormente
  const bookBalanceCOP =
    accountConfig.initialBookBalanceCOP +
    currentRows.reduce(
      (sum, row) => (row.source === 'imported' ? sum + row.bookAmountCOP : sum),
      0
    ) +
    currentRows.reduce((sum, row) => {
      if (row.source !== 'demo') return sum
      const initialRow = INITIAL_BANK_RECON_BY_ACCOUNT[selectedAccountId].find((r) => r.id === row.id)
      const delta = row.bookAmountCOP - (initialRow?.bookAmountCOP ?? 0)
      return sum + delta
    }, 0)

  // Diferencia neta de partidas aún sin conciliar entre extracto y libros
  const netUnreconciledDeltaCOP = currentRows.reduce(
    (sum, row) => sum + (row.bankAmountCOP - row.bookAmountCOP),
    0
  )
  const bankStatementBalanceCOP = bookBalanceCOP + netUnreconciledDeltaCOP
  const differenceToReconcileCOP = bankStatementBalanceCOP - bookBalanceCOP

  const handleImportExtract = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const result = parseBankStatementWorkbook(buffer, accountConfig, currentRows)

      setRowsByAccount((prev) => ({
        ...prev,
        [selectedAccountId]: [...result.importedRows, ...prev[selectedAccountId]],
      }))

      toast.success(
        `Extracto "${file.name}" importado: ${result.importedRows.length} filas (${result.reconciledCount} conciliadas, ${result.pendingCount} por causar, ${result.diffCount} con diferencia).`
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No fue posible procesar el extracto bancario.'
      toast.error(message)
    }
  }

  const handleCausePendingItem = (rowId: string) => {
    const nextVoucherNumber = `CE-2026-${String(100 + currentRows.length).padStart(3, '0')}`
    setRowsByAccount((prev) => ({
      ...prev,
      [selectedAccountId]: prev[selectedAccountId].map((row) =>
        row.id === rowId
          ? {
              ...row,
              voucher: row.voucher === 'Pendiente' || row.voucher === 'Sin soporte' ? nextVoucherNumber : row.voucher,
              bookAmountCOP: row.bankAmountCOP,
              status: 'Conciliada',
            }
          : row
      ),
    }))
    toast.success(`Movimiento causado en libros (${nextVoucherNumber}) y conciliado.`)
  }

  const handleDownloadTemplate = () => {
    const fileName = downloadBankStatementTemplate(accountConfig)
    toast.info(`Plantilla de extracto generada (${fileName}) lista para importar.`)
  }

  return (
    <section aria-label="Conciliación Bancaria por Extractos" className="flex flex-col gap-4">
      <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
        <strong>Conciliación Bancaria Automatizada (Numeral 15):</strong> Cruce entre extracto bancario (.XLSX / .CSV) y auxiliares contables de Bancolombia, Nequi o Daviplata. Semáforo condicional: 🟢 Partida Conciliada (coincide referencia y valor), 🟡 Pendiente por Causar (GMF / comisiones), 🔴 Diferencia por Revisar.
      </div>

      {/* Barra de cuenta bancaria e importación */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={accountSelectId} className="text-xs font-semibold text-foreground">
            Cuenta Bancaria:
          </label>
          <select
            id={accountSelectId}
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value as BankAccountId)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {BANK_ACCOUNT_ORDER.map((id) => (
              <option key={id} value={id}>
                {BANK_ACCOUNTS_CONFIG[id].label}
              </option>
            ))}
          </select>
          <Badge variant="outline" className="font-mono text-[0.6875rem]">
            PUC {accountConfig.pucCode}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleDownloadTemplate}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Plantilla Extracto (.XLSX)
          </Button>
          <FileUploadButton
            accept=".xlsx,.xls,.csv"
            onFileSelected={handleImportExtract}
            onError={(msg) => toast.error(msg)}
            variant="default"
          >
            + Importar Extracto Bancario (.XLSX / .CSV)
          </FileUploadButton>
        </div>
      </div>

      {/* Tres tarjetas de saldos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Saldo Extracto</div>
            <div className="text-sm font-bold font-mono text-foreground">
              {formatCurrency(bankStatementBalanceCOP)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="size-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Saldo en Libros</div>
            <div className="text-sm font-bold font-mono text-foreground">
              {formatCurrency(bookBalanceCOP)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
          <div>
            <div className="text-xs font-medium text-muted-foreground">Diferencia por Conciliar</div>
            <div
              className={`text-sm font-bold font-mono ${
                differenceToReconcileCOP === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(differenceToReconcileCOP)}
            </div>
          </div>
          {differenceToReconcileCOP === 0 ? (
            <Badge variant="success" className="text-[0.6875rem]">
              Cuadrada
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[0.6875rem]">
              Pendiente
            </Badge>
          )}
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Cruce de Partidas — {accountConfig.label} ({currentRows.length} movimientos)
      </h3>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">Fecha</th>
              <th scope="col" className="px-3 py-2.5">Descripción en Extracto</th>
              <th scope="col" className="px-3 py-2.5">Referencia / Comprobante</th>
              <th scope="col" className="px-3 py-2.5 text-right">Valor Extracto ($)</th>
              <th scope="col" className="px-3 py-2.5 text-right">Valor en Libros ($)</th>
              <th scope="col" className="px-3 py-2.5 text-center">Semáforo de Conciliación</th>
              <th scope="col" className="px-3 py-2.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {currentRows.map((item) => (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                  {item.date}
                </td>
                <td className="px-3 py-2.5 font-semibold text-foreground">
                  <span>{item.description}</span>
                  {item.source === 'imported' && (
                    <Badge variant="info" className="ml-2 text-[0.625rem]">
                      Importado
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.voucher}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                  {formatCurrency(item.bankAmountCOP)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                  {formatCurrency(item.bookAmountCOP)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {item.status === 'Conciliada' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3" aria-hidden="true" /> 🟢 Partida Conciliada
                    </span>
                  ) : item.status === 'Pendiente causar' ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="size-3" aria-hidden="true" /> 🟡 Pendiente Causar en Libros
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="size-3" aria-hidden="true" /> 🔴 Diferencia por Revisar
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {item.status === 'Pendiente causar' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCausePendingItem(item.id)}
                      className="h-7 text-xs"
                    >
                      Causar en Libros
                    </Button>
                  )}
                  {item.status === 'Diferencia por revisar' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleCausePendingItem(item.id)}
                      className="h-7 text-xs"
                    >
                      Conciliar Partida
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
