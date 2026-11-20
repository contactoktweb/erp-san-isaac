'use client'

import { useId } from 'react'
import { CalendarRange } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRange {
  /** Fecha inicial en formato yyyy-MM-dd */
  from: string
  /** Fecha final en formato yyyy-MM-dd */
  to: string
}

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
  className?: string
}

/** Retorna el rango por defecto: primer día del mes actual → hoy */
export function getCurrentMonthRange(today: Date = new Date()): DateRange {
  const toIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { from: toIso(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIso(today) }
}

/** Valida que la fecha ISO (o Date) esté dentro del rango inclusivo */
export function isWithinRange(date: string | Date, range: DateRange): boolean {
  const iso = (typeof date === 'string' ? date : date.toISOString()).slice(0, 10)
  return (!range.from || iso >= range.from) && (!range.to || iso <= range.to)
}

/** Selector reutilizable de Rango de Fechas (Fecha Inicial — Fecha Final) */
export function DateRangeFilter({ value, onChange, label = 'Rango de fechas', className }: DateRangeFilterProps) {
  const fromId = useId()
  const toId = useId()
  const isInvalid = Boolean(value.from && value.to && value.from > value.to)

  return (
    <fieldset
      className={cn('flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5', className)}
      aria-invalid={isInvalid}
    >
      <legend className="sr-only">{label}</legend>
      <CalendarRange className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <label htmlFor={fromId} className="text-[0.6875rem] font-medium text-muted-foreground">
        Desde
      </label>
      <input
        id={fromId}
        type="date"
        value={value.from}
        max={value.to || undefined}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className="h-7 rounded border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <label htmlFor={toId} className="text-[0.6875rem] font-medium text-muted-foreground">
        Hasta
      </label>
      <input
        id={toId}
        type="date"
        value={value.to}
        min={value.from || undefined}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className="h-7 rounded border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      {isInvalid && <span className="text-[0.6875rem] font-medium text-destructive">Rango inválido</span>}
    </fieldset>
  )
}

