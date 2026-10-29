'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Factory,
  Layers,
  Percent,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ProductionOrder } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

interface Props {
  orders: ProductionOrder[]
}

export function ProductionComplexView({ orders }: Props) {
  const [activeTab, setActiveTab] = useState<'orders' | 'costSheet'>('orders')

  // Estado del simulador dinámico de precios (Panel C)
  const [targetMarginDetal, setTargetMarginDetal] = useState<number>(60)
  const [targetMarginMayoreo, setTargetMarginMayoreo] = useState<number>(35)
  const [targetMarginDistribuidor, setTargetMarginDistribuidor] = useState<number>(20)

  // Costos estándar parametrizados de la Ficha Técnica Maestra (Velón Votivo 3 Días)
  const rawMaterialsSubtotal = 2840 // COP
  const modSubtotal = 650 // COP
  const cifSubtotal = 460 // COP
  const totalUnitCost = rawMaterialsSubtotal + modSubtotal + cifSubtotal // 3.950 COP

  const minAcceptableMargin = 15 // Margen mínimo rentable

  const calculateSuggestedPrice = (margin: number) => {
    if (margin >= 100) return totalUnitCost
    return Math.round(totalUnitCost / (1 - margin / 100))
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Botones de Navegación del Módulo de Producción */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'orders' ? 'default' : 'outline'}
          onClick={() => setActiveTab('orders')}
          className="text-xs gap-1.5"
        >
          <Factory className="size-3.5" />
          Órdenes de Fabricación y Variaciones ({orders.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'costSheet' ? 'default' : 'outline'}
          onClick={() => setActiveTab('costSheet')}
          className="text-xs gap-1.5"
        >
          <Calculator className="size-3.5" />
          Hoja de Costos Paramétrica y Simulador de Precios (Ficha Maestra)
        </Button>
      </div>

      {/* PESTAÑA 1: ÓRDENES DE PRODUCCIÓN, COSTO ESTIMADO VS REAL Y ESTADO CONTABLE */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Comparativo Costo Estimado vs. Real y Estado Contable (Numerales 6, 7 y 40):</strong> Control de merma con semáforo de eficiencia (🟢 En estándar, 🟡 Variación 1-5%, 🔴 Sobrecosto &gt;5%). Estado contable dispara el traslado automático a <em>Producto en Proceso (PUC 1410)</em> y posterior habilitación del Lote terminado en <em>Bodega (PUC 1430)</em>.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">No. Orden / Ficha</th>
                  <th scope="col" className="px-3 py-2.5">Producto a Fabricar</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Prog. vs Real (uds)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Merma (kg)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Costo Estimado ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Costo Real ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Variación / Eficiencia</th>
                  <th scope="col" className="px-3 py-2.5">Lote / Fecha</th>
                  <th scope="col" className="px-3 py-2.5">Estado Operativo y Contable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((o) => {
                  const realCost = o.realCostCOP ?? o.estimatedCostCOP
                  const costDiff = realCost - o.estimatedCostCOP
                  const variationPercent = Number(((costDiff / o.estimatedCostCOP) * 100).toFixed(1))

                  const isOvercost = variationPercent > 5
                  const isModerate = variationPercent > 1 && variationPercent <= 5

                  return (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                        <div>{o.orderNumber}</div>
                        <div className="text-[0.625rem] text-muted-foreground">{o.formulaCode}</div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-foreground max-w-xs">{o.productName}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                        <span className="text-foreground font-semibold">{formatNumber(o.producedQuantity)}</span>
                        <span className="text-muted-foreground text-[0.6875rem]"> / {formatNumber(o.plannedQuantity)}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-foreground">
                        {o.wasteKg} kg
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {formatCurrency(o.estimatedCostCOP)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-foreground">
                        {o.status === 'Programada' ? 'Por liquidar' : formatCurrency(realCost)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {o.status === 'Programada' ? (
                          <span className="text-[0.6875rem] text-muted-foreground">N/A</span>
                        ) : isOvercost ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            🔴 +{variationPercent}% Sobrecosto
                          </span>
                        ) : isModerate ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            🟡 +{variationPercent}% Variación
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            🟢 En Estándar
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-[0.6875rem] font-semibold text-foreground">{o.targetBatch}</div>
                        <div className="text-[0.625rem] text-muted-foreground">{formatDate(o.startDate)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            o.accountingStatus.includes('1430')
                              ? 'success'
                              : o.accountingStatus.includes('1410')
                              ? 'warning'
                              : 'outline'
                          }
                          className="text-[0.6875rem]"
                        >
                          {o.accountingStatus}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: HOJA DE COSTOS PARAMÉTRICA Y SIMULADOR DINÁMICO */}
      {activeTab === 'costSheet' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Ficha Técnica y Estructura de Costos Paramétrica</h3>
                <p className="text-xs text-muted-foreground">Producto: Velón Votivo Blanco 3 Días San Isaac (Fórmula: FORM-V3D-REF)</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Unidad Base: 1 velón (280 g)</Badge>
                <Badge variant="info" className="text-xs">Costo Unitario Total: {formatCurrency(totalUnitCost)}</Badge>
              </div>
            </div>

            {/* Tres Paneles: A, B y C */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* PANEL A: MATERIA PRIMA E INSUMOS DIRECTOS */}
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Panel A — Insumos Directos</h4>
                  <span className="text-xs font-bold text-primary font-mono">{formatCurrency(rawMaterialsSubtotal)}</span>
                </div>
                <div className="divide-y divide-border/50 text-xs">
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Parafina 58/60 Ecopetrol</div>
                      <div className="text-[0.625rem] text-muted-foreground">250 g &bull; Merma 3.5%</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(2450)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Estearina Vegetal</div>
                      <div className="text-[0.625rem] text-muted-foreground">30 g &bull; Merma 1.0%</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(260)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Pabilo Algodón Calibre 24</div>
                      <div className="text-[0.625rem] text-muted-foreground">15 cm &bull; 0.15 m</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(70)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Vaso Termoformado Protector</div>
                      <div className="text-[0.625rem] text-muted-foreground">1 unidad</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(60)}</span>
                  </div>
                </div>
              </div>

              {/* PANEL B: MOD Y CIF / ENERGÉTICOS */}
              <div className="flex flex-col gap-2 rounded-lg border bg-background p-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Panel B — MOD y CIF (Prorrateo)</h4>
                  <span className="text-xs font-bold text-primary font-mono">{formatCurrency(modSubtotal + cifSubtotal)}</span>
                </div>
                <div className="divide-y divide-border/50 text-xs">
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">MOD Vaciado, Pabilado y Empaque</div>
                      <div className="text-[0.625rem] text-muted-foreground">0.05 h/und &bull; Tarifa $13.000/h</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(modSubtotal)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Gas Industrial Calderas y Pailas</div>
                      <div className="text-[0.625rem] text-muted-foreground">Prorrateo térmico por lote</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(210)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Energía Eléctrica y Maquinaria</div>
                      <div className="text-[0.625rem] text-muted-foreground">Consumo extractores y luz</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(120)}</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Depreciación Moldes y Arriendo Planta</div>
                      <div className="text-[0.625rem] text-muted-foreground">Cuota fija imputada</div>
                    </div>
                    <span className="font-mono font-semibold">{formatCurrency(130)}</span>
                  </div>
                </div>
              </div>

              {/* PANEL C: SIMULADOR DINÁMICO DE PRECIOS POR CANAL */}
              <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <Sparkles className="size-3.5" /> Panel C — Simulador de Precios
                  </h4>
                  <Badge variant="outline" className="text-[0.625rem]">Margen s/ Venta</Badge>
                </div>

                <div className="flex flex-col gap-3 text-xs mt-1">
                  {/* Canal 1: Detal (60%) */}
                  <div className="rounded border bg-background p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">1. Venta Detal / Mostrador</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(calculateSuggestedPrice(targetMarginDetal))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[0.6875rem] text-muted-foreground">Margen:</span>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={targetMarginDetal}
                        onChange={(e) => setTargetMarginDetal(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer accent-primary"
                      />
                      <span className="font-mono font-bold text-xs">{targetMarginDetal}%</span>
                    </div>
                  </div>

                  {/* Canal 2: Mayoreo (35%) */}
                  <div className="rounded border bg-background p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">2. Venta Mayoreo / Parroquias</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {formatCurrency(calculateSuggestedPrice(targetMarginMayoreo))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[0.6875rem] text-muted-foreground">Margen:</span>
                      <input
                        type="range"
                        min="15"
                        max="60"
                        value={targetMarginMayoreo}
                        onChange={(e) => setTargetMarginMayoreo(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer accent-sky-500"
                      />
                      <span className="font-mono font-bold text-xs">{targetMarginMayoreo}%</span>
                    </div>
                  </div>

                  {/* Canal 3: Gran Distribuidor (20%) */}
                  <div className="rounded border bg-background p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">3. Distribuidor / Gran Volumen</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(calculateSuggestedPrice(targetMarginDistribuidor))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[0.6875rem] text-muted-foreground">Margen:</span>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        value={targetMarginDistribuidor}
                        onChange={(e) => setTargetMarginDistribuidor(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer accent-indigo-500"
                      />
                      <span className="font-mono font-bold text-xs">{targetMarginDistribuidor}%</span>
                    </div>
                    {targetMarginDistribuidor < minAcceptableMargin && (
                      <div className="mt-1.5 flex items-center gap-1 text-[0.625rem] font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="size-3" />
                        🔴 Alerta: Margen inferior al mínimo rentable ({minAcceptableMargin}%)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
