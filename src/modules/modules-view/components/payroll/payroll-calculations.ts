import type { PayrollWorker } from '@/database/schemas'
import {
  ART_114_1_SMMLV_LIMIT,
  FISCAL_PARAMETERS,
  smmlvToPesos,
} from '@/lib/fiscal-parameters'

export type CostCenterCode = 'CC-100' | 'CC-200' | 'CC-300' | 'CC-400'
export type ArlRiskCode = 'I' | 'II' | 'III'
export type IbcMode = '30d' | 'real_days'
export type PayrollTab = 'workers' | 'pila' | 'accounting'

export type PeriodFrequency = 'monthly' | 'quincena_1' | 'quincena_2'

export interface PayrollPeriodOption {
  id: string
  label: string
  monthLabel: string
  frequency: PeriodFrequency
  factor: number
  standardDays: number
}

export const PAYROLL_PERIOD_OPTIONS: PayrollPeriodOption[] = [
  {
    id: '2026-11-M',
    label: 'Noviembre 2026 (Mes completo · 30 días)',
    monthLabel: 'Noviembre 2026',
    frequency: 'monthly',
    factor: 1,
    standardDays: 30,
  },
  {
    id: '2026-11-Q1',
    label: 'Noviembre 2026 · 1ra Quincena (1–15)',
    monthLabel: 'Noviembre 2026',
    frequency: 'quincena_1',
    factor: 0.5,
    standardDays: 15,
  },
  {
    id: '2026-11-Q2',
    label: 'Noviembre 2026 · 2da Quincena (16–30)',
    monthLabel: 'Noviembre 2026',
    frequency: 'quincena_2',
    factor: 0.5,
    standardDays: 15,
  },
  {
    id: '2026-10-M',
    label: 'Octubre 2026 (Mes completo · 30 días)',
    monthLabel: 'Octubre 2026',
    frequency: 'monthly',
    factor: 1,
    standardDays: 30,
  },
  {
    id: '2026-12-M',
    label: 'Diciembre 2026 (Mes completo · 30 días)',
    monthLabel: 'Diciembre 2026',
    frequency: 'monthly',
    factor: 1,
    standardDays: 30,
  },
]

export const DEFAULT_PAYROLL_PERIOD_ID = PAYROLL_PERIOD_OPTIONS[0].id

export type PayrollNovedadCategory =
  | 'horas_extras'
  | 'recargos'
  | 'comisiones'
  | 'vacaciones'
  | 'descuentos'

export interface PayrollNovedad {
  id: string
  periodId: string
  workerId: string
  workerName: string
  employeeCode: string
  category: PayrollNovedadCategory
  subtypeLabel: string
  quantity: number
  unitLabel: string
  amountCOP: number
  notes: string
  createdAt: string
}

export interface NovedadSubtypeOption {
  value: string
  label: string
  /** Factor multiplicador sobre el valor hora ordinaria (0 si es valor manual/fijo) */
  hourlyFactor: number
  isDaily?: boolean
}

export const NOVEDAD_CATEGORY_CONFIG: Record<
  PayrollNovedadCategory,
  {
    label: string
    impact: 'earning_salary' | 'earning_vacation' | 'deduction'
    unitLabel: string
    subtypes: NovedadSubtypeOption[]
  }
