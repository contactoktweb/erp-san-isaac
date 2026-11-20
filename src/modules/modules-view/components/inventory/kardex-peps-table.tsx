'use client'

import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Filter, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { InventoryItem } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'
import type { KardexEntry } from './inventory-constants'

interface KardexPepsTableProps {
  entries: KardexEntry[]
  items: InventoryItem[]
  searchQuery: string
  valuationMethod: 'PEPS' | 'Promedio Ponderado'
}

export function KardexPepsTable({
  entries,
  items,
  searchQuery,
  valuationMethod,
}: KardexPepsTableProps) {
  const [selectedSku, setSelectedSku] = useState<string>('ALL')

  const skuOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      map.set(item.sku, item.name)
    }
    for (const entry of entries) {
      if (!map.has(entry.sku)) {
        map.set(entry.sku, entry.itemName)
      }
    }
    return Array.from(map.entries()).map(([sku, name]) => ({ sku, name }))
  }, [items, entries])

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return entries.filter((entry) => {
      if (selectedSku !== 'ALL' && entry.sku !== selectedSku) return false
      if (!q) return true
      return (
        entry.sku.toLowerCase().includes(q) ||
        entry.itemName.toLowerCase().includes(q) ||
        entry.warehouseLocation.toLowerCase().includes(q) ||
        entry.documentNumber.toLowerCase().includes(q) ||
        entry.batchNumber.toLowerCase().includes(q) ||
        entry.concept.toLowerCase().includes(q) ||
        entry.pucAccount.toLowerCase().includes(q)
      )
    })
  }, [entries, selectedSku, searchQuery])

  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, entry) => ({
        entriesCOP: acc.entriesCOP + (entry.entryTotalCost ?? 0),
        exitsCOP: acc.exitsCOP + (entry.exitTotalCost ?? 0),
      }),
      { entriesCOP: 0, exitsCOP: 0 }
    )
  }, [filteredEntries])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Kardex Valorizado PEPS (Entradas, Salidas y Saldos)
            </h3>
            <Badge variant={valuationMethod === 'PEPS' ? 'info' : 'warning'} className="text-[0.6875rem]">
              Método Activo: {valuationMethod === 'PEPS' ? 'PEPS (FIFO)' : 'Promedio Ponderado'}
            </Badge>
          </div>
          <p className="text-[0.6875rem] text-muted-foreground">
            {valuationMethod === 'PEPS'
              ? 'Control por capas de costo y trazabilidad de lote: cada salida descarga primero la existencia más antigua.'
              : 'Referencia Promedio Ponderado activa en barra superior. Se conserva trazabilidad PEPS por lote y documento.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="kardex-sku-filter"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            <Filter className="size-3.5" aria-hidden="true" />
            Artículo:
          </label>
          <select
            id="kardex-sku-filter"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            className="h-8 max-w-64 rounded-md border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">Todos los artículos ({entries.length} mov.)</option>
            {skuOptions.map((opt) => (
              <option key={opt.sku} value={opt.sku}>
                {opt.sku} — {opt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas resumen del Kardex filtrado */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border bg-background px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDownLeft className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Total Entradas (Filtro)</span>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatCurrency(totals.entriesCOP)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-background px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowUpRight className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>Total Salidas (Filtro)</span>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-rose-700 dark:text-rose-400">
            {formatCurrency(totals.exitsCOP)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-background px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="size-4 text-primary" aria-hidden="true" />
            <span>Movimientos Visualizados</span>
          </div>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {filteredEntries.length} registros
          </span>
        </div>
      </div>

      {/* Tabla Kardex PEPS */}
      <div className="overflow-x-auto rounded-lg border border-border/70">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">Fecha</th>
              <th scope="col" className="px-3 py-2.5">Documento</th>
              <th scope="col" className="px-3 py-2.5">Artículo / PUC</th>
              <th scope="col" className="px-3 py-2.5">Concepto</th>
              <th scope="col" className="px-3 py-2.5">Lote</th>
              <th scope="col" className="px-3 py-2.5 text-right">Entrada (Cant. / Costo)</th>
              <th scope="col" className="px-3 py-2.5 text-right">Salida (Cant. / Costo)</th>
              <th scope="col" className="px-3 py-2.5 text-right">Saldo (Cant. / Valorizado)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No se encontraron movimientos en el Kardex PEPS para el filtro actual.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const avgUnitSaldo =
                  entry.balanceQty > 0 ? Math.round(entry.balanceTotalCost / entry.balanceQty) : 0

                return (
                  <tr key={entry.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[0.6875rem] text-muted-foreground">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono font-semibold text-foreground">
                      {entry.documentNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">{entry.itemName}</div>
                      <div className="font-mono text-[0.625rem] text-muted-foreground">
                        {entry.sku} &bull; {entry.pucAccount}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <div className="font-medium text-foreground">{entry.concept}</div>
                      <div className="text-[0.625rem] text-muted-foreground">{entry.warehouseLocation}</div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[0.6875rem] font-semibold text-foreground">
                      {entry.batchNumber}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {entry.entryQty !== null && entry.entryTotalCost !== null ? (
                        <div>
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            +{formatNumber(entry.entryQty)}
                          </div>
                          <div className="text-[0.625rem] text-muted-foreground">
                            {formatCurrency(entry.entryTotalCost)}
                            {entry.entryUnitCost !== null ? ` (${formatCurrency(entry.entryUnitCost)}/u)` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      {entry.exitQty !== null && entry.exitTotalCost !== null ? (
                        <div>
                          <div className="font-bold text-rose-700 dark:text-rose-400">
                            -{formatNumber(entry.exitQty)}
                          </div>
                          <div className="text-[0.625rem] text-muted-foreground">
                            {formatCurrency(entry.exitTotalCost)}
                            {entry.exitUnitCost !== null ? ` (${formatCurrency(entry.exitUnitCost)}/u)` : ''}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                      <div className="font-bold text-foreground">{formatNumber(entry.balanceQty)}</div>
                      <div className="text-[0.6875rem] font-semibold text-primary">
                        {formatCurrency(entry.balanceTotalCost)}
                      </div>
                      <div className="text-[0.625rem] text-muted-foreground">
                        Costo u: {formatCurrency(avgUnitSaldo)}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
