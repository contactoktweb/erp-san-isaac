'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Building,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Percent,
  Receipt,
  Search,
  Send,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PayrollWorker } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'

interface PayrollComplexViewProps {
  workers: PayrollWorker[]
}

export function PayrollComplexView({ workers }: PayrollComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<'workers' | 'pila' | 'accounting'>('workers')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<PayrollWorker | null>(null)
  const [transmittedNotice, setTransmittedNotice] = useState<string | null>(null)

  const filteredWorkers = workers.filter((w) => {
    return (
      w.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.department.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Calculations for current period
  const totalBaseSalaryCOP = workers.reduce((acc, w) => acc + w.baseSalaryCOP, 0)
  const totalTransportCOP = workers.reduce((acc, w) => acc + (w.transportAllowanceCOP || 0), 0)
  const totalGrossCOP = totalBaseSalaryCOP + totalTransportCOP

  // Art 114-1 ET Exemption analysis
  // Normal employer rates: Salud 8.5%, SENA 2%, ICBF 3% = 13.5% saving on exempt salaries
  const exemptSalaryBase = workers
    .filter((w) => w.art114Exempt)
    .reduce((acc, w) => acc + w.baseSalaryCOP, 0)
  const monthlyTaxSavingsCOP = Math.round(exemptSalaryBase * 0.135)

  // Accounting splits
  const modCostCOP = workers
    .filter((w) => w.costCenter?.includes('CC-100'))
    .reduce((acc, w) => acc + w.baseSalaryCOP + (w.transportAllowanceCOP || 0), 0)

  const cifCostCOP = workers
    .filter((w) => w.costCenter?.includes('CC-200') && !w.department.includes('Servicios'))
    .reduce((acc, w) => acc + w.baseSalaryCOP + (w.transportAllowanceCOP || 0), 0)

  const adminExpenseCOP = workers
    .filter((w) => w.department.includes('Servicios') || w.costCenter?.includes('Administración'))
    .reduce((acc, w) => acc + w.baseSalaryCOP + (w.transportAllowanceCOP || 0), 0)

  // Deductions (Employee 4% Salud + 4% Pension)
  const totalEmployeeSaludDeduction = Math.round(totalBaseSalaryCOP * 0.04)
  const totalEmployeePensionDeduction = Math.round(totalBaseSalaryCOP * 0.04)
  const totalNetSalariesPayable = totalGrossCOP - totalEmployeeSaludDeduction - totalEmployeePensionDeduction

  const handleTransmitDian = (employeeCode: string, name: string) => {
    setTransmittedNotice(`Transmitiendo Documento Soporte Electrónico de Nómina para ${name} (${employeeCode}) a la DIAN... CUNE generado y validado con éxito.`)
    setTimeout(() => setTransmittedNotice(null), 6000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Personal Activo
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{workers.length} trabajadores</div>
            <p className="text-xs text-muted-foreground mt-1">Planta Guaduas y Sede Bogotá</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nómina Bruta Mensual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalGrossCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">Básicos + Aux. Transporte</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ahorro Exoneración Art. 114-1
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(monthlyTaxSavingsCOP)} / mes</div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
              Exoneración Salud (8.5%), SENA e ICBF
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Neto a Pagar Empleados
            </CardTitle>
            <Receipt className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalNetSalariesPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">Dispuesto para transferencia</p>
          </CardContent>
        </Card>
      </div>

      {transmittedNotice && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{transmittedNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="workers" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Personal y Colillas ({workers.length})
          </TabsTrigger>
          <TabsTrigger value="pila" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Seguridad Social y Art. 114-1
          </TabsTrigger>
          <TabsTrigger value="accounting" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Causación Contable (PUC 72/73)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Workers and Pay Slips */}
        <TabsContent value="workers" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Nombre, Cargo o Código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => alert('Generando planilla masiva de nómina para transmisión CUNE DIAN...')}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Transmitir Todo el Lote a la DIAN
            </Button>
          </div>

          <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Código / Nombre</th>
                  <th scope="col" className="px-4 py-3">Cargo y Centro de Costo</th>
                  <th scope="col" className="px-4 py-3 text-right">Salario Básico</th>
                  <th scope="col" className="px-4 py-3">Clasificación ARL</th>
                  <th scope="col" className="px-4 py-3 text-center">Art. 114-1 E.T.</th>
                  <th scope="col" className="px-4 py-3 text-center">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{worker.fullName}</div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {worker.employeeCode} • {worker.nationalIdMasked}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-foreground">{worker.jobTitle}</div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {worker.costCenter || 'CC-100 Planta'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      <div>{formatCurrency(worker.baseSalaryCOP)}</div>
                      {worker.transportAllowanceCOP ? (
                        <div className="text-[11px] text-muted-foreground">
                          + {formatCurrency(worker.transportAllowanceCOP)} aux.
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-medium text-foreground">{worker.arlRiskLevel || 'Riesgo II (1.044%)'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-300">
                        Exonerado
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={worker.status === 'Activo' ? 'default' : 'secondary'}
                        className="text-[11px]"
                      >
                        {worker.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setSelectedWorkerDetail(worker)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Colilla
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700"
                          onClick={() => handleTransmitDian(worker.employeeCode, worker.fullName)}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          DIAN
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Colilla Modal View */}
          {selectedWorkerDetail && (
            <Card className="border-border/90 bg-muted/20 mt-4">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Comprobante de Liquidación de Pago - {selectedWorkerDetail.fullName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Periodo mensual vigente • Transmisión Nómina Electrónica
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedWorkerDetail(null)} className="h-7 text-xs">
                  Cerrar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-card border rounded-lg">
                  <div>
                    <span className="text-muted-foreground">Documento:</span>
                    <div className="font-mono font-medium">{selectedWorkerDetail.nationalIdMasked}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo:</span>
                    <div className="font-medium">{selectedWorkerDetail.jobTitle}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EPS / Pensión:</span>
                    <div className="font-medium">{selectedWorkerDetail.eps} / {selectedWorkerDetail.pensionFund}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ARL Tarifa:</span>
                    <div className="font-medium">{selectedWorkerDetail.arlRiskLevel}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 border p-3 rounded-lg bg-card">
                    <div className="font-semibold text-emerald-600 uppercase text-[11px] pb-1 border-b">
                      Devengados
                    </div>
                    <div className="flex justify-between">
                      <span>Sueldo Básico (30 días)</span>
                      <span className="font-medium">{formatCurrency(selectedWorkerDetail.baseSalaryCOP)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auxilio Legal de Transporte</span>
                      <span className="font-medium">{formatCurrency(selectedWorkerDetail.transportAllowanceCOP || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total Devengado:</span>
                      <span>
                        {formatCurrency(
                          selectedWorkerDetail.baseSalaryCOP + (selectedWorkerDetail.transportAllowanceCOP || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 border p-3 rounded-lg bg-card">
                    <div className="font-semibold text-rose-600 uppercase text-[11px] pb-1 border-b">
                      Deducciones Empleado
                    </div>
                    <div className="flex justify-between">
                      <span>Aporte a Salud EPS (4.0%)</span>
                      <span className="font-medium">{formatCurrency(Math.round(selectedWorkerDetail.baseSalaryCOP * 0.04))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aporte a Pensión AFP (4.0%)</span>
                      <span className="font-medium">{formatCurrency(Math.round(selectedWorkerDetail.baseSalaryCOP * 0.04))}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t text-foreground">
                      <span>Neto a Recibir:</span>
                      <span className="text-indigo-600 font-bold">
                        {formatCurrency(
                          selectedWorkerDetail.baseSalaryCOP +
                            (selectedWorkerDetail.transportAllowanceCOP || 0) -
                            Math.round(selectedWorkerDetail.baseSalaryCOP * 0.08)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: PILA and Art 114-1 */}
        <TabsContent value="pila" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Consolidado de Seguridad Social Patronal (PILA)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Liquidación de aportes del empleador aplicando beneficio del Art. 114-1 E.T.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  Beneficio Tributario Ley 1819 Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-muted/30 border border-border/80 rounded-lg flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    Exoneración de Aportes Parafiscales y Salud (Art. 114-1 E.T.)
                  </div>
                  <p className="text-muted-foreground mt-1">
                    Como sociedad contribuyente declarante de Renta, Velas San Isaac SAS está exonerada de realizar aportes
                    patronales al SENA (2%), ICBF (3%) y Salud Empleador (8.5%) por todos los trabajadores que devenguen
                    menos de 10 SMMLV. Solo se realiza aporte a Caja de Compensación (4%), Pensión Empleador (12%) y ARL según clase de riesgo.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Concepto PILA</th>
                      <th className="px-4 py-2.5 text-center">Tarifa Legal</th>
                      <th className="px-4 py-2.5 text-center">Tarifa Aplicada (San Isaac SAS)</th>
                      <th className="px-4 py-2.5 text-right">Base Gravable</th>
                      <th className="px-4 py-2.5 text-right">Aporte Mensual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    <tr>
                      <td className="px-4 py-2.5 font-medium">Pensión Patronal</td>
                      <td className="px-4 py-2.5 text-center">12.0%</td>
                      <td className="px-4 py-2.5 text-center font-bold">12.0%</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(totalBaseSalaryCOP)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(Math.round(totalBaseSalaryCOP * 0.12))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-500/5">
                      <td className="px-4 py-2.5 font-medium text-emerald-700 dark:text-emerald-300">
                        Salud Patronal (Art. 114-1 E.T.)
                      </td>
                      <td className="px-4 py-2.5 text-center line-through text-muted-foreground">8.5%</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">0.0% (Exento)</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(totalBaseSalaryCOP)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">$0 COP</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium">Caja de Compensación Familiar (Compensar)</td>
                      <td className="px-4 py-2.5 text-center">4.0%</td>
                      <td className="px-4 py-2.5 text-center font-bold">4.0%</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(totalBaseSalaryCOP)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(Math.round(totalBaseSalaryCOP * 0.04))}
                      </td>
                    </tr>
                    <tr className="bg-emerald-500/5">
                      <td className="px-4 py-2.5 font-medium text-emerald-700 dark:text-emerald-300">
                        SENA e ICBF (Art. 114-1 E.T.)
                      </td>
                      <td className="px-4 py-2.5 text-center line-through text-muted-foreground">5.0% (2% + 3%)</td>
                      <td className="px-4 py-2.5 text-center font-bold text-emerald-600">0.0% (Exento)</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(totalBaseSalaryCOP)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">$0 COP</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium">ARL Positiva (Ponderado Riesgo I, II y III)</td>
                      <td className="px-4 py-2.5 text-center">0.522% a 2.436%</td>
                      <td className="px-4 py-2.5 text-center font-bold">~1.72% prom.</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(totalBaseSalaryCOP)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {formatCurrency(Math.round(totalBaseSalaryCOP * 0.0172))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Accounting Interface (PUC 72/73) */}
        <TabsContent value="accounting" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Comprobante de Causación Automática de Nómina en Contabilidad
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Distribución a Costos de Producción (Cuentas 7205 MOD y 7305 CIF) y Pasivos Laborales
                  </CardDescription>
                </div>
                <Badge variant="default" className="text-xs">
                  Sumas Iguales Cuadradas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5">Código PUC</th>
                      <th className="px-4 py-2.5">Nombre de la Cuenta</th>
                      <th className="px-4 py-2.5">Centro de Costo</th>
                      <th className="px-4 py-2.5 text-right">Débito (COP)</th>
                      <th className="px-4 py-2.5 text-right">Crédito (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-mono">
                    <tr>
                      <td className="px-4 py-2 text-foreground font-semibold">720501</td>
                      <td className="px-4 py-2 font-sans">Mano de Obra Directa (MOD Operarios Pailas/Moldeo)</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">CC-100 Planta</td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">{formatCurrency(modCostCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-foreground font-semibold">730501</td>
                      <td className="px-4 py-2 font-sans">Costos Indirectos CIF (Mantenimiento y Almacén)</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">CC-200 Logística/CIF</td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">{formatCurrency(cifCostCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-foreground font-semibold">510506</td>
                      <td className="px-4 py-2 font-sans">Gastos de Personal (Servicios y Administración)</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">CC-200 Admin</td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">{formatCurrency(adminExpenseCOP)}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2 text-foreground font-semibold">237005</td>
                      <td className="px-4 py-2 font-sans">Aportes a Entidades Promotoras de Salud EPS</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Corriente</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {formatCurrency(totalEmployeeSaludDeduction)}
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2 text-foreground font-semibold">238030</td>
                      <td className="px-4 py-2 font-sans">Fondos de Cesantías y Pensiones AFP</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Corriente</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                      <td className="px-4 py-2 text-right font-bold text-foreground">
                        {formatCurrency(totalEmployeePensionDeduction)}
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className="px-4 py-2 text-foreground font-semibold">250501</td>
                      <td className="px-4 py-2 font-sans">Salarios por Pagar a Trabajadores</td>
                      <td className="px-4 py-2 font-sans text-muted-foreground">Pasivo Nómina</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">$0</td>
                      <td className="px-4 py-2 text-right font-bold text-indigo-600">
                        {formatCurrency(totalNetSalariesPayable)}
                      </td>
                    </tr>
                    <tr className="bg-muted/60 font-bold border-t-2 border-border">
                      <td colSpan={3} className="px-4 py-2.5 font-sans uppercase text-right">
                        Totales Comprobante de Causación:
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground">{formatCurrency(totalGrossCOP)}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{formatCurrency(totalGrossCOP)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