> = {
  horas_extras: {
    label: 'Horas Extras',
    impact: 'earning_salary',
    unitLabel: 'horas',
    subtypes: [
      { value: 'HED', label: 'Hora Extra Diurna (+25%)', hourlyFactor: 1.25 },
      { value: 'HEN', label: 'Hora Extra Nocturna (+75%)', hourlyFactor: 1.75 },
      { value: 'HEDDF', label: 'Hora Extra Diurna Dom./Festiva (+100%)', hourlyFactor: 2.0 },
      { value: 'HENDF', label: 'Hora Extra Nocturna Dom./Festiva (+150%)', hourlyFactor: 2.5 },
    ],
  },
  recargos: {
    label: 'Recargos Nocturnos / Dominicales',
    impact: 'earning_salary',
    unitLabel: 'horas',
    subtypes: [
      { value: 'RN', label: 'Recargo Nocturno Ordinario (+35%)', hourlyFactor: 0.35 },
      { value: 'RDF', label: 'Recargo Dominical o Festivo (+80%)', hourlyFactor: 0.8 },
      { value: 'RNF', label: 'Recargo Nocturno Dominical/Festivo (+115%)', hourlyFactor: 1.15 },
    ],
  },
  comisiones: {
    label: 'Comisiones',
    impact: 'earning_salary',
    unitLabel: 'liq.',
    subtypes: [
      { value: 'COM_VENTAS', label: 'Comisión por Cumplimiento de Ventas', hourlyFactor: 0 },
      { value: 'BONO_PROD', label: 'Bonificación Salarial de Producción', hourlyFactor: 0 },
    ],
  },
  vacaciones: {
    label: 'Vacaciones',
    impact: 'earning_vacation',
    unitLabel: 'días',
    subtypes: [
      { value: 'VAC_DISF', label: 'Vacaciones Disfrutadas en Tiempo', hourlyFactor: 0, isDaily: true },
      { value: 'VAC_COMP', label: 'Vacaciones Compensadas en Dinero', hourlyFactor: 0, isDaily: true },
    ],
  },
  descuentos: {
    label: 'Descuentos / Préstamos',
    impact: 'deduction',
    unitLabel: 'cuota',
    subtypes: [
      { value: 'PRESTAMO', label: 'Cuota Préstamo a Trabajador', hourlyFactor: 0 },
      { value: 'LIBRANZA', label: 'Descuento por Libranza', hourlyFactor: 0 },
      { value: 'OTRO_DESC', label: 'Otro Descuento Autorizado', hourlyFactor: 0 },
    ],
  },
}

/** Constantes legales y contables centralizadas para liquidación de nómina */
export const PAYROLL_RATES = {
  DAYS_IN_STANDARD_MONTH: 30,
  MONTHLY_ORDINARY_HOURS: 220,
  TRANSPORT_ALLOWANCE_SMMLV_LIMIT: 2,
  EMPLOYEE_HEALTH: 0.04,
  EMPLOYEE_PENSION: 0.04,
  EMPLOYER_PENSION: 0.12,
  EMPLOYER_CAJA: 0.04,
  /** Tarifa ARL ponderada promedio de planta (Riesgos I, II y III) usada en PILA consolidada */
  EMPLOYER_ARL_WEIGHTED: 0.0172,
  /** Tarifa de ahorro patronal Art. 114-1 E.T.: Salud 8.5% + SENA 2% + ICBF 3% */
  EMPLOYER_EXEMPT_SAVING: 0.135,
  EMPLOYER_HEALTH: 0.085,
  EMPLOYER_PARAFISCAL_SENA_ICBF: 0.05,
  PROVISION_CESANTIAS: 0.0833,
  PROVISION_INTERESES: 0.01,
  PROVISION_PRIMA: 0.0833,
  PROVISION_VACACIONES: 0.0417,
} as const

export const ARL_RISK_OPTIONS: Record<
  ArlRiskCode,
  { code: ArlRiskCode; label: string; rate: number; fullLabel: string }
> = {
  I: {
    code: 'I',
    label: 'Riesgo I (0.522%)',
    rate: 0.00522,
    fullLabel: 'Riesgo I (0.522% - Administrativo / Comercial)',
  },
  II: {
    code: 'II',
    label: 'Riesgo II (1.044%)',
    rate: 0.01044,
    fullLabel: 'Riesgo II (1.044% - Manufactura / Logística)',
  },
  III: {
    code: 'III',
    label: 'Riesgo III (2.436%)',
    rate: 0.02436,
    fullLabel: 'Riesgo III (2.436% - Térmico / Fundición / Mantenimiento)',
  },
}

export interface CostCenterAccountMapping {
  code: CostCenterCode
  shortLabel: string
  description: string
  departmentDefault: string
  salaryPucCode: string
  salaryPucName: string
  pilaPucCode: string
  pilaPucName: string
  provisionPucCode: string
  provisionPucName: string
}

export const COST_CENTER_ORDER: CostCenterCode[] = ['CC-100', 'CC-300', 'CC-200', 'CC-400']

