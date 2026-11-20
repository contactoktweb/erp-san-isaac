'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  Pencil,
  Percent,
  Plus,
  Power,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatNumber } from '@/lib/config'
import { FISCAL_PARAMETERS, uvtToPesos } from '@/lib/fiscal-parameters'

export type TaxCategory =
  | 'IVA'
  | 'Retefuente'
  | 'ReteIVA'
  | 'Autorretención'
  | 'ReteICA'
  | 'Otro'

export interface TaxBaseVariant {
  label: string
  uvt: number
}

export interface TaxRateVariant {
  label?: string
  ratePercent: number
}

export interface TaxRule {
  id: string
  code: string
  concept: string
  taxType: TaxCategory
  municipality: string
  baseUvt: number
  baseVariants?: TaxBaseVariant[]
  rates: TaxRateVariant[]
  rateNote?: string
  debitAccount: string
  debitDescription?: string
  creditAccount: string
  creditDescription?: string
  isActive: boolean
}

export interface TaxAuditPayload {
  action: 'TAX_RULE_CREATED' | 'TAX_RULE_UPDATED' | 'TAX_RULE_TOGGLED' | 'UVT_UPDATED'
  entityId: string
  details: string
}

interface TaxMatrixTabProps {
  uvtValue: number
  onUvtChange: (nextUvt: number) => void
  taxRules: TaxRule[]
  onTaxRulesChange: React.Dispatch<React.SetStateAction<TaxRule[]>>
  onAuditEvent?: (event: TaxAuditPayload) => void
}

const REFERENCE_UVT_EXAMPLES = [10, 2] as const

