'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  DollarSign,
  Layers,
  Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InventoryItem } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

interface Props {
  items: InventoryItem[]
}

export function InventoryComplexView({ items }: Props) {
  const [selectedValuationMethod, setSelectedValuationMethod] = useState<'PEPS' | 'Promedio Ponderado'>('PEPS')
  const [selectedMovementConcept, setSelectedMovementConcept] = useState<string>('Ajustes')

  // Cálculos de resumen
  const totalBaseUnits = items.reduce((acc, it) => acc + it.currentStock, 0)
  const wipCount = items.filter((it) => it.category === 'Producto en proceso').length
  const criticalStockCount = items.filter((it) => it.currentStock <= it.minimumStock).length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Barra de Controles Paramétricos del Numeral 4 y 5 */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border bg-muted/20 p-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Selector 1: Método de Valoración Activo (Numeral 4) */}
        <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Scale className="size-3.5 text-muted-foreground" />
            Método de Valoración Activo:
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedValuationMethod('PEPS')}
              className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                selectedValuationMethod === 'PEPS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              PEPS (FIFO)
            </button>
            <button
              type="button"
              onClick={() => setSelectedValuationMethod('Promedio Ponderado')}
              className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${
                selectedValuationMethod === 'Promedio Ponderado'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Prom. Ponderado
            </button>
          </div>
          <span className="text-[0.625rem] text-muted-foreground">Unificado con Kardex y REP-INV-02</span>
        </div>

        {/* Selector 2: Concepto Contable del Movimiento (Numeral 5) */}
        <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-3">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <ArrowRightLeft className="size-3.5 text-muted-foreground" />
            Concepto Contable y Tributario:
          </label>
          <select
            value={selectedMovementConcept}
            onChange={(e) => setSelectedMovementConcept(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
          >
            <option value="Ajustes">1. Ajustes de inventario</option>
            <option value="Devoluciones">2. Devoluciones en compras/ventas</option>
            <option value="Pérdidas">3. Pérdidas operativas</option>
            <option value="Desperdicios">4. Desperdicios de fundición/merma</option>
            <option value="Bajas">5. Bajas de inventario</option>
            <option value="Traslados">6. Traslados entre bodegas</option>
            <option value="Costo de ventas">7. Costo de ventas (Cuenta 6120)</option>
          </select>
          <span className="text-[0.625rem] text-muted-foreground">Afecta automáticamente cuentas PUC</span>
        </div>

        {/* Métrica 3: Productos en Proceso (Cuenta 1410) */}
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Layers className="size-4" />
          </div>
          <div>
            <div className="text-[0.6875rem] font-medium text-muted-foreground">En Proceso (PUC 1410)</div>
            <div className="text-base font-bold text-foreground">{wipCount} lotes / pailas</div>
          </div>
        </div>

        {/* Métrica 4: Semáforo de Stock Mínimo */}
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-4" />
          </div>
          <div>
            <div className="text-[0.6875rem] font-medium text-muted-foreground">Stock Crítico / Reabastecer</div>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400">{criticalStockCount} referencias</div>
          </div>
        </div>
      </div>

      {/* Tabla Principal de Inventarios con Vista Dual y Semáforo */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">SKU / Artículo</th>
              <th scope="col" className="px-3 py-2.5">Categoría / Cuenta PUC</th>
              <th scope="col" className="px-3 py-2.5">Presentación Comercial</th>
              <th scope="col" className="px-3 py-2.5 text-right">Existencia (Unidad Base)</th>
              <th scope="col" className="px-3 py-2.5">Equivalencia Dual Comercial</th>
              <th scope="col" className="px-3 py-2.5 text-center">Semáforo Stock</th>
              <th scope="col" className="px-3 py-2.5">Lote / F. Prod</th>
              <th scope="col" className="px-3 py-2.5">Ubicación Bodega</th>
              <th scope="col" className="px-3 py-2.5 text-right">Costo Unitario ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((it) => {
              // Cálculo dual: cuántos empaques comerciales completos + sobrante en unidades sueltas
              const commercialPacks = Math.floor(it.currentStock / it.baseUnitEquivalent)
              const remainingLoose = it.currentStock % it.baseUnitEquivalent

              // Semáforo condicional:
              // 🔴 Crítico: <= minimumStock
              // 🟡 Próximo a Mínimo: <= minimumStock * 1.2
              // 🟢 Óptimo: > minimumStock * 1.2
              const isCritical = it.currentStock <= it.minimumStock
              const isWarning = !isCritical && it.currentStock <= it.minimumStock * 1.25

              return (
                <tr key={it.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 font-semibold text-foreground">
                    <div>{it.name}</div>
                    <div className="font-mono text-[0.6875rem] text-muted-foreground">{it.sku}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      variant={
                        it.category === 'Producto en proceso'
                          ? 'warning'
                          : it.category === 'Producto terminado'
                          ? 'info'
                          : 'outline'
                      }
                      className="text-[0.6875rem]"
                    >
                      {it.category}
                    </Badge>
                    {it.pucAccount && (
                      <div className="font-mono text-[0.625rem] text-muted-foreground mt-0.5">{it.pucAccount}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {it.commercialPresentation}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                    {formatNumber(it.currentStock)} {it.baseUnit}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground font-mono">
                    <span className="font-semibold text-foreground">
                      {commercialPacks} empaque(s)
                    </span>
                    {remainingLoose > 0 && (
                      <span className="text-[0.6875rem] text-amber-700 dark:text-amber-300 ml-1">
                        + {remainingLoose} {it.baseUnit} sueltas
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {isCritical ? (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                        <span className="size-2 rounded-full bg-rose-500 animate-pulse" />
                        🔴 Stock Crítico (Mín: {it.minimumStock})
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                        <span className="size-2 rounded-full bg-amber-500" />
                        🟡 Próximo a Mínimo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        🟢 Óptimo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-mono text-[0.6875rem] font-semibold text-foreground">{it.batchNumber}</div>
                    <div className="text-[0.625rem] text-muted-foreground">{formatDate(it.productionDate)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{it.warehouseLocation}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                    {formatCurrency(it.unitCostCOP)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