export const COST_CENTER_ACCOUNTS: Record<CostCenterCode, CostCenterAccountMapping> = {
  'CC-100': {
    code: 'CC-100',
    shortLabel: 'CC-100 Planta',
    description: 'CC-100 Costo Mano de Obra Directa (MOD Planta)',
    departmentDefault: 'Producción - Planta',
    salaryPucCode: '720501',
    salaryPucName: 'Mano de Obra Directa (MOD Operarios Pailas/Moldeo)',
    pilaPucCode: '720568',
    pilaPucName: 'Aportes Patronales PILA — MOD (Pensión, Caja, ARL)',
    provisionPucCode: '720530',
    provisionPucName: 'Provisiones Prestaciones Sociales — MOD',
  },
  'CC-300': {
    code: 'CC-300',
    shortLabel: 'CC-300 Logística/CIF',
    description: 'CC-300 Logística / Mantenimiento / Planta Indirecta (CIF)',
    departmentDefault: 'Logística y Mantenimiento',
    salaryPucCode: '730501',
    salaryPucName: 'Costos Indirectos CIF (Logística, Mantenimiento y Almacén)',
    pilaPucCode: '730568',
    pilaPucName: 'Aportes Patronales PILA — CIF (Pensión, Caja, ARL)',
    provisionPucCode: '730530',
    provisionPucName: 'Provisiones Prestaciones Sociales — CIF',
  },
  'CC-200': {
    code: 'CC-200',
    shortLabel: 'CC-200 Administración',
    description: 'CC-200 Gastos Generales de Administración',
    departmentDefault: 'Administración y Servicios',
    salaryPucCode: '510506',
    salaryPucName: 'Gastos de Personal — Administración y Servicios',
    pilaPucCode: '510568',
    pilaPucName: 'Aportes Patronales PILA — Administración',
    provisionPucCode: '510530',
    provisionPucName: 'Provisiones Prestaciones Sociales — Administración',
  },
  'CC-400': {
    code: 'CC-400',
    shortLabel: 'CC-400 Ventas',
    description: 'CC-400 Gastos de Personal de Ventas y Comercial',
    departmentDefault: 'Ventas y Comercial',
    salaryPucCode: '520506',
    salaryPucName: 'Gastos de Personal — Ventas y Comercial',
    pilaPucCode: '520568',
    pilaPucName: 'Aportes Patronales PILA — Ventas',
    provisionPucCode: '520530',
    provisionPucName: 'Provisiones Prestaciones Sociales — Ventas',
  },
}

/** Resuelve el código normalizado de centro de costos del trabajador */
export function resolveCostCenterCode(costCenter?: string, department?: string): CostCenterCode {
  const normalizedCC = (costCenter ?? '').toUpperCase()
  const normalizedDept = (department ?? '').toLowerCase()

  if (normalizedCC.includes('CC-100')) return 'CC-100'
  if (normalizedCC.includes('CC-300')) return 'CC-300'
  if (normalizedCC.includes('CC-400')) return 'CC-400'
  if (normalizedCC.includes('CC-200')) {
    // Respaldo defensivo en caso de datos heredados con Logística/Mantenimiento bajo CC-200
    if (
      normalizedCC.includes('CIF') ||
      normalizedCC.includes('LOGÍSTICA') ||
      normalizedDept.includes('mantenimiento') ||
      normalizedDept.includes('logística')
    ) {
      return 'CC-300'
    }
    return 'CC-200'
  }
  return 'CC-100'
}

/** Tope de exoneración Art. 114-1 E.T. en pesos, calculado desde FISCAL_PARAMETERS */
export function getArt114ThresholdCOP(): number {
  return smmlvToPesos(ART_114_1_SMMLV_LIMIT, FISCAL_PARAMETERS.smmlvCOP)
}

/** Valida exoneración de Salud patronal, SENA e ICBF (< 10 SMMLV) */
export function isWorkerArt114Exempt(salaryIbcBaseCOP: number): boolean {
  return salaryIbcBaseCOP < getArt114ThresholdCOP()
}

/** Días trabajados por defecto según estado laboral para modo 'Días reales laborados' */
export function getDefaultRealDaysForWorker(worker: PayrollWorker): number {
  if (worker.status.toLowerCase().includes('vacaciones')) {
    return 15
  }
  return PAYROLL_RATES.DAYS_IN_STANDARD_MONTH
}