export const INITIAL_TAX_RULES: TaxRule[] = [
  {
    id: 'tax-01',
    code: 'IVA-GEN-19',
    concept: 'IVA General',
    taxType: 'IVA',
    municipality: 'Nacional',
    baseUvt: 0,
    rates: [{ ratePercent: 19 }],
    debitAccount: '240802',
    debitDescription: 'IVA Descontable',
    creditAccount: '240801',
    creditDescription: 'IVA Generado',
    isActive: true,
  },
  {
    id: 'tax-02',
    code: 'RET-COM-DEC',
    concept: 'Retefuente Compras (Declarantes)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 10,
    rates: [{ ratePercent: 2.5 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236540',
    creditDescription: 'Retefuente Compras',
    isActive: true,
  },
  {
    id: 'tax-03',
    code: 'RET-COM-ND',
    concept: 'Retefuente Compras (No declarantes)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 10,
    rates: [{ ratePercent: 3.5 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236540',
    creditDescription: 'Retefuente Compras',
    isActive: true,
  },
  {
    id: 'tax-04',
    code: 'RET-TAR-1.5',
    concept: 'Retefuente Tarjeta débito/crédito',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 0,
    rates: [{ ratePercent: 1.5 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236540',
    creditDescription: 'Retefuente Compras',
    isActive: true,
  },
  {
    id: 'tax-05',
    code: 'RET-SER-DEC',
    concept: 'Retefuente Servicios (Declarantes)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 2,
    rates: [{ ratePercent: 4 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236525',
    creditDescription: 'Retefuente Servicios',
    isActive: true,
  },
  {
    id: 'tax-06',
    code: 'RET-SER-ND',
    concept: 'Retefuente Servicios (No declarantes)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 2,
    rates: [{ ratePercent: 6 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236525',
    creditDescription: 'Retefuente Servicios',
    isActive: true,
  },
  {
    id: 'tax-07',
    code: 'RET-TRP-1',
    concept: 'Retefuente Transporte de carga',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 2,
    rates: [{ ratePercent: 1 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236525',
    creditDescription: 'Retefuente Servicios',
    isActive: true,
  },
  {
    id: 'tax-08',
    code: 'RET-ARR-3.5',
    concept: 'Retefuente Arrendamiento inmuebles',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 10,
    rates: [{ ratePercent: 3.5 }],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236535',
    creditDescription: 'Retefuente Arrendamientos',
    isActive: true,
  },
  {
    id: 'tax-09',
    code: 'RET-HON-10-11',
    concept: 'Retefuente Honorarios (10% ND / 11% D)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseUvt: 0,
    rates: [
      { label: 'ND', ratePercent: 10 },
      { label: 'D', ratePercent: 11 },
    ],
    debitAccount: '135515',
    debitDescription: 'Anticipo Retefuente',
    creditAccount: '236515',
    creditDescription: 'Retefuente Honorarios',
    isActive: true,
  },
  {
    id: 'tax-10',
    code: 'RIVA-15',
    concept: 'ReteIVA (15% del IVA)',
    taxType: 'ReteIVA',
    municipality: 'Nacional',
    baseUvt: 10,
    baseVariants: [
      { label: 'Comp.', uvt: 10 },
      { label: 'Serv.', uvt: 2 },
    ],
    rates: [{ ratePercent: 15 }],
    rateNote: 'del IVA',
    debitAccount: '135517',
    debitDescription: 'IVA Retenido a favor',
    creditAccount: '236701',
    creditDescription: 'Impuesto a las Ventas Retenido',
    isActive: true,
  },
  {
    id: 'tax-11',
    code: 'AUT-REN-0.4',
    concept: 'Autorretención Especial Renta (Dec. 1625)',
    taxType: 'Autorretención',
    municipality: 'Nacional',
    baseUvt: 0,
    rates: [{ ratePercent: 0.4 }],
    debitAccount: '135595',
    debitDescription: 'Otros Anticipos Autorretención',
    creditAccount: '236575',
    creditDescription: 'Autorretenciones por Pagar',
    isActive: true,
  },
  {
    id: 'tax-12',
    code: 'ICA-GUADUAS',
    concept: 'ICA / ReteICA Guaduas (Ind 0,4 / Com 0,7 / Serv 0,8)',
    taxType: 'ReteICA',
    municipality: 'Guaduas',
    baseUvt: 10,
    baseVariants: [
      { label: 'Comp.', uvt: 10 },
      { label: 'Serv.', uvt: 2 },
    ],
    rates: [
      { label: 'Ind', ratePercent: 0.4 },
      { label: 'Com', ratePercent: 0.7 },
      { label: 'Serv', ratePercent: 0.8 },
    ],
    debitAccount: '135518',
    debitDescription: 'ICA Retenido a favor',
    creditAccount: '236801 / 236802 / 236803',
    creditDescription: 'Ind. / Com. / Serv. Guaduas',
    isActive: true,
  },
]

interface TaxFormState {
  code: string
  concept: string
  taxType: TaxCategory
  municipality: string
  baseMode: 'single' | 'variants'
  baseUvt: string
  baseVariants: Array<{ label: string; uvt: string }>
  rates: Array<{ label: string; ratePercent: string }>
  rateNote: string
  debitAccount: string
  debitDescription: string
  creditAccount: string
  creditDescription: string
}

function createEmptyTaxForm(): TaxFormState {
  return {
    code: '',
    concept: '',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseMode: 'single',
    baseUvt: '10',
    baseVariants: [
      { label: 'Comp.', uvt: '10' },
      { label: 'Serv.', uvt: '2' },
    ],
    rates: [{ label: '', ratePercent: '' }],
    rateNote: '',
    debitAccount: '135515',
    debitDescription: '',
    creditAccount: '236540',
    creditDescription: '',
  }
}

function mapRuleToForm(rule: TaxRule): TaxFormState {
  const hasBaseVariants = Boolean(rule.baseVariants && rule.baseVariants.length > 0)
  return {
    code: rule.code,
    concept: rule.concept,
    taxType: rule.taxType,
    municipality: rule.municipality,
    baseMode: hasBaseVariants ? 'variants' : 'single',
    baseUvt: String(rule.baseUvt),
    baseVariants: hasBaseVariants
      ? rule.baseVariants!.map((v) => ({ label: v.label, uvt: String(v.uvt) }))
      : [
          { label: 'Comp.', uvt: '10' },
          { label: 'Serv.', uvt: '2' },
        ],
    rates: rule.rates.map((r) => ({ label: r.label ?? '', ratePercent: String(r.ratePercent) })),
    rateNote: rule.rateNote ?? '',
    debitAccount: rule.debitAccount,
    debitDescription: rule.debitDescription ?? '',
    creditAccount: rule.creditAccount,
    creditDescription: rule.creditDescription ?? '',
  }
}

function formatBaseUvt(rule: TaxRule): string {
  if (rule.baseVariants && rule.baseVariants.length > 0) {
    return rule.baseVariants.map((v) => `${formatNumber(v.uvt)} ${v.label}`).join(' / ')
  }
  return rule.baseUvt === 0 ? '0 UVT' : `${formatNumber(rule.baseUvt)} UVT`
}

function formatBasePesos(rule: TaxRule, uvtCOP: number): string {
  if (rule.baseVariants && rule.baseVariants.length > 0) {
    return rule.baseVariants
      .map((v) => `$${formatNumber(uvtToPesos(v.uvt, uvtCOP))} ${v.label}`)
      .join(' / ')
  }
  return `$${formatNumber(uvtToPesos(rule.baseUvt, uvtCOP))}`
}

function formatRates(rates: TaxRateVariant[]): string {
  return rates.map((r) => `${formatNumber(r.ratePercent)}%`).join(' / ')
}

function formatRateVariantLabels(rates: TaxRateVariant[]): string | null {
  const labels = rates.map((r) => r.label?.trim()).filter((l): l is string => Boolean(l))
  return labels.length > 0 ? labels.join(' / ') : null
}

function generateTaxCode(concept: string, taxType: TaxCategory): string {
  const prefix = taxType.slice(0, 3).toUpperCase()
  const slug = concept
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 10)
    .toUpperCase()
  return slug ? `${prefix}-${slug}` : `${prefix}-${Date.now().toString().slice(-4)}`
}

export function TaxMatrixTab({
  uvtValue,
  onUvtChange,
  taxRules,
  onTaxRulesChange,
  onAuditEvent,
}: TaxMatrixTabProps) {
  const [uvtInput, setUvtInput] = useState<string>(String(uvtValue))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Estado del modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [formState, setFormState] = useState<TaxFormState>(createEmptyTaxForm)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!isModalOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  const effectiveUvt = uvtValue
  const parsedUvt = Number(uvtInput)
  const isUvtInputValid = Number.isFinite(parsedUvt) && parsedUvt > 0
  const isUvtModified = effectiveUvt !== FISCAL_PARAMETERS.uvtCOP

  function handleUvtChange(value: string) {
    setUvtInput(value)
    const next = Number(value)
    if (Number.isFinite(next) && next > 0) {
      onUvtChange(Math.round(next))
    }
  }

  function handleUvtBlur() {
    if (!isUvtInputValid) {
      setUvtInput(String(effectiveUvt))
      toast.error('La UVT debe ser un valor numérico mayor a $0. Se restauró el último valor válido.')
      return
    }
    const rounded = Math.round(parsedUvt)
    setUvtInput(String(rounded))
    if (rounded !== FISCAL_PARAMETERS.uvtCOP) {
      onAuditEvent?.({
        action: 'UVT_UPDATED',
        entityId: 'fiscal-uvt',
        details: `Valor UVT simulado actualizado en Matriz de Impuestos a $${formatNumber(rounded)} COP`,
      })
    }
  }

  function handleResetUvt() {
    onUvtChange(FISCAL_PARAMETERS.uvtCOP)
    setUvtInput(String(FISCAL_PARAMETERS.uvtCOP))
    toast.info(`UVT ${FISCAL_PARAMETERS.fiscalYear} restablecida al valor oficial ($${formatNumber(FISCAL_PARAMETERS.uvtCOP)})`)
  }

  function openCreateModal() {
    setEditingRuleId(null)
    setFormState(createEmptyTaxForm())
    setFormError(null)
    setIsModalOpen(true)
  }

  function openEditModal(rule: TaxRule) {
    setEditingRuleId(rule.id)
    setFormState(mapRuleToForm(rule))
    setFormError(null)
    setIsModalOpen(true)
  }

  function handleToggleRuleStatus(rule: TaxRule) {
    const nextActive = !rule.isActive
    onTaxRulesChange((prev) =>
      prev.map((item) => (item.id === rule.id ? { ...item, isActive: nextActive } : item))
    )
    toast.success(
      `Concepto "${rule.concept}" ${nextActive ? 'activado' : 'desactivado'} en la matriz tributaria`
    )
    onAuditEvent?.({
      action: 'TAX_RULE_TOGGLED',
      entityId: rule.id,
      details: `Concepto tributario "${rule.concept}" cambiado a estado ${nextActive ? 'ACTIVO' : 'INACTIVO'}`,
    })
  }

  function handleSaveRule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    const concept = formState.concept.trim()
    const municipality = formState.municipality.trim() || 'Nacional'
    const debitAccount = formState.debitAccount.trim()
    const creditAccount = formState.creditAccount.trim()

    if (concept.length < 3) {
      setFormError('El concepto tributario debe tener al menos 3 caracteres.')
      return
    }
    if (debitAccount.length < 4 || creditAccount.length < 4) {
      setFormError('Las cuentas PUC Débito y Crédito son obligatorias (mínimo 4 dígitos).')
      return
    }

    let parsedBaseUvt = 0
    let parsedBaseVariants: TaxBaseVariant[] | undefined

    if (formState.baseMode === 'single') {
      const val = Number(formState.baseUvt)
      if (!Number.isFinite(val) || val < 0) {
        setFormError('La base mínima en UVT debe ser un número mayor o igual a 0.')
        return
      }
      parsedBaseUvt = val
    } else {
      const variants: TaxBaseVariant[] = []
      for (const variant of formState.baseVariants) {
        const label = variant.label.trim()
        const uvt = Number(variant.uvt)
        if (!label || !Number.isFinite(uvt) || uvt < 0) {
          setFormError('Cada variante de base debe tener etiqueta (ej. Comp., Serv.) y UVT >= 0.')
          return
        }
        variants.push({ label, uvt })
      }
      if (variants.length === 0) {
        setFormError('Agrega al menos una variante de base en UVT.')
        return
      }
      parsedBaseVariants = variants
      parsedBaseUvt = variants[0].uvt
    }

    const parsedRates: TaxRateVariant[] = []
    for (const rate of formState.rates) {
      const num = Number(rate.ratePercent.replace(',', '.'))
      if (!Number.isFinite(num) || num <= 0 || num > 100) {
        setFormError('Todas las tarifas deben ser valores numéricos entre 0,01% y 100%.')
        return
      }
      const trimmedLabel = rate.label.trim()
      parsedRates.push({
        ratePercent: num,
        ...(trimmedLabel ? { label: trimmedLabel } : {}),
      })
    }

    if (parsedRates.length === 0) {
      setFormError('Debe existir al menos una tarifa porcentual.')
      return
    }

    const finalCode = formState.code.trim() || generateTaxCode(concept, formState.taxType)
    const rateNote = formState.rateNote.trim() || undefined
    const debitDescription = formState.debitDescription.trim() || undefined
    const creditDescription = formState.creditDescription.trim() || undefined

    if (editingRuleId) {
      onTaxRulesChange((prev) =>
        prev.map((item) =>
          item.id === editingRuleId
            ? {
                ...item,
                code: finalCode,
                concept,
                taxType: formState.taxType,
                municipality,
                baseUvt: parsedBaseUvt,
                baseVariants: parsedBaseVariants,
                rates: parsedRates,
                rateNote,
                debitAccount,
                debitDescription,
                creditAccount,
                creditDescription,
              }
            : item
        )
      )
      toast.success(`Concepto "${concept}" actualizado correctamente`)
      onAuditEvent?.({
        action: 'TAX_RULE_UPDATED',
        entityId: editingRuleId,
        details: `Concepto tributario editado: ${concept} (Tarifa ${formatRates(parsedRates)}, Débito ${debitAccount}, Crédito ${creditAccount})`,
      })
    } else {
      const newId = `tax-${Date.now()}`
      const newRule: TaxRule = {
        id: newId,
        code: finalCode,
        concept,
        taxType: formState.taxType,
        municipality,
        baseUvt: parsedBaseUvt,
        baseVariants: parsedBaseVariants,
        rates: parsedRates,
        rateNote,
        debitAccount,
        debitDescription,
        creditAccount,
        creditDescription,
        isActive: true,
      }
      onTaxRulesChange((prev) => [...prev, newRule])
      toast.success(`Concepto "${concept}" creado en la matriz tributaria`)
      onAuditEvent?.({
        action: 'TAX_RULE_CREATED',
        entityId: newId,
        details: `Nuevo concepto tributario creado: ${concept} (Base ${formatBaseUvt(newRule)}, Tarifa ${formatRates(parsedRates)})`,
      })
    }

    setIsModalOpen(false)
    setEditingRuleId(null)
  }

  const filteredRules = taxRules.filter((rule) => {
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      rule.concept.toLowerCase().includes(q) ||
      rule.code.toLowerCase().includes(q) ||
      rule.taxType.toLowerCase().includes(q) ||
      rule.municipality.toLowerCase().includes(q) ||
      rule.debitAccount.toLowerCase().includes(q) ||
      rule.creditAccount.toLowerCase().includes(q)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && rule.isActive) ||
      (statusFilter === 'inactive' && !rule.isActive)

    return matchesSearch && matchesStatus
  })

  const activeCount = taxRules.filter((r) => r.isActive).length

  return (
    <section aria-labelledby="heading-tax-matrix" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-50/50 p-3.5 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="heading-tax-matrix" className="text-sm font-bold text-foreground">
            Matriz Tributaria y Retenciones ({FISCAL_PARAMETERS.fiscalYear})
          </h3>
          <span className="font-mono text-[0.6875rem] font-medium text-amber-900/80 dark:text-amber-300/90">
            {activeCount} de {taxRules.length} conceptos activos
          </span>
        </div>
        <p className="leading-relaxed">
          <strong>Regla Condicional de Base Mínima:</strong> SI Subtotal &ge; Base Mínima ($) &rarr;
          Aplicar tarifa parametrizada; SI NO &rarr; Liquidación $0.{' '}
          <span className="font-mono">
            Base Mínima ($) = REDONDEAR(Base_UVT &times; Valor_UVT, -3)
          </span>
          . Débito = <span className="font-mono">1355xx</span> activo a favor (240802 IVA descontable);
          Crédito = <span className="font-mono">2365/2367/2368</span> pasivo por pagar (240801 IVA generado).
        </p>
      </div>

      {/* Control editable de Valor UVT Vigente + Barra de búsqueda y botón Crear */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="uvt-vigente-input" className="text-xs font-semibold text-foreground">
              <Calculator className="size-3.5 text-primary" aria-hidden="true" />
              Valor UVT Vigente ({FISCAL_PARAMETERS.fiscalYear}) — COP
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative w-44">
                <span className="pointer-events-none absolute left-2.5 top-2 text-xs font-mono text-muted-foreground">
                  $
                </span>
                <Input
                  id="uvt-vigente-input"
                  type="number"
                  min={1}
                  step={1}
                  value={uvtInput}
                  onChange={(e) => handleUvtChange(e.target.value)}
                  onBlur={handleUvtBlur}
                  aria-describedby="uvt-live-examples"
                  className="pl-6 font-mono text-xs font-semibold"
                />
              </div>
              {isUvtModified && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetUvt}
                  className="h-9 text-xs gap-1.5"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Oficial (${formatNumber(FISCAL_PARAMETERS.uvtCOP)})
                </Button>
              )}
            </div>
            {!isUvtInputValid && (
              <p role="alert" className="text-[0.6875rem] font-medium text-rose-600 dark:text-rose-400">
                Ingrese un valor numérico válido mayor a 0.
              </p>
            )}
          </div>

          <div
            id="uvt-live-examples"
            className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-muted-foreground pb-1"
          >
            {REFERENCE_UVT_EXAMPLES.map((uvtCount) => (
              <span
                key={uvtCount}
                className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 font-mono"
              >
                <span className="text-muted-foreground">{uvtCount} UVT =</span>
                <strong className="text-foreground">
                  ${formatNumber(uvtToPesos(uvtCount, effectiveUvt))}
                </strong>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="tax-search-input"
              type="text"
              aria-label="Buscar concepto tributario, código o cuenta PUC"
              placeholder="Buscar concepto, código o PUC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            aria-label="Filtrar por estado de concepto tributario"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all">Todos ({taxRules.length})</option>
            <option value="active">Activos ({activeCount})</option>
            <option value="inactive">Inactivos ({taxRules.length - activeCount})</option>
          </select>

          <Button
            type="button"
            size="sm"
            onClick={openCreateModal}
            className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Nuevo Concepto
          </Button>
        </div>
      </div>

      {/* Tabla CRUD de Matriz de Impuestos */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">#</th>
              <th scope="col" className="px-3 py-2.5">Concepto</th>
              <th scope="col" className="px-3 py-2.5">Base UVT</th>
              <th scope="col" className="px-3 py-2.5 text-right">Base ($)</th>
              <th scope="col" className="px-3 py-2.5 text-right">Tarifa %</th>
              <th scope="col" className="px-3 py-2.5">Débito (1355xx)</th>
              <th scope="col" className="px-3 py-2.5">Crédito (2365/2367/2368)</th>
              <th scope="col" className="px-3 py-2.5">Estado</th>
              <th scope="col" className="px-3 py-2.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No se encontraron conceptos tributarios que coincidan con el filtro aplicado.
                </td>
              </tr>
            ) : (
              filteredRules.map((rule, index) => {
                const rateVariantLabel = formatRateVariantLabels(rule.rates)
                return (
                  <tr
                    key={rule.id}
                    className={`transition-colors hover:bg-muted/30 ${
                      rule.isActive ? '' : 'bg-muted/20 opacity-60'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">{rule.concept}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
                        <span className="font-mono">{rule.code}</span>
                        <span>&middot;</span>
                        <Badge variant="outline" className="px-1.5 py-0 text-[0.625rem]">
                          {rule.taxType}
                        </Badge>
                        {rule.municipality !== 'Nacional' && (
                          <Badge variant="muted" className="px-1.5 py-0 text-[0.625rem]">
                            {rule.municipality}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-foreground whitespace-nowrap">
                      <div>{formatBaseUvt(rule)}</div>
                      {!rule.baseVariants && rule.baseUvt === 0 && (
                        <div className="text-[0.625rem] text-muted-foreground">Desde $1</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground whitespace-nowrap">
                      {formatBasePesos(rule, effectiveUvt)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono whitespace-nowrap">
                      <div className="font-bold text-foreground">{formatRates(rule.rates)}</div>
                      {(rateVariantLabel || rule.rateNote) && (
                        <div className="text-[0.625rem] text-muted-foreground">
                          {rateVariantLabel ?? rule.rateNote}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <div className="font-semibold text-foreground">{rule.debitAccount}</div>
                      {rule.debitDescription && (
                        <div className="font-sans text-[0.6875rem] text-muted-foreground">
                          {rule.debitDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <div className="font-semibold text-foreground">{rule.creditAccount}</div>
                      {rule.creditDescription && (
                        <div className="font-sans text-[0.6875rem] text-muted-foreground">
                          {rule.creditDescription}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={rule.isActive ? 'success' : 'muted'}
                        className="text-[0.6875rem]"
                      >
                        {rule.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(rule)}
                          title={`Editar ${rule.concept}`}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleRuleStatus(rule)}
                          title={
                            rule.isActive ? 'Desactivar concepto tributario' : 'Activar concepto tributario'
                          }
                          className={`h-7 px-2 text-xs gap-1 ${
                            rule.isActive
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                          }`}
                        >
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">
                            {rule.isActive ? 'Desactivar' : 'Activar'}
                          </span>
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

      {/* Modal Crear / Editar Concepto Tributario */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-tax"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Percent className="size-4 text-primary" aria-hidden="true" />
                <h3 id="modal-title-tax" className="text-base font-bold text-foreground">
                  {editingRuleId ? 'Editar Concepto Tributario' : 'Nuevo Concepto Tributario'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar ventana de concepto tributario"
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="flex flex-col gap-4 text-xs">
              {formError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-700 dark:text-rose-300"
                >
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="tax-concept" className="text-xs font-semibold text-foreground">
                    Concepto Tributario *
                  </Label>
                  <Input
                    id="tax-concept"
                    required
                    placeholder="Ej. Retefuente Compras (Declarantes)"
                    value={formState.concept}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, concept: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tax-code" className="text-xs font-semibold text-foreground">
                    Código Interno
                  </Label>
                  <Input
                    id="tax-code"
                    placeholder="Auto si se deja vacío"
                    value={formState.code}
                    onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tax-type" className="text-xs font-semibold text-foreground">
                    Tipo de Tributo *
                  </Label>
                  <select
                    id="tax-type"
                    value={formState.taxType}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        taxType: e.target.value as TaxCategory,
                      }))
                    }
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="IVA">IVA</option>
                    <option value="Retefuente">Retefuente</option>
                    <option value="ReteIVA">ReteIVA</option>
                    <option value="Autorretención">Autorretención</option>
                    <option value="ReteICA">ReteICA</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="tax-municipality"
                    className="text-xs font-semibold text-foreground"
                  >
                    Jurisdicción / Municipio *
                  </Label>
                  <Input
                    id="tax-municipality"
                    required
                    placeholder="Nacional o Guaduas"
                    value={formState.municipality}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, municipality: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Base UVT (Única o Variantes Compras/Servicios) */}
              <div className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    Base Mínima en UVT (UVT actual: ${formatNumber(effectiveUvt)})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={formState.baseMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setFormState((prev) => ({ ...prev, baseMode: 'single' }))}
                      className="h-7 text-[0.6875rem]"
                    >
                      Base única
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={formState.baseMode === 'variants' ? 'default' : 'outline'}
                      onClick={() => setFormState((prev) => ({ ...prev, baseMode: 'variants' }))}
                      className="h-7 text-[0.6875rem]"
                    >
                      Variantes (Comp. / Serv.)
                    </Button>
                  </div>
                </div>

                {formState.baseMode === 'single' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-end">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tax-base-uvt" className="text-xs font-medium text-foreground">
                        Base Mínima (UVT) *
                      </Label>
                      <Input
                        id="tax-base-uvt"
                        type="number"
                        min={0}
                        step="0.5"
                        required
                        value={formState.baseUvt}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, baseUvt: e.target.value }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                      Base calculada:{' '}
                      <strong className="text-foreground">
                        ${formatNumber(uvtToPesos(Number(formState.baseUvt) || 0, effectiveUvt))}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {formState.baseVariants.map((variant, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <Label htmlFor={`base-var-label-${idx}`} className="sr-only">
                            Etiqueta de base {idx + 1}
                          </Label>
                          <Input
                            id={`base-var-label-${idx}`}
                            placeholder="Ej. Comp. o Serv."
                            value={variant.label}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                baseVariants: prev.baseVariants.map((v, i) =>
                                  i === idx ? { ...v, label: e.target.value } : v
                                ),
                              }))
                            }
                            className="text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <Label htmlFor={`base-var-uvt-${idx}`} className="sr-only">
                            UVT de base {idx + 1}
                          </Label>
                          <Input
                            id={`base-var-uvt-${idx}`}
                            type="number"
                            min={0}
                            step="0.5"
                            placeholder="UVT"
                            value={variant.uvt}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                baseVariants: prev.baseVariants.map((v, i) =>
                                  i === idx ? { ...v, uvt: e.target.value } : v
                                ),
                              }))
                            }
                            className="font-mono text-xs"
                          />
                        </div>
                        <div className="col-span-4 font-mono text-[0.6875rem] text-muted-foreground">
                          = ${formatNumber(uvtToPesos(Number(variant.uvt) || 0, effectiveUvt))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {formState.baseVariants.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              aria-label={`Eliminar variante de base ${idx + 1}`}
                              onClick={() =>
                                setFormState((prev) => ({
                                  ...prev,
                                  baseVariants: prev.baseVariants.filter((_, i) => i !== idx),
                                }))
                              }
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          baseVariants: [...prev.baseVariants, { label: '', uvt: '0' }],
                        }))
                      }
                      className="self-start h-7 text-[0.6875rem] gap-1"
                    >
                      <Plus className="size-3" aria-hidden="true" />
                      Agregar variante de base
                    </Button>
                  </div>
                )}
              </div>

              {/* Tarifas múltiples */}
              <div className="rounded-lg border bg-muted/20 p-3 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">Tarifas Aplicables (%) *</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        rates: [...prev.rates, { label: '', ratePercent: '' }],
                      }))
                    }
                    className="h-7 text-[0.6875rem] gap-1"
                  >
                    <Plus className="size-3" aria-hidden="true" />
                    Agregar variante de tarifa
                  </Button>
                </div>

                {formState.rates.map((rate, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Label htmlFor={`rate-label-${idx}`} className="sr-only">
                        Etiqueta de tarifa {idx + 1}
                      </Label>
                      <Input
                        id={`rate-label-${idx}`}
                        placeholder="Etiqueta opcional (ej. ND, D, Ind)"
                        value={rate.label}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            rates: prev.rates.map((r, i) =>
                              i === idx ? { ...r, label: e.target.value } : r
                            ),
                          }))
                        }
                        className="text-xs"
                      />
                    </div>
                    <div className="col-span-6 relative">
                      <Label htmlFor={`rate-percent-${idx}`} className="sr-only">
                        Porcentaje de tarifa {idx + 1}
                      </Label>
                      <Input
                        id={`rate-percent-${idx}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="100"
                        required
                        placeholder="Ej. 2.5"
                        value={rate.ratePercent}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            rates: prev.rates.map((r, i) =>
                              i === idx ? { ...r, ratePercent: e.target.value } : r
                            ),
                          }))
                        }
                        className="pr-7 font-mono text-xs"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {formState.rates.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Eliminar tarifa ${idx + 1}`}
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              rates: prev.rates.filter((_, i) => i !== idx),
                            }))
                          }
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col gap-1.5 mt-1">
                  <Label htmlFor="tax-rate-note" className="text-xs font-medium text-muted-foreground">
                    Nota sobre base de aplicación (opcional, ej. &ldquo;del IVA&rdquo;)
                  </Label>
                  <Input
                    id="tax-rate-note"
                    placeholder="Ej. del IVA"
                    value={formState.rateNote}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, rateNote: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Cuentas PUC Débito y Crédito */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tax-debit-puc" className="text-xs font-semibold text-foreground">
                    Cuenta PUC Débito (1355xx / Activo) *
                  </Label>
                  <Input
                    id="tax-debit-puc"
                    required
                    placeholder="Ej. 135515"
                    value={formState.debitAccount}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, debitAccount: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    aria-label="Descripción cuenta PUC Débito"
                    placeholder="Descripción opcional (ej. Anticipo Retefuente)"
                    value={formState.debitDescription}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, debitDescription: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tax-credit-puc" className="text-xs font-semibold text-foreground">
                    Cuenta PUC Crédito (2365/2367/2368 Pasivo) *
                  </Label>
                  <Input
                    id="tax-credit-puc"
                    required
                    placeholder="Ej. 236540 o 236801 / 236802 / 236803"
                    value={formState.creditAccount}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, creditAccount: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    aria-label="Descripción cuenta PUC Crédito"
                    placeholder="Descripción opcional (ej. Retefuente Compras)"
                    value={formState.creditDescription}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, creditDescription: e.target.value }))
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-semibold">
                  {editingRuleId ? 'Guardar Cambios' : 'Crear Concepto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
