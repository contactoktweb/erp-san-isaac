'use client'

import { useMemo, useState } from 'react'
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  DollarSign,
  FileText,
  Info,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PayrollWorker } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import { ART_114_1_SMMLV_LIMIT, FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import { NewWorkerModal } from './payroll/new-worker-modal'
import { PayrollAccountingTab } from './payroll/payroll-accounting-tab'
import {
  DEFAULT_PAYROLL_PERIOD_ID,
  NOVEDAD_CATEGORY_CONFIG,
  PAYROLL_PERIOD_OPTIONS,
  computePayrollSummary,
  getArt114ThresholdCOP,
  getDefaultRealDaysForWorker,
  type IbcMode,
  type PayrollNovedad,
  type PayrollTab,
} from './payroll/payroll-calculations'
import { PayrollPilaTab } from './payroll/payroll-pila-tab'
import { RegisterNovedadModal } from './payroll/register-novedad-modal'

interface PayrollComplexViewProps {
  workers: PayrollWorker[]
}

const INITIAL_EMPLOYEE_CODE_OFFSET = 38

/** Calcula el siguiente consecutivo EMP-XXX disponible en el listado local */
function getNextEmployeeCode(workers: PayrollWorker[]): string {
  const maxCode = workers.reduce((max, w) => {
    const match = /\d+/.exec(w.employeeCode)
    const num = match ? Number(match[0]) : 0
    return Math.max(max, num)
  }, INITIAL_EMPLOYEE_CODE_OFFSET - 1)
  return `EMP-${String(maxCode + 1).padStart(3, '0')}`
}

export function PayrollComplexView({ workers }: PayrollComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<PayrollTab>('workers')
  const [localWorkers, setLocalWorkers] = useState<PayrollWorker[]>(workers)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(DEFAULT_PAYROLL_PERIOD_ID)
  const [novedades, setNovedades] = useState<PayrollNovedad[]>([])
  const [ibcMode, setIbcMode] = useState<IbcMode>('30d')
  const [realDaysByWorkerId, setRealDaysByWorkerId] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const worker of workers) {
      initial[worker.id] = getDefaultRealDaysForWorker(worker)
    }
    return initial
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [transmittedNotice, setTransmittedNotice] = useState<string | null>(null)
  const [isNewWorkerModalOpen, setIsNewWorkerModalOpen] = useState(false)
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false)

  const selectedPeriod =
    PAYROLL_PERIOD_OPTIONS.find((p) => p.id === selectedPeriodId) ?? PAYROLL_PERIOD_OPTIONS[0]

  const summary = useMemo(
    () =>
      computePayrollSummary(
        localWorkers,
        selectedPeriod,
        novedades,
        ibcMode,
        realDaysByWorkerId,
      ),
    [localWorkers, selectedPeriod, novedades, ibcMode, realDaysByWorkerId],
  )

  const filteredWorkersComputed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return summary.workersComputed
    return summary.workersComputed.filter(({ worker, costCenterCode }) => {
      return (
        worker.fullName.toLowerCase().includes(q) ||
        worker.employeeCode.toLowerCase().includes(q) ||
        worker.jobTitle.toLowerCase().includes(q) ||
        worker.department.toLowerCase().includes(q) ||
        (worker.costCenter ?? '').toLowerCase().includes(q) ||
        costCenterCode.toLowerCase().includes(q)
      )
    })
  }, [summary.workersComputed, searchQuery])

  const selectedWorkerComputed =
    summary.workersComputed.find((w) => w.worker.id === selectedWorkerId) ?? null

  const activePeriodNovedades = novedades.filter((n) => n.periodId === selectedPeriod.id)
  const art114ThresholdCOP = getArt114ThresholdCOP()
  const nextEmployeeCode = getNextEmployeeCode(localWorkers)

  const handleTransmitDian = (employeeCode: string, name: string) => {
    const msg = `Transmitiendo Documento Soporte de Nómina Electrónica (XML/CUNE individual) para ${name} (${employeeCode}) — Periodo ${selectedPeriod.label}... Validado con éxito ante la DIAN.`
    setTransmittedNotice(msg)
    toast.success(`CUNE generado para ${name} (${employeeCode}).`)
    setTimeout(() => setTransmittedNotice(null), 6000)
  }

  const handleBatchTransmitDian = () => {
    const msg = `Planilla masiva de Nómina Electrónica generada para ${localWorkers.length} trabajadores (${selectedPeriod.label}): 1 XML/CUNE por trabajador listo para transmisión DIAN.`
    setTransmittedNotice(msg)
    toast.success(`Lote DIAN preparado (${localWorkers.length} documentos XML/CUNE).`)
    setTimeout(() => setTransmittedNotice(null), 6000)
  }

  const handleCreateWorker = (newWorker: PayrollWorker) => {
    setLocalWorkers((prev) => [newWorker, ...prev])
    setRealDaysByWorkerId((prev) => ({
      ...prev,
      [newWorker.id]: getDefaultRealDaysForWorker(newWorker),
    }))
    toast.success(
      `Contrato ${newWorker.employeeCode} (${newWorker.fullName}) agregado a la nómina local.`,
    )
  }

  const handleRegisterNovedad = (newNovedad: PayrollNovedad) => {
    setNovedades((prev) => [newNovedad, ...prev])
    toast.success(
      `Novedad "${newNovedad.subtypeLabel}" registrada para ${newNovedad.workerName}.`,
    )
  }

  const handleDeleteNovedad = (novedadId: string) => {
    setNovedades((prev) => prev.filter((n) => n.id !== novedadId))
    toast.info('Novedad eliminada de la liquidación del periodo.')
  }

  const handleRealDaysChange = (workerId: string, days: number) => {
    setRealDaysByWorkerId((prev) => ({ ...prev, [workerId]: days }))
  }

  const handleTabChange = (value: string) => {
    if (value === 'workers' || value === 'pila' || value === 'accounting') {
      setSelectedTab(value)
    }
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
            <Users className="h-4 w-4 text-blue-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {localWorkers.length} trabajadores
            </div>
            <p className="text-xs text-muted-foreground mt-1">Planta Guaduas y Sede Bogotá</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nómina Bruta {selectedPeriod.frequency === 'monthly' ? 'Mensual' : 'Quincenal'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalGrossCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Básicos + Aux. Transporte
              {summary.totalNovedadesEarningsCOP > 0
                ? ` + ${formatCurrency(summary.totalNovedadesEarningsCOP)} nov.`
                : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ahorro Exoneración Art. 114-1
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(summary.monthlyTaxSavingsCOP)} / mes
            </div>
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
            <Receipt className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(summary.totalNetSalariesPayableCOP)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dispuesto para transferencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Referencia de Parámetros Globales Laborales (SMMLV y Auxilio de Transporte) */}
      {/* Nota: FISCAL_PARAMETERS.transportAllowanceCOP ($249.095) es valor hipotético de demostración.
          Los trabajadores base en payroll.json conservan el auxilio demo aprobado por el cliente ($200.000)
          para mantener la Nómina Bruta base en $16.346.750. */}
      <div
        role="note"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2 text-[11px] text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <Info className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>
            <strong className="text-foreground">
              Parámetros {FISCAL_PARAMETERS.fiscalYear}:
            </strong>{' '}
            SMMLV {formatCurrency(FISCAL_PARAMETERS.smmlvCOP)} · Aux. Transporte ref.{' '}
            {formatCurrency(FISCAL_PARAMETERS.transportAllowanceCOP)}{' '}
            <span className="italic">(valor hipotético para nuevos contratos)</span> · Límite Art.
            114-1 E.T.: {ART_114_1_SMMLV_LIMIT} SMMLV ({formatCurrency(art114ThresholdCOP)}).
          </span>
        </div>
        <span className="font-mono text-foreground">
          IBC: {ibcMode === '30d' ? '30 días' : 'Días reales'}
        </span>
      </div>

      {transmittedNotice && (
        <div
          role="status"
          className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in duration-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{transmittedNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger
            value="workers"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Personal y Colillas ({localWorkers.length})
          </TabsTrigger>
          <TabsTrigger
            value="pila"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Seguridad Social y Art. 114-1
          </TabsTrigger>
          <TabsTrigger
            value="accounting"
            className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            Causación Contable (PUC 72/73)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Workers, Period Selector, Modals and Pay Slips */}
        <TabsContent value="workers" className="space-y-4 pt-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
              {/* Selector de Periodo de Liquidación */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="payroll-period-select"
                  className="text-xs font-semibold text-foreground whitespace-nowrap flex items-center gap-1.5"
                >
                  <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  Periodo de Liquidación:
                </label>
                <select
                  id="payroll-period-select"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {PAYROLL_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 max-w-sm">
                <label htmlFor="payroll-worker-search" className="sr-only">
                  Buscar trabajador por nombre, cargo, código o centro de costo
                </label>
                <Search
                  className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="payroll-worker-search"
                  placeholder="Buscar por Nombre, Cargo, Código o CC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsNewWorkerModalOpen(true)}
                className="h-9 text-xs gap-1.5 font-semibold"
              >
                <UserPlus className="size-3.5" aria-hidden="true" />
                + Nuevo Trabajador / Contrato
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNovedadModalOpen(true)}
                className="h-9 text-xs gap-1.5"
              >
                <CalendarPlus className="size-3.5" aria-hidden="true" />
                + Registrar Novedades del Periodo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5"
                onClick={handleBatchTransmitDian}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                Transmitir Todo el Lote a la DIAN
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Código / Nombre
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Cargo y Centro de Costo
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Salario del Periodo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Clasificación ARL
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Art. 114-1 E.T.
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredWorkersComputed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No se encontraron trabajadores que coincidan con &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredWorkersComputed.map((item) => {
                    const { worker } = item
                    const workerNovCount = item.novedades.length
                    return (
                      <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{worker.fullName}</div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {worker.employeeCode} • {worker.nationalIdMasked}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-foreground">
                            {worker.jobTitle}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {worker.costCenter || `${item.costCenterCode} Planta`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">
                          <div>{formatCurrency(item.periodBaseSalaryCOP)}</div>
                          {item.periodTransportCOP > 0 && (
                            <div className="text-[11px] text-muted-foreground">
                              + {formatCurrency(item.periodTransportCOP)} aux.
                            </div>
                          )}
                          {workerNovCount > 0 && (
                            <div className="text-[11px] text-indigo-600 font-medium">
                              {workerNovCount}{' '}
                              {workerNovCount === 1 ? 'novedad activa' : 'novedades activas'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-medium text-foreground">
                            {worker.arlRiskLevel || 'Riesgo II (1.044%)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.art114Exempt ? (
                            <Badge
                              variant="outline"
                              className="text-[11px] text-emerald-600 border-emerald-300"
                            >
                              Exonerado
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[11px] text-amber-700 border-amber-300"
                            >
                              No exento (≥10 SMMLV)
                            </Badge>
                          )}
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
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => setSelectedWorkerId(worker.id)}
                            >
                              <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
                              Colilla
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700"
                              onClick={() =>
                                handleTransmitDian(worker.employeeCode, worker.fullName)
                              }
                            >
                              <Send className="h-3 w-3 mr-1" aria-hidden="true" />
                              DIAN
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Listado de Novedades Registradas en el Periodo */}
          {activePeriodNovedades.length > 0 && (
            <Card className="border-border/80">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    <h3 className="text-sm font-semibold">
                      Novedades Registradas — {selectedPeriod.label}
                    </h3>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Horas extras, recargos, comisiones, vacaciones y descuentos aplicados en la
                    liquidación actual
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activePeriodNovedades.length}{' '}
                  {activePeriodNovedades.length === 1 ? 'registro' : 'registros'}
                </Badge>
              </CardHeader>
              <CardContent className="text-xs">
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2">
                          Trabajador
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Categoría / Concepto
                        </th>
                        <th scope="col" className="px-3 py-2">
                          Cant. / Observación
                        </th>
                        <th scope="col" className="px-3 py-2 text-right">
                          Valor COP
                        </th>
                        <th scope="col" className="px-3 py-2 text-right">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activePeriodNovedades.map((nov) => {
                        const isDeduction =
                          NOVEDAD_CATEGORY_CONFIG[nov.category].impact === 'deduction'
                        return (
                          <tr key={nov.id}>
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground">{nov.workerName}</div>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {nov.employeeCode}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-foreground">
                                {NOVEDAD_CATEGORY_CONFIG[nov.category].label}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {nov.subtypeLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-mono text-foreground">
                                {nov.quantity} {nov.unitLabel}
                              </div>
                              <span className="text-[11px] text-muted-foreground">{nov.notes}</span>
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono font-semibold ${
                                isDeduction ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                            >
                              {isDeduction ? '-' : '+'}
                              {formatCurrency(nov.amountCOP)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label={`Eliminar novedad de ${nov.workerName}`}
                                onClick={() => handleDeleteNovedad(nov.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Colilla Detail View */}
          {selectedWorkerComputed && (
            <Card className="border-border/90 bg-muted/20 mt-4">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle>
                    <h3 className="text-sm font-semibold">
                      Comprobante de Liquidación de Pago - {selectedWorkerComputed.worker.fullName}
                    </h3>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedPeriod.label} • Transmisión Nómina Electrónica
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWorkerId(null)}
                  className="h-7 text-xs"
                >
                  Cerrar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-card border rounded-lg">
                  <div>
                    <span className="text-muted-foreground">Documento:</span>
                    <div className="font-mono font-medium">
                      {selectedWorkerComputed.worker.nationalIdMasked}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo:</span>
                    <div className="font-medium">{selectedWorkerComputed.worker.jobTitle}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">EPS / Pensión:</span>
                    <div className="font-medium">
                      {selectedWorkerComputed.worker.eps} /{' '}
                      {selectedWorkerComputed.worker.pensionFund}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ARL Tarifa:</span>
                    <div className="font-medium">{selectedWorkerComputed.worker.arlRiskLevel}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 border p-3 rounded-lg bg-card">
                    <div className="font-semibold text-emerald-600 uppercase text-[11px] pb-1 border-b">
                      Devengados
                    </div>
                    <div className="flex justify-between">
                      <span>Sueldo Básico ({selectedPeriod.standardDays} días)</span>
                      <span className="font-medium">
                        {formatCurrency(selectedWorkerComputed.periodBaseSalaryCOP)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Auxilio Legal de Transporte</span>
                      <span className="font-medium">
                        {formatCurrency(selectedWorkerComputed.periodTransportCOP)}
                      </span>
                    </div>
                    {selectedWorkerComputed.novedades
                      .filter((n) => NOVEDAD_CATEGORY_CONFIG[n.category].impact !== 'deduction')
                      .map((nov) => (
                        <div key={nov.id} className="flex justify-between text-emerald-700">
                          <span>
                            {nov.subtypeLabel} ({nov.quantity} {nov.unitLabel})
                          </span>
                          <span className="font-medium">{formatCurrency(nov.amountCOP)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total Devengado:</span>
                      <span>{formatCurrency(selectedWorkerComputed.totalGrossCOP)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border p-3 rounded-lg bg-card">
                    <div className="font-semibold text-rose-600 uppercase text-[11px] pb-1 border-b">
                      Deducciones Empleado
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Aporte a Salud EPS (4.0% sobre IBC{' '}
                        {formatCurrency(selectedWorkerComputed.pilaIbcCOP)})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(selectedWorkerComputed.employeeHealthCOP)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Aporte a Pensión AFP (4.0% sobre IBC{' '}
                        {formatCurrency(selectedWorkerComputed.pilaIbcCOP)})
                      </span>
                      <span className="font-medium">
                        {formatCurrency(selectedWorkerComputed.employeePensionCOP)}
                      </span>
                    </div>
                    {selectedWorkerComputed.novedades
                      .filter((n) => NOVEDAD_CATEGORY_CONFIG[n.category].impact === 'deduction')
                      .map((nov) => (
                        <div key={nov.id} className="flex justify-between text-rose-600">
                          <span>{nov.subtypeLabel}</span>
                          <span className="font-medium">{formatCurrency(nov.amountCOP)}</span>
                        </div>
                      ))}
                    <div className="flex justify-between font-bold pt-2 border-t text-foreground">
                      <span>Neto a Recibir:</span>
                      <span className="text-indigo-600 font-bold">
                        {formatCurrency(selectedWorkerComputed.netPayableCOP)}
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
          <PayrollPilaTab
            summary={summary}
            ibcMode={ibcMode}
            onIbcModeChange={setIbcMode}
            realDaysByWorkerId={realDaysByWorkerId}
            onRealDaysChange={handleRealDaysChange}
          />
        </TabsContent>

        {/* Tab 3: Accounting Interface (PUC 72/73/51/52) */}
        <TabsContent value="accounting" className="space-y-4 pt-4">
          <PayrollAccountingTab summary={summary} />
        </TabsContent>
      </Tabs>

      {/* Modales operativos de Fase 2 (estado local) */}
      {isNewWorkerModalOpen && (
        <NewWorkerModal
          isOpen={isNewWorkerModalOpen}
          nextEmployeeCode={nextEmployeeCode}
          onClose={() => setIsNewWorkerModalOpen(false)}
          onCreateWorker={handleCreateWorker}
        />
      )}

      {isNovedadModalOpen && (
        <RegisterNovedadModal
          isOpen={isNovedadModalOpen}
          workers={localWorkers}
          period={selectedPeriod}
          onClose={() => setIsNovedadModalOpen(false)}
          onRegisterNovedad={handleRegisterNovedad}
        />
      )}
    </div>
  )
}