export interface WorkerPayrollComputed {
  worker: PayrollWorker
  costCenterCode: CostCenterCode
  periodBaseSalaryCOP: number
  periodTransportCOP: number
  salaryNovedadesCOP: number
  vacationNovedadesCOP: number
  deductionNovedadesCOP: number
  totalGrossCOP: number
  /** Base mensual de cotización ajustada por el periodo antes de días reales */
  periodMonthlyIbcCOP: number
  /** Días de cotización aplicados según configuración ('30d' o 'real_days') */
  pilaDays: number
  /** IBC efectivo de cotización PILA */
  pilaIbcCOP: number
  art114Exempt: boolean
  employeeHealthCOP: number
  employeePensionCOP: number
  netPayableCOP: number
  novedades: PayrollNovedad[]
}

export interface CostCenterCausationTotals {
  code: CostCenterCode
  workerCount: number
  grossCOP: number
  provisionBaseCOP: number
  vacationProvisionBaseCOP: number
  pilaIbcCOP: number
  nonExemptPilaIbcCOP: number
  employerPensionCOP: number
  employerCajaCOP: number
  employerArlCOP: number
  employerNonExemptHealthCOP: number
  employerNonExemptParafiscalCOP: number
  employerPilaTotalCOP: number
  provisionCesantiasCOP: number
  provisionInteresesCOP: number
  provisionPrimaCOP: number
  provisionVacacionesCOP: number
  provisionsTotalCOP: number
}

export interface PayrollComputedSummary {
  period: PayrollPeriodOption
  ibcMode: IbcMode
  art114ThresholdCOP: number
  workersComputed: WorkerPayrollComputed[]
  totalBaseSalaryPeriodCOP: number
  totalTransportPeriodCOP: number
  totalNovedadesEarningsCOP: number
  totalGrossCOP: number
  totalPilaIbcCOP: number
  exemptPilaIbcCOP: number
  nonExemptPilaIbcCOP: number
  monthlyTaxSavingsCOP: number
  totalEmployeeSaludCOP: number
  totalEmployeePensionCOP: number
  totalEmployeeDiscountsCOP: number
  totalNetSalariesPayableCOP: number
  byCostCenter: Record<CostCenterCode, CostCenterCausationTotals>
  // Totales PILA Patronal (derivados de la matriz por CC para garantizar exactitud de sumas)
  employerPensionCOP: number
  employerCajaCOP: number
  employerArlCOP: number
  employerNonExemptHealthCOP: number
  employerNonExemptParafiscalCOP: number
  totalEmployerPilaCOP: number
  // Totales Provisiones (derivados de la matriz por CC)
  provisionCesantiasCOP: number
  provisionInteresesCOP: number
  provisionPrimaCOP: number
  provisionVacacionesCOP: number
  totalProvisionsCOP: number
  // Control de cuadre Contable (Sumas Iguales)
  block1DebitTotalCOP: number
  block1CreditTotalCOP: number
  isBlock1Balanced: boolean
  block2DebitTotalCOP: number
  block2CreditTotalCOP: number
  isBlock2Balanced: boolean
}

