'use client'

import { useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  PieChart,
  Play,
  Printer,
  Scale,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReportDefinition } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'

interface ReportsComplexViewProps {
  reports: ReportDefinition[]
}

export function ReportsComplexView({ reports }: ReportsComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<'catalog' | 'cost_statement' | 'thresholds'>('catalog')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)

  const categories = [
    'ALL',
    'Ventas y Cartera',
    'Inventarios y Lotes',
    'Producción y Costos',
    'Contable y Fiscal',
  ]

  const filteredReports = reports.filter((r) => {
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory
    const matchesSearch =
      r.reportCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleSimulateExport = (reportCode: string, format: string) => {
    setGeneratingReport(reportCode)
    setTimeout(() => {
      setGeneratingReport(null)
      alert(`Reporte ${reportCode} generado exitosamente en formato ${format}. Descargando archivo...`)
    }, 1000)
  }

  // Cost Statement Live Breakdown
  const rawMaterialsConsumedCOP = 68450000 // Parafina China 58/60, Malasia, Pabilos
  const directLaborModCOP = 14250000 // MOD Cuentas 7205
  const indirectFactoryCifCOP = 7890000 // CIF Cuentas 7305 (energía, calderas, moldes)
  const totalProductionCostCOP = rawMaterialsConsumedCOP + directLaborModCOP + indirectFactoryCifCOP

  const initialWipInventoryCOP = 4500000 // Inv Inicial Producto en Proceso (PUC 1410)
  const finalWipInventoryCOP = 5200000 // Inv Final Producto en Proceso (PUC 1410)
  const costOfFinishedGoodsCOP = totalProductionCostCOP + initialWipInventoryCOP - finalWipInventoryCOP

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Executive KPI Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ventas Acumuladas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{formatCurrency(128055500)}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">+14.2% vs presupuesto</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Margen Bruto Fabril
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">42.8%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Margen industrial vela y velón</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rotación Parafina
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">18.4 días</div>
            <p className="text-[11px] text-muted-foreground mt-1">Stock de seguridad 45 días</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Merma Térmica Pailas
            </CardTitle>
            <Flame className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">1.84%</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">En tolerancia óptima (&lt;2.0%)</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flujo Operativo Neto
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground">{formatCurrency(41200000)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Caja neta disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="catalog" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Catálogo de Reportes ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="cost_statement" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Estado de Costos (REP-CST-09)
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Topes Legales SAS y Revisoría
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Catalog */}
        <TabsContent value="catalog" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="h-8 text-xs px-2.5 font-medium shrink-0"
                >
                  {cat === 'ALL' ? 'Todos los Reportes' : cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => {
              const isHighlight =
                report.reportCode === 'REP-CST-09' ||
                report.reportCode === 'REP-FIN-10' ||
                report.reportCode === 'REP-TRI-11'

              return (
                <Card
                  key={report.id}
                  className={`border transition-all flex flex-col justify-between ${
                    isHighlight
                      ? 'border-foreground/30 shadow-sm bg-muted/20'
                      : 'border-border/70 hover:border-border'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                        {report.reportCode}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {report.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-1 leading-snug">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {report.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 text-xs space-y-3">
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] border-t pt-2">
                      <span>Rol: {report.authorizedRole}</span>
                      <span>Ejecución: {report.estimatedExecutionTime}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1">
                        {report.exportFormats.map((fmt) => (
                          <span
                            key={fmt}
                            className="px-1.5 py-0.5 bg-muted/70 text-[10px] font-mono rounded text-foreground font-medium"
                          >
                            {fmt}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          disabled={generatingReport === report.reportCode}
                          onClick={() => handleSimulateExport(report.reportCode, 'Excel')}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                          Excel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs px-2"
                          disabled={generatingReport === report.reportCode}
                          onClick={() => handleSimulateExport(report.reportCode, 'PDF')}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Live Cost Statement (REP-CST-09) */}
        <TabsContent value="cost_statement" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    REP-CST-09: Estado de Costos de Producción y Ventas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Liquidación fabril del periodo: Consumo de Parafina + MOD + CIF + Inventario en Proceso (PUC 1410)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleSimulateExport('REP-CST-09', 'Excel')}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exportar NIIF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono">
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-sans">
                    <tr>
                      <th className="px-4 py-2.5">Rubro de Costo Fabril</th>
                      <th className="px-4 py-2.5">Cuenta Contable</th>
                      <th className="px-4 py-2.5 text-right">Monto Parcial (COP)</th>
                      <th className="px-4 py-2.5 text-right">Subtotal / Total (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    <tr>
                      <td className="px-4 py-2 font-sans font-medium text-foreground">
                        (+) Materia Prima Directa Consumida (Parafina China, Malasia, Pabilo)
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">PUC 140501 / 6120</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(rawMaterialsConsumedCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-sans font-medium text-foreground">
                        (+) Mano de Obra Directa (Operarios de Planta Pailas y Moldeo)
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">PUC 720501</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(directLaborModCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-sans font-medium text-foreground">
                        (+) Costos Indirectos de Fabricación CIF (Mantenimiento, Energía Pailas, Aromas)
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">PUC 730501</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(indirectFactoryCifCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr className="bg-muted/30 font-bold font-sans">
                      <td colSpan={3} className="px-4 py-2.5 uppercase">
                        (=) Costo Total de Producción del Periodo
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-foreground text-sm">
                        {formatCurrency(totalProductionCostCOP)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-sans text-foreground">
                        (+) Inventario Inicial de Productos en Proceso (Paila caliente)
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">PUC 141001</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(initialWipInventoryCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-sans text-rose-600">
                        (-) Inventario Final de Productos en Proceso (Corte mensual)
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">PUC 141001</td>
                      <td className="px-4 py-2 text-right text-rose-600">-{formatCurrency(finalWipInventoryCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">—</td>
                    </tr>
                    <tr className="bg-emerald-500/10 font-bold border-t-2 border-emerald-500/30 font-sans">
                      <td colSpan={3} className="px-4 py-3 uppercase text-emerald-800 dark:text-emerald-300 text-sm">
                        (=) Costo Total de Productos Terminados para la Venta (PUC 143001)
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-300 text-base">
                        {formatCurrency(costOfFinishedGoodsCOP)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Legal Thresholds and Statutory Auditor */}
        <TabsContent value="thresholds" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Monitoreo de Topes Legales y Obligación de Revisoría Fiscal (Ley 43 de 1990)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Umbrales de la sociedad SAS: Ingresos Brutos (3.000 SMMLV) y Activos Brutos (5.000 SMMLV)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  Sin Obligación de Revisoría Externa
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Tope Ingresos Brutos (3.000 SMMLV):</span>
                    <span className="font-bold text-foreground">~$4.260.000.000 COP</span>
                  </div>
                  <Progress value={22} className="h-2" />
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Ingresos actuales San Isaac: {formatCurrency(945000000)}</span>
                    <span className="font-medium text-emerald-600">22.1% del tope</span>
                  </div>
                </div>

                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Tope Activos Brutos (5.000 SMMLV):</span>
                    <span className="font-bold text-foreground">~$7.100.000.000 COP</span>
                  </div>
                  <Progress value={18} className="h-2" />
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Activos actuales San Isaac: {formatCurrency(1280000000)}</span>
                    <span className="font-medium text-emerald-600">18.0% del tope</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-muted/30 border border-border/80 rounded-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Dictamen de Auditoría del Sistema:</strong> Velas, Velones y Cirios
                San Isaac SAS se encuentra ampliamente por debajo de los umbrales legales que obligan a contratar
                Revisor Fiscal externo para el presente periodo gravable. No obstante, el ERP mantiene la conciliación
                bancaria mensual, el cálculo de deterioro NIIF y la generación de medios magnéticos para garantizar
                máxima transparencia financiera ante entidades bancarias y la DIAN.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
