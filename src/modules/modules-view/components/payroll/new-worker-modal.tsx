'use client'

import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PayrollWorker } from '@/database/schemas'
import { formatCurrency } from '@/lib/config'
import { ART_114_1_SMMLV_LIMIT, FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import {
  ARL_RISK_OPTIONS,
  COST_CENTER_ACCOUNTS,
  COST_CENTER_ORDER,
  PAYROLL_RATES,
  getArt114ThresholdCOP,
  isWorkerArt114Exempt,
  type ArlRiskCode,
  type CostCenterCode,
} from './payroll-calculations'

interface NewWorkerModalProps {
  isOpen: boolean
  nextEmployeeCode: string
  onClose: () => void
  onCreateWorker: (worker: PayrollWorker) => void
}

const CONTRACT_TYPES = [
  'Término indefinido',
  'Término fijo 1 año',
  'Obra o labor',
  'Aprendizaje SENA',
] as const

const EPS_OPTIONS = [
  'Sanitas EPS',
  'Compensar EPS',
  'Nueva EPS',
  'Salud Total',
  'Sura EPS',
  'FAMI SANAR',
] as const

const PENSION_OPTIONS = ['Porvenir', 'Protección', 'Colpensiones', 'Skandia'] as const

export function NewWorkerModal({
  isOpen,
  nextEmployeeCode,
  onClose,
  onCreateWorker,
}: NewWorkerModalProps) {
  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [contractType, setContractType] = useState<string>(CONTRACT_TYPES[0])
  const [baseSalaryRaw, setBaseSalaryRaw] = useState(String(FISCAL_PARAMETERS.smmlvCOP))
  const [hasTransportAllowance, setHasTransportAllowance] = useState<'si' | 'no'>('si')
  const [arlRisk, setArlRisk] = useState<ArlRiskCode>('II')
  const [costCenterCode, setCostCenterCode] = useState<CostCenterCode>('CC-100')
  const [eps, setEps] = useState<string>(EPS_OPTIONS[0])
  const [pensionFund, setPensionFund] = useState<string>(PENSION_OPTIONS[0])

  if (!isOpen) return null

  const parsedSalary = Number(baseSalaryRaw)
  const validSalary = Number.isFinite(parsedSalary) && parsedSalary > 0 ? Math.round(parsedSalary) : 0
  const maxTransportEligibilityCOP =
    FISCAL_PARAMETERS.smmlvCOP * PAYROLL_RATES.TRANSPORT_ALLOWANCE_SMMLV_LIMIT
  const isTransportEligibleByLaw = validSalary <= maxTransportEligibilityCOP
  const appliedTransportCOP =
    hasTransportAllowance === 'si' ? FISCAL_PARAMETERS.transportAllowanceCOP : 0
  const isExempt114 = isWorkerArt114Exempt(validSalary)
  const art114ThresholdCOP = getArt114ThresholdCOP()

  function handleSalaryChange(value: string) {
    setBaseSalaryRaw(value)
    const numeric = Number(value)
    if (Number.isFinite(numeric) && numeric > 0) {
      setHasTransportAllowance(numeric <= maxTransportEligibilityCOP ? 'si' : 'no')
    }
  }

  function resetForm() {
    setFullName('')
    setNationalId('')
    setJobTitle('')
    setContractType(CONTRACT_TYPES[0])
    setBaseSalaryRaw(String(FISCAL_PARAMETERS.smmlvCOP))
    setHasTransportAllowance('si')
    setArlRisk('II')
    setCostCenterCode('CC-100')
    setEps(EPS_OPTIONS[0])
    setPensionFund(PENSION_OPTIONS[0])
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fullName.trim() || !jobTitle.trim() || validSalary <= 0) return

    const ccConfig = COST_CENTER_ACCOUNTS[costCenterCode]
    const arlConfig = ARL_RISK_OPTIONS[arlRisk]
    const cleanDoc = nationalId.trim() || 'CC 1.072.890.*** (Guaduas, Cundinamarca)'

    const newWorker: PayrollWorker = {
      id: `pay-${Date.now()}`,
      employeeCode: nextEmployeeCode,
      fullName: fullName.trim(),
      nationalIdMasked: cleanDoc,
      jobTitle: jobTitle.trim(),
      department: ccConfig.departmentDefault,
      costCenter: ccConfig.description,
      contractType,
      baseSalaryCOP: validSalary,
      transportAllowanceCOP: appliedTransportCOP,
      smmlvBase2026: FISCAL_PARAMETERS.smmlvCOP,
      arlRiskLevel: arlConfig.fullLabel,
      art114Exempt: isExempt114,
      hireDate: new Date().toISOString(),
      eps,
      pensionFund,
      status: 'Activo',
    }

    onCreateWorker(newWorker)
    resetForm()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-new-worker"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-new-worker" className="text-base font-bold text-foreground">
              Nuevo Trabajador / Contrato ({nextEmployeeCode})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de nuevo trabajador"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-full-name" className="font-semibold text-foreground">
                Nombre Completo *
              </label>
              <Input
                id="worker-full-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Camilo Andrés Duarte Mejía"
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-doc" className="font-semibold text-foreground">
                Documento de Identidad
              </label>
              <Input
                id="worker-doc"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="Ej. CC 1.072.890.*** (Guaduas)"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-job-title" className="font-semibold text-foreground">
                Cargo *
              </label>
              <Input
                id="worker-job-title"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ej. Operario de Empaque / Asesor Comercial"
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-contract-type" className="font-semibold text-foreground">
                Tipo de Contrato *
              </label>
              <select
                id="worker-contract-type"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-base-salary" className="font-semibold text-foreground">
                Salario Básico Mensual (COP) *
              </label>
              <Input
                id="worker-base-salary"
                type="number"
                required
                min={1}
                step={1000}
                value={baseSalaryRaw}
                onChange={(e) => handleSalaryChange(e.target.value)}
                className="text-xs font-mono"
              />
              <span className="text-[11px] text-muted-foreground">
                SMMLV {FISCAL_PARAMETERS.fiscalYear}: {formatCurrency(FISCAL_PARAMETERS.smmlvCOP)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-transport" className="font-semibold text-foreground">
                Auxilio de Transporte *
              </label>
              <select
                id="worker-transport"
                value={hasTransportAllowance}
                onChange={(e) => setHasTransportAllowance(e.target.value as 'si' | 'no')}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="si">
                  Sí — {formatCurrency(FISCAL_PARAMETERS.transportAllowanceCOP)} (ref. hipotético)
                </option>
                <option value="no">No — $0 COP</option>
              </select>
              <span className="text-[11px] text-muted-foreground">
                {isTransportEligibleByLaw
                  ? `Aplica por ley (≤ 2 SMMLV: ${formatCurrency(maxTransportEligibilityCOP)})`
                  : `Supera 2 SMMLV (${formatCurrency(maxTransportEligibilityCOP)})`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-arl-risk" className="font-semibold text-foreground">
                Riesgo ARL *
              </label>
              <select
                id="worker-arl-risk"
                value={arlRisk}
                onChange={(e) => setArlRisk(e.target.value as ArlRiskCode)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.values(ARL_RISK_OPTIONS).map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.fullLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-cost-center" className="font-semibold text-foreground">
                Centro de Costos *
              </label>
              <select
                id="worker-cost-center"
                value={costCenterCode}
                onChange={(e) => setCostCenterCode(e.target.value as CostCenterCode)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {COST_CENTER_ORDER.map((code) => {
                  const cc = COST_CENTER_ACCOUNTS[code]
                  return (
                    <option key={code} value={code}>
                      {cc.shortLabel} → PUC {cc.salaryPucCode}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-eps" className="font-semibold text-foreground">
                EPS
              </label>
              <select
                id="worker-eps"
                value={eps}
                onChange={(e) => setEps(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {EPS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="worker-pension" className="font-semibold text-foreground">
                Fondo de Pensión
              </label>
              <select
                id="worker-pension"
                value={pensionFund}
                onChange={(e) => setPensionFund(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PENSION_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Devengado Mensual Base:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(validSalary + appliedTransportCOP)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Validación Art. 114-1 E.T. (&lt; {ART_114_1_SMMLV_LIMIT} SMMLV ={' '}
                {formatCurrency(art114ThresholdCOP)}):
              </span>
              <span
                className={
                  isExempt114 ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'
                }
              >
                {isExempt114 ? 'Exonerado (Salud/SENA/ICBF)' : 'No exento (aporta 13.5%)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!fullName.trim() || !jobTitle.trim() || validSalary <= 0}
              className="font-semibold"
            >
              Guardar Trabajador / Contrato
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