export function computePayrollSummary(
  workers: PayrollWorker[],
  period: PayrollPeriodOption,
  novedades: PayrollNovedad[],
  ibcMode: IbcMode,
  realDaysByWorkerId: Record<string, number>,
): PayrollComputedSummary {
  const art114ThresholdCOP = getArt114ThresholdCOP()
  const periodNovedades = novedades.filter((n) => n.periodId === period.id)

  const workersComputed: WorkerPayrollComputed[] = workers.map((worker) => {
    const costCenterCode = resolveCostCenterCode(worker.costCenter, worker.department)
    const workerNovedades = periodNovedades.filter((n) => n.workerId === worker.id)

    const periodBaseSalaryCOP = Math.round(worker.baseSalaryCOP * period.factor)
    const periodTransportCOP = Math.round((worker.transportAllowanceCOP ?? 0) * period.factor)

    let salaryNovedadesCOP = 0
    let vacationNovedadesCOP = 0
    let deductionNovedadesCOP = 0

    for (const nov of workerNovedades) {
      const impact = NOVEDAD_CATEGORY_CONFIG[nov.category].impact
      if (impact === 'earning_salary') {
        salaryNovedadesCOP += nov.amountCOP
      } else if (impact === 'earning_vacation') {
        vacationNovedadesCOP += nov.amountCOP
      } else {
        deductionNovedadesCOP += nov.amountCOP
      }
    }

    const totalGrossCOP =
      periodBaseSalaryCOP + periodTransportCOP + salaryNovedadesCOP + vacationNovedadesCOP

    const periodMonthlyIbcCOP = periodBaseSalaryCOP + salaryNovedadesCOP
    const rawRealDays = realDaysByWorkerId[worker.id] ?? getDefaultRealDaysForWorker(worker)
    const clampedRealDays = Math.min(
      PAYROLL_RATES.DAYS_IN_STANDARD_MONTH,
      Math.max(1, Math.round(rawRealDays)),
    )

    const pilaDays =
      ibcMode === '30d' ? PAYROLL_RATES.DAYS_IN_STANDARD_MONTH : clampedRealDays

    const pilaIbcCOP =
      ibcMode === '30d'
        ? periodMonthlyIbcCOP
        : Math.round(periodMonthlyIbcCOP * (pilaDays / PAYROLL_RATES.DAYS_IN_STANDARD_MONTH))

    // Validación Art. 114-1 E.T. sobre ingreso salarial mensual equivalente
    const monthlyEquivalentSalary = worker.baseSalaryCOP + salaryNovedadesCOP
    const art114Exempt = isWorkerArt114Exempt(monthlyEquivalentSalary)

    const employeeHealthCOP = Math.round(pilaIbcCOP * PAYROLL_RATES.EMPLOYEE_HEALTH)
    const employeePensionCOP = Math.round(pilaIbcCOP * PAYROLL_RATES.EMPLOYEE_PENSION)
    const netPayableCOP =
      totalGrossCOP - employeeHealthCOP - employeePensionCOP - deductionNovedadesCOP

    return {
      worker,
      costCenterCode,
      periodBaseSalaryCOP,
      periodTransportCOP,
      salaryNovedadesCOP,
      vacationNovedadesCOP,
      deductionNovedadesCOP,
      totalGrossCOP,
      periodMonthlyIbcCOP,
      pilaDays,
      pilaIbcCOP,
      art114Exempt,
      employeeHealthCOP,
      employeePensionCOP,
      netPayableCOP,
      novedades: workerNovedades,
    }
  })

  // Agrupación por centro de costos
  const emptyCC = (code: CostCenterCode): CostCenterCausationTotals => ({
    code,
    workerCount: 0,
    grossCOP: 0,
    provisionBaseCOP: 0,
    vacationProvisionBaseCOP: 0,
    pilaIbcCOP: 0,
    nonExemptPilaIbcCOP: 0,
    employerPensionCOP: 0,
    employerCajaCOP: 0,
    employerArlCOP: 0,
    employerNonExemptHealthCOP: 0,
    employerNonExemptParafiscalCOP: 0,
    employerPilaTotalCOP: 0,
    provisionCesantiasCOP: 0,
    provisionInteresesCOP: 0,
    provisionPrimaCOP: 0,
    provisionVacacionesCOP: 0,
    provisionsTotalCOP: 0,
  })

  const byCostCenter: Record<CostCenterCode, CostCenterCausationTotals> = {
    'CC-100': emptyCC('CC-100'),
    'CC-200': emptyCC('CC-200'),
    'CC-300': emptyCC('CC-300'),
    'CC-400': emptyCC('CC-400'),
  }

  for (const item of workersComputed) {
    const bucket = byCostCenter[item.costCenterCode]
    bucket.workerCount += 1
    bucket.grossCOP += item.totalGrossCOP
    // Cesantías, Intereses y Prima: salario + auxilio de transporte (sin vacaciones disfrutadas)
    bucket.provisionBaseCOP += item.periodBaseSalaryCOP + item.periodTransportCOP + item.salaryNovedadesCOP
    // Vacaciones: salario básico (Art. 192 CST excluye auxilio de transporte)
    bucket.vacationProvisionBaseCOP += item.periodBaseSalaryCOP
    bucket.pilaIbcCOP += item.pilaIbcCOP
    if (!item.art114Exempt) {
      bucket.nonExemptPilaIbcCOP += item.pilaIbcCOP
    }
  }

  for (const code of COST_CENTER_ORDER) {
    const cc = byCostCenter[code]
    cc.employerPensionCOP = Math.round(cc.pilaIbcCOP * PAYROLL_RATES.EMPLOYER_PENSION)
    cc.employerCajaCOP = Math.round(cc.pilaIbcCOP * PAYROLL_RATES.EMPLOYER_CAJA)
    cc.employerArlCOP = Math.round(cc.pilaIbcCOP * PAYROLL_RATES.EMPLOYER_ARL_WEIGHTED)
    cc.employerNonExemptHealthCOP = Math.round(
      cc.nonExemptPilaIbcCOP * PAYROLL_RATES.EMPLOYER_HEALTH,
    )
    cc.employerNonExemptParafiscalCOP = Math.round(
      cc.nonExemptPilaIbcCOP * PAYROLL_RATES.EMPLOYER_PARAFISCAL_SENA_ICBF,
    )
    cc.employerPilaTotalCOP =
      cc.employerPensionCOP +
      cc.employerCajaCOP +
      cc.employerArlCOP +
      cc.employerNonExemptHealthCOP +
      cc.employerNonExemptParafiscalCOP

    cc.provisionCesantiasCOP = Math.round(cc.provisionBaseCOP * PAYROLL_RATES.PROVISION_CESANTIAS)
    cc.provisionInteresesCOP = Math.round(cc.provisionBaseCOP * PAYROLL_RATES.PROVISION_INTERESES)
    cc.provisionPrimaCOP = Math.round(cc.provisionBaseCOP * PAYROLL_RATES.PROVISION_PRIMA)
    cc.provisionVacacionesCOP = Math.round(
      cc.vacationProvisionBaseCOP * PAYROLL_RATES.PROVISION_VACACIONES,
    )
    cc.provisionsTotalCOP =
      cc.provisionCesantiasCOP +
      cc.provisionInteresesCOP +
      cc.provisionPrimaCOP +
      cc.provisionVacacionesCOP
  }

  const totalBaseSalaryPeriodCOP = workersComputed.reduce((s, w) => s + w.periodBaseSalaryCOP, 0)
  const totalTransportPeriodCOP = workersComputed.reduce((s, w) => s + w.periodTransportCOP, 0)
  const totalNovedadesEarningsCOP = workersComputed.reduce(
    (s, w) => s + w.salaryNovedadesCOP + w.vacationNovedadesCOP,
    0,
  )
  const totalGrossCOP = workersComputed.reduce((s, w) => s + w.totalGrossCOP, 0)
  const totalPilaIbcCOP = workersComputed.reduce((s, w) => s + w.pilaIbcCOP, 0)
  const exemptPilaIbcCOP = workersComputed
    .filter((w) => w.art114Exempt)
    .reduce((s, w) => s + w.pilaIbcCOP, 0)
  const nonExemptPilaIbcCOP = totalPilaIbcCOP - exemptPilaIbcCOP
  const monthlyTaxSavingsCOP = Math.round(exemptPilaIbcCOP * PAYROLL_RATES.EMPLOYER_EXEMPT_SAVING)

  // Deducciones y neto calculados de manera consistente para preservar cuadre contable exacto
  const totalEmployeeSaludCOP = Math.round(totalPilaIbcCOP * PAYROLL_RATES.EMPLOYEE_HEALTH)
  const totalEmployeePensionCOP = Math.round(totalPilaIbcCOP * PAYROLL_RATES.EMPLOYEE_PENSION)
  const totalEmployeeDiscountsCOP = workersComputed.reduce(
    (s, w) => s + w.deductionNovedadesCOP,
    0,
  )
  const totalNetSalariesPayableCOP =
    totalGrossCOP - totalEmployeeSaludCOP - totalEmployeePensionCOP - totalEmployeeDiscountsCOP

  // Totales PILA Patronal sumados por CC (misma matriz débito/crédito → 0 diferencia de redondeo)
  const employerPensionCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerPensionCOP,
    0,
  )
  const employerCajaCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerCajaCOP,
    0,
  )
  const employerArlCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerArlCOP,
    0,
  )
  const employerNonExemptHealthCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerNonExemptHealthCOP,
    0,
  )
  const employerNonExemptParafiscalCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerNonExemptParafiscalCOP,
    0,
  )
  const totalEmployerPilaCOP =
    employerPensionCOP +
    employerCajaCOP +
    employerArlCOP +
    employerNonExemptHealthCOP +
    employerNonExemptParafiscalCOP

  const provisionCesantiasCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].provisionCesantiasCOP,
    0,
  )
  const provisionInteresesCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].provisionInteresesCOP,
    0,
  )
  const provisionPrimaCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].provisionPrimaCOP,
    0,
  )
  const provisionVacacionesCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].provisionVacacionesCOP,
    0,
  )
  const totalProvisionsCOP =
    provisionCesantiasCOP + provisionInteresesCOP + provisionPrimaCOP + provisionVacacionesCOP

  const block1DebitTotalCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].grossCOP,
    0,
  )
  const block1CreditTotalCOP =
    totalEmployeeSaludCOP +
    totalEmployeePensionCOP +
    totalEmployeeDiscountsCOP +
    totalNetSalariesPayableCOP

  const block2DebitTotalCOP = COST_CENTER_ORDER.reduce(
    (s, code) => s + byCostCenter[code].employerPilaTotalCOP + byCostCenter[code].provisionsTotalCOP,
    0,
  )
  const block2CreditTotalCOP = totalEmployerPilaCOP + totalProvisionsCOP

  return {
    period,
    ibcMode,
    art114ThresholdCOP,
    workersComputed,
    totalBaseSalaryPeriodCOP,
    totalTransportPeriodCOP,
    totalNovedadesEarningsCOP,
    totalGrossCOP,
    totalPilaIbcCOP,
    exemptPilaIbcCOP,
    nonExemptPilaIbcCOP,
    monthlyTaxSavingsCOP,
    totalEmployeeSaludCOP,
    totalEmployeePensionCOP,
    totalEmployeeDiscountsCOP,
    totalNetSalariesPayableCOP,
    byCostCenter,
    employerPensionCOP,
    employerCajaCOP,
    employerArlCOP,
    employerNonExemptHealthCOP,
    employerNonExemptParafiscalCOP,
    totalEmployerPilaCOP,
    provisionCesantiasCOP,
    provisionInteresesCOP,
    provisionPrimaCOP,
    provisionVacacionesCOP,
    totalProvisionsCOP,
    block1DebitTotalCOP,
    block1CreditTotalCOP,
    isBlock1Balanced: block1DebitTotalCOP === block1CreditTotalCOP,
    block2DebitTotalCOP,
    block2CreditTotalCOP,
    isBlock2Balanced: block2DebitTotalCOP === block2CreditTotalCOP,
  }
}

