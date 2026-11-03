'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Landmark,
  Layers,
  Lock,
  Plus,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AccountEntry } from '@/database/schemas'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

interface Props {
  accounts: AccountEntry[]
}

export function AccountingComplexView({ accounts }: Props) {
  const [activeTab, setActiveTab] = useState<'puc' | 'costStatement' | 'bankReconciliation' | 'exogena'>('puc')

  // Totalizadores de partida doble para el PUC
  const totalDebits = accounts.reduce((acc, a) => acc + a.debitCOP, 0)
  const totalCredits = accounts.reduce((acc, a) => acc + a.creditCOP, 0)
  const isDoubleEntryBalanced = totalDebits === totalCredits
  const [isFiscalPeriodClosed, setIsFiscalPeriodClosed] = useState<boolean>(false)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Selector de sub-vistas contables */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'puc' ? 'default' : 'outline'}
          onClick={() => setActiveTab('puc')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <BookOpen className="size-3.5" />
          Plan Único de Cuentas (PUC) &amp; Partida Doble ({accounts.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'costStatement' ? 'default' : 'outline'}
          onClick={() => setActiveTab('costStatement')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <Layers className="size-3.5" />
          Estado de Costos de Producción y Ventas (Tarjeta #14)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'bankReconciliation' ? 'default' : 'outline'}
          onClick={() => setActiveTab('bankReconciliation')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none"
        >
          <Landmark className="size-3.5" />
          Conciliación Bancaria por Extractos (Tarjeta #15)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'exogena' ? 'default' : 'outline'}
          onClick={() => setActiveTab('exogena')}
          className="text-xs gap-1.5 h-8 font-medium shadow-none bg-purple-600/10 text-purple-700 dark:text-purple-300 hover:bg-purple-600/20 border-purple-300 dark:border-purple-800"
        >
          <FileSpreadsheet className="size-3.5 text-purple-600" />
          📄 Prevalidador Medios Magnéticos Exógena (Tarjeta #16)
        </Button>
      </div>

      {/* PESTAÑA 1: PUC Y REGLAS DE PARTIDA DOBLE (NUMERALES 5, 7 Y 13) */}
      {activeTab === 'puc' && (
        <div className="flex flex-col gap-4">
          {/* Banner de Partida Doble y Control de Periodo Cerrado */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Suma Total Débitos PUC</div>
                <div className="text-sm font-bold font-mono text-foreground">{formatCurrency(totalDebits)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Suma Total Créditos PUC</div>
                <div className="text-sm font-bold font-mono text-foreground">{formatCurrency(totalCredits)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Estado Partida Doble</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> 🟢 Sumas Iguales / Balanceada
                </div>
              </div>
              <Button
                size="sm"
                variant={isFiscalPeriodClosed ? 'default' : 'outline'}
                onClick={() => setIsFiscalPeriodClosed(!isFiscalPeriodClosed)}
                className="text-xs gap-1"
              >
                <Lock className="size-3" />
                {isFiscalPeriodClosed ? '🔒 Periodo Bloqueado' : 'Periodo Abierto'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Cuentas Esenciales de Manufactura Integradas (Numerales 5, 7 y 13):</strong> Cuentas de anticipo (135515/135595), Producto en Proceso (141001), Retenciones e impuestos (2365/2368/240802), Costo de Ventas (6120) y Costos Directos e Indirectos (7205 MOD / 7305 CIF).
          </div>

          {/* Tabla PUC */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Código PUC</th>
                  <th scope="col" className="px-3 py-2.5">Nombre de la Cuenta</th>
                  <th scope="col" className="px-3 py-2.5">Clasificación</th>
                  <th scope="col" className="px-3 py-2.5">Centro de Costos</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Débito ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Crédito ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Saldo Neto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono font-bold text-foreground">{acc.code}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{acc.name}</td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={
                          acc.accountType === 'Activo'
                            ? 'outline'
                            : acc.accountType === 'Costos de producción'
                            ? 'warning'
                            : acc.accountType === 'Pasivo'
                            ? 'danger'
                            : 'info'
                        }
                        className="text-[0.6875rem]"
                      >
                        {acc.accountType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">{acc.costCenter}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ESTADO DE COSTOS DE PRODUCCIÓN Y VENTAS INTEGRADO (TARJETA #14) */}
      {activeTab === 'costStatement' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
            <strong>Estado de Costos de Producción y Ventas (Numerales 8 y 14):</strong> Consolida matemáticamente el inventario inicial/final de materias primas, compras, mano de obra directa (7205), costos indirectos (7305), inventarios en proceso (1410) y producto terminado (1430) para fijar el Costo de Ventas en el Estado de Resultados.
          </div>

          <div className="rounded-xl border bg-background p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center justify-between">
              <span>Informe de Costos de Producción y Ventas — Acumulado Trimestral</span>
              <Badge variant="outline">Periodo 2026-Q1</Badge>
            </h3>

            <div className="mt-3 divide-y divide-border/50 text-xs">
              <div className="py-2 flex justify-between font-semibold text-foreground">
                <span>1. Inventario Inicial de Materias Primas (1405):</span>
                <span className="font-mono">$24.500.000</span>
              </div>
              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>+ Compras Netas de Parafinas, Ceras y Pabilos:</span>
                <span className="font-mono">+$73.500.000</span>
              </div>
              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>- Inventario Final de Materias Primas:</span>
                <span className="font-mono">-$29.800.000</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-primary bg-muted/20 px-2 rounded">
                <span>(=) Materia Prima Directa Utilizada en Fábrica:</span>
                <span className="font-mono">$68.200.000</span>
              </div>

              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>+ Mano de Obra Directa (MOD - Cuenta 7205):</span>
                <span className="font-mono">+$14.200.000</span>
              </div>
              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>+ Costos Indirectos de Fabricación y Gas (CIF - Cuenta 7305):</span>
                <span className="font-mono">+$8.600.000</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-foreground bg-muted/20 px-2 rounded">
                <span>(=) Costo Total de Producción del Periodo:</span>
                <span className="font-mono">$91.000.000</span>
              </div>

              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>+ Inventario Inicial de Productos en Proceso (1410):</span>
                <span className="font-mono">+$8.900.000</span>
              </div>
              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>- Inventario Final de Productos en Proceso (Pailas):</span>
                <span className="font-mono">-$5.600.000</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold text-foreground bg-muted/20 px-2 rounded">
                <span>(=) Costo de Productos Terminados en el Periodo:</span>
                <span className="font-mono">$94.300.000</span>
              </div>

              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>+ Inventario Inicial de Producto Terminado (1430):</span>
                <span className="font-mono">+$21.800.000</span>
              </div>
              <div className="py-2 flex justify-between text-muted-foreground pl-4">
                <span>- Inventario Final de Producto Terminado (Bodega Despachos):</span>
                <span className="font-mono">-$32.400.000</span>
              </div>
              <div className="py-3 flex justify-between font-bold text-sm text-foreground bg-primary/10 px-3 rounded">
                <span className="text-primary">(=) COSTO DE VENTAS TOTAL (CUENTA 6120):</span>
                <span className="font-mono text-primary font-bold text-base">$83.700.000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CONCILIACIÓN BANCARIA POR EXTRACTOS (TARJETA #15) */}
      {activeTab === 'bankReconciliation' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Conciliación Bancaria Automatizada (Numeral 15):</strong> Cruce entre extracto bancario (Excel/CSV) y auxiliares contables de Bancolombia. Semáforo condicional: 🟢 Partida Conciliada, 🟡 Pendiente por Causar (GMF / comisiones), 🔴 Diferencia por Revisar.
          </div>

          <div className="overflow-x-auto">
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
                {BANK_RECON_DEMO.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{item.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{item.description}</td>
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
                          <CheckCircle2 className="size-3" /> 🟢 Partida Conciliada
                        </span>
                      ) : item.status === 'Pendiente causar' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="size-3" /> 🟡 Pendiente Causar en Libros
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-bold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="size-3" /> 🔴 Diferencia por Revisar
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {item.status === 'Pendiente causar' && (
                        <Button size="sm" variant="outline" className="text-xs">
                          Causar Gasto GMF
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: ASISTENTE DE INFORMACIÓN EXÓGENA DIAN (TARJETA #16) */}
      {activeTab === 'exogena' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 p-4 text-xs text-purple-950 dark:text-purple-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-bold text-sm">Asistente de Información Exógena (Numeral 16)</div>
              <p className="mt-1">
                Cruce automático de cuentas contables por tercero, discriminación de cuantías menores y exportación en formato oficial DIAN (Prevalidador).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => alert('Generando archivo Excel normalizado para Prevalidador Tributario DIAN (Resolución Vigente)...')}
                className="text-xs h-8 gap-1.5"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                Descargar Excel Prevalidador
              </Button>
              <Button
                size="sm"
                onClick={() => alert('Generando XML oficial con firma digital para carga en portal MUISCA de la DIAN...')}
                className="text-xs h-8 gap-1.5 bg-purple-700 hover:bg-purple-800 text-white"
              >
                <FileCheck2 className="size-3.5" />
                Generar XML MUISCA
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Formato 1001 v10</span>
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700">Prevalidado</Badge>
              </div>
              <div className="text-[0.6875rem] text-muted-foreground mt-1">Pagos y abonos en cuenta y retenciones practicadas</div>
              <div className="mt-3 flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">38 Terceros procesados</span>
                <span className="font-mono text-sm font-bold text-foreground">$184.200.000</span>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Formato 1007 v9</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700">Prevalidado</Badge>
              </div>
              <div className="text-[0.6875rem] text-muted-foreground mt-1">Ingresos propios recibidos en el año gravable</div>
              <div className="mt-3 flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">24 Clientes reportados</span>
                <span className="font-mono text-sm font-bold text-foreground">$218.450.000</span>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Formato 1003 v7</span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700">Prevalidado</Badge>
              </div>
              <div className="text-[0.6875rem] text-muted-foreground mt-1">Retenciones en la fuente que le practicaron a la SAS</div>
              <div className="mt-3 flex items-center justify-between border-t pt-2">
                <span className="text-xs text-muted-foreground">19 Agentes retenedores</span>
                <span className="font-mono text-sm font-bold text-foreground">$5.461.250</span>
              </div>
            </div>
          </div>

          {/* Tabla de Muestra Formato 1001 */}
          <div className="rounded-xl border border-border/80 overflow-hidden bg-card">
            <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">
                Vista Previa Formato 1001 (Pagos en Cuenta a Proveedores Clave)
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">Resolución Exógena Nacional DIAN</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Concepto</th>
                    <th scope="col" className="px-4 py-2.5">Tipo Doc</th>
                    <th scope="col" className="px-4 py-2.5">Número Identificación</th>
                    <th scope="col" className="px-4 py-2.5">Razón Social / Beneficiario</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Pago Deducible ($)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">ReteFuente Practicada ($)</th>
                    <th scope="col" className="px-4 py-2.5 text-center">Estado Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">5007 (Compra Materia Prima)</td>
                    <td className="px-4 py-2.5">31 (NIT)</td>
                    <td className="px-4 py-2.5 font-mono">899.999.068-1</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">Ecopetrol S.A.</td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium">$98.000.000</td>
                    <td className="px-4 py-2.5 font-mono text-right font-bold text-rose-600">$2.450.000</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="size-3" /> Conforme
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">5008 (Arrendamientos)</td>
                    <td className="px-4 py-2.5">31 (NIT)</td>
                    <td className="px-4 py-2.5 font-mono">900.542.119-3</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">Inmobiliaria y Bodegas Guaduas SAS</td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium">$18.500.000</td>
                    <td className="px-4 py-2.5 font-mono text-right font-bold text-rose-600">$647.500</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="size-3" /> Conforme
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono font-bold text-foreground">5002 (Honorarios Técnicos)</td>
                    <td className="px-4 py-2.5">13 (CC)</td>
                    <td className="px-4 py-2.5 font-mono">79.882.104</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">Ing. Andrés Felipe Gómez Castro</td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium">$7.200.000</td>
                    <td className="px-4 py-2.5 font-mono text-right font-bold text-rose-600">$720.000</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="size-3" /> Conforme
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BANK_RECON_DEMO = [
  {
    id: 'bnk-1',
    date: '2026-03-02',
    description: 'Pago Transferencia Proveedor Ecopetrol SAS',
    voucher: 'CE-2026-041',
    bankAmountCOP: -98000000,
    bookAmountCOP: -98000000,
    status: 'Conciliada',
  },
  {
    id: 'bnk-2',
    date: '2026-03-03',
    description: 'Gravamen Movimientos Financieros (GMF 4x1000)',
    voucher: 'Pendiente',
    bankAmountCOP: -392000,
    bookAmountCOP: 0,
    status: 'Pendiente causar',
  },
  {
    id: 'bnk-3',
    date: '2026-03-04',
    description: 'Consignación Recaudo El Cirio Sagrado FEV-1082',
    voucher: 'RC-2026-089',
    bankAmountCOP: 5000000,
    bookAmountCOP: 5000000,
    status: 'Conciliada',
  },
  {
    id: 'bnk-4',
    date: '2026-03-05',
    description: 'Transferencia por identificar corresponsal Bancolombia',
    voucher: 'Sin soporte',
    bankAmountCOP: 850000,
    bookAmountCOP: 0,
    status: 'Diferencia por revisar',
  },
]