/** Calcula valor sugerido en pesos de una novedad según tipo, subtipo y cantidad */
export function calculateNovedadAmountCOP(
  workerBaseSalaryCOP: number,
  category: PayrollNovedadCategory,
  subtypeValue: string,
  quantity: number,
): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 0
  const config = NOVEDAD_CATEGORY_CONFIG[category]
  const subtype = config.subtypes.find((s) => s.value === subtypeValue)
  if (!subtype) return 0

  if (subtype.isDaily) {
    return Math.round((workerBaseSalaryCOP / PAYROLL_RATES.DAYS_IN_STANDARD_MONTH) * quantity)
  }
  if (subtype.hourlyFactor > 0) {
    const hourlyValue = workerBaseSalaryCOP / PAYROLL_RATES.MONTHLY_ORDINARY_HOURS
    return Math.round(hourlyValue * subtype.hourlyFactor * quantity)
  }
  return 0
}

/** Genera contenido plano PILA (.txt) de demostración acorde a Resolución 2388 */
export function buildPilaFlatFileContent(summary: PayrollComputedSummary): string {
  const todayIso = new Date().toISOString().slice(0, 10)
  const pad = (val: string | number, len: number) => String(val).padEnd(len, ' ').slice(0, len)
  const padNum = (val: number, len: number) => String(Math.max(0, Math.round(val))).padStart(len, '0')

  const lines: string[] = [
    '================================================================================',
    'PLANILLA INTEGRADA DE LIQUIDACIÓN DE APORTES (PILA) — ARCHIVO PLANO DEMO',
    '================================================================================',
    `Aportante        : VELAS, VELONES Y CIRIOS SAN ISAAC SAS`,
    `NIT              : 901473704-4`,
    `Periodo Nómina   : ${summary.period.label}`,
    `Configuración IBC: ${summary.ibcMode === '30d' ? '30 días estándar' : 'Días reales laborados'}`,
    `Fecha Generación : ${todayIso}`,
    `Tope Art. 114-1  : ${ART_114_1_SMMLV_LIMIT} SMMLV (${FISCAL_PARAMETERS.smmlvCOP.toLocaleString('es-CO')} COP c/u)`,
    '--------------------------------------------------------------------------------',
    'REGISTRO TIPO 01 (ENCABEZADO OPERADOR)',
    `01|0001|NI|901473704|4|VELAS VELONES Y CIRIOS SAN ISAAC SAS|${summary.period.id}|${padNum(summary.workersComputed.length, 4)}|${padNum(summary.totalPilaIbcCOP, 12)}`,
    '--------------------------------------------------------------------------------',
    'REGISTRO TIPO 02 (DETALLE COTIZANTES)',
    'SEC|COD    |TRABAJADOR                  |CC    |DIAS|IBC         |EPS       |AFP       |EXON|SALUD_4% |PENS_16% |CAJA_4%  |ARL_POND',
  ]

  summary.workersComputed.forEach((item, index) => {
    const seq = padNum(index + 1, 3)
    const empHealth = Math.round(item.pilaIbcCOP * PAYROLL_RATES.EMPLOYEE_HEALTH)
    const totalPension = Math.round(
      item.pilaIbcCOP * (PAYROLL_RATES.EMPLOYEE_PENSION + PAYROLL_RATES.EMPLOYER_PENSION),
    )
    const empCaja = Math.round(item.pilaIbcCOP * PAYROLL_RATES.EMPLOYER_CAJA)
    const empArl = Math.round(item.pilaIbcCOP * PAYROLL_RATES.EMPLOYER_ARL_WEIGHTED)
    const exon = item.art114Exempt ? 'S' : 'N'

    lines.push(
      `02|${seq}|${pad(item.worker.employeeCode, 7)}|${pad(item.worker.fullName, 28)}|${pad(item.costCenterCode, 6)}|${padNum(item.pilaDays, 2)}  |${padNum(item.pilaIbcCOP, 12)}|${pad(item.worker.eps, 10)}|${pad(item.worker.pensionFund, 10)}|  ${exon} |${padNum(empHealth, 9)}|${padNum(totalPension, 9)}|${padNum(empCaja, 9)}|${padNum(empArl, 9)}`,
    )
  })

  const totalPilaGeneral =
    summary.totalEmployeeSaludCOP + summary.totalEmployeePensionCOP + summary.totalEmployerPilaCOP

  lines.push(
    '--------------------------------------------------------------------------------',
    'REGISTRO TIPO 09 (RESUMEN SEGURIDAD SOCIAL Y PARAFISCALES)',
    `Total Cotizantes           : ${summary.workersComputed.length}`,
    `Total IBC Liquidado        : $ ${summary.totalPilaIbcCOP.toLocaleString('es-CO')} COP`,
    `Aportes Empleado (Salud 4%): $ ${summary.totalEmployeeSaludCOP.toLocaleString('es-CO')} COP`,
    `Aportes Empleado (Pens. 4%): $ ${summary.totalEmployeePensionCOP.toLocaleString('es-CO')} COP`,
    `Aportes Patronal Pensión   : $ ${summary.employerPensionCOP.toLocaleString('es-CO')} COP (12.0%)`,
    `Aportes Patronal Caja Comp.: $ ${summary.employerCajaCOP.toLocaleString('es-CO')} COP (4.0%)`,
    `Aportes Patronal ARL Pond. : $ ${summary.employerArlCOP.toLocaleString('es-CO')} COP (~1.72%)`,
    `Aportes Salud No Exentos   : $ ${summary.employerNonExemptHealthCOP.toLocaleString('es-CO')} COP`,
    `Aportes SENA/ICBF No Exent.: $ ${summary.employerNonExemptParafiscalCOP.toLocaleString('es-CO')} COP`,
    `Subtotal PILA Patronal     : $ ${summary.totalEmployerPilaCOP.toLocaleString('es-CO')} COP`,
    `Ahorro Exoneración 114-1   : $ ${summary.monthlyTaxSavingsCOP.toLocaleString('es-CO')} COP`,
    `GRAN TOTAL PLANILLA PILA   : $ ${totalPilaGeneral.toLocaleString('es-CO')} COP`,
    '================================================================================',
  )

  return lines.join('\n')
}
