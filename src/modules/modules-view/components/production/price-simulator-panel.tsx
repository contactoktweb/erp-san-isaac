'use client'

import { useState } from 'react'
import { AlertCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/config'
import {
  MAX_MARGIN_PERCENT,
  MIN_MARGIN_PERCENT,
  MIN_PROFITABLE_MARGIN_PERCENT,
  calculatePriceWithIva,
  calculatePriceWithoutIva,
  type SalesChannelKey,
} from './production-types'

interface ChannelConfig {
  key: SalesChannelKey
  title: string
  priceColorClass: string
  accentClass: string
}

const CHANNELS: ChannelConfig[] = [
  {
    key: 'detal',
    title: '1. Venta Detal / Mostrador',
    priceColorClass: 'text-emerald-600 dark:text-emerald-400',
    accentClass: 'accent-primary',
  },
  {
    key: 'mayoreo',
    title: '2. Venta Mayoreo / Parroquias',
    priceColorClass: 'text-sky-600 dark:text-sky-400',
    accentClass: 'accent-sky-500',
  },
  {
    key: 'distribuidor',
    title: '3. Distribuidor / Gran Volumen',
    priceColorClass: 'text-indigo-600 dark:text-indigo-400',
    accentClass: 'accent-indigo-500',
  },
]

interface PriceSimulatorPanelProps {
  totalUnitCost: number
}

export function PriceSimulatorPanel({ totalUnitCost }: PriceSimulatorPanelProps) {
  const [margins, setMargins] = useState<Record<SalesChannelKey, number>>({
    detal: 60,
    mayoreo: 35,
    distribuidor: 20,
  })
  const [draftInputs, setDraftInputs] = useState<Record<SalesChannelKey, string>>({
    detal: '60',
    mayoreo: '35',
    distribuidor: '20',
  })
  const [rangeErrors, setRangeErrors] = useState<Record<SalesChannelKey, string | null>>({
    detal: null,
    mayoreo: null,
    distribuidor: null,
  })

  function handleSliderChange(key: SalesChannelKey, rawValue: string) {
    const num = Number(rawValue)
    if (!Number.isFinite(num)) return
    const clamped = Math.min(MAX_MARGIN_PERCENT, Math.max(MIN_MARGIN_PERCENT, num))
    setMargins((prev) => ({ ...prev, [key]: clamped }))
    setDraftInputs((prev) => ({ ...prev, [key]: String(clamped) }))
    setRangeErrors((prev) => ({ ...prev, [key]: null }))
  }

  function handleTypedMarginChange(key: SalesChannelKey, rawText: string) {
    setDraftInputs((prev) => ({ ...prev, [key]: rawText }))

    if (rawText.trim() === '') {
      setRangeErrors((prev) => ({
        ...prev,
        [key]: `Ingrese un margen entre ${MIN_MARGIN_PERCENT}% y ${MAX_MARGIN_PERCENT}%.`,
      }))
      return
    }

    const parsed = Number(rawText)
    if (!Number.isFinite(parsed)) {
      setRangeErrors((prev) => ({
        ...prev,
        [key]: `Valor inválido. Use un número entre ${MIN_MARGIN_PERCENT} y ${MAX_MARGIN_PERCENT}.`,
      }))
      return
    }

    if (parsed < MIN_MARGIN_PERCENT || parsed > MAX_MARGIN_PERCENT) {
      setRangeErrors((prev) => ({
        ...prev,
        [key]: `Margen fuera de rango (${MIN_MARGIN_PERCENT}% a ${MAX_MARGIN_PERCENT}%).`,
      }))
      const clamped = Math.min(MAX_MARGIN_PERCENT, Math.max(MIN_MARGIN_PERCENT, parsed))
      setMargins((prev) => ({ ...prev, [key]: clamped }))
      return
    }

    setRangeErrors((prev) => ({ ...prev, [key]: null }))
    setMargins((prev) => ({ ...prev, [key]: parsed }))
  }

  function handleTypedMarginBlur(key: SalesChannelKey) {
    const raw = draftInputs[key].trim()
    if (raw === '' || !Number.isFinite(Number(raw))) {
      setDraftInputs((prev) => ({ ...prev, [key]: String(margins[key]) }))
      setRangeErrors((prev) => ({ ...prev, [key]: null }))
      return
    }
    const parsed = Number(raw)
    const clamped = Math.min(MAX_MARGIN_PERCENT, Math.max(MIN_MARGIN_PERCENT, parsed))
    setMargins((prev) => ({ ...prev, [key]: clamped }))
    setDraftInputs((prev) => ({ ...prev, [key]: String(clamped) }))
    setRangeErrors((prev) => ({ ...prev, [key]: null }))
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b pb-2">
        <h4 className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" /> Panel C — Simulador de Precios
        </h4>
        <Badge variant="outline" className="text-[0.625rem]">
          Precio = Costo / (1 - Margen)
        </Badge>
      </div>

      <div className="mt-1 flex flex-col gap-3 text-xs">
        {CHANNELS.map((channel) => {
          const margin = margins[channel.key]
          const priceWithoutIva = calculatePriceWithoutIva(totalUnitCost, margin)
          const priceWithIva = calculatePriceWithIva(priceWithoutIva)
          const isBelowMinProfitable = margin < MIN_PROFITABLE_MARGIN_PERCENT
          const validationError = rangeErrors[channel.key]

          return (
            <div
              key={channel.key}
              className={`rounded border bg-background p-2.5 ${
                isBelowMinProfitable ? 'border-rose-500/40' : 'border-border'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-foreground">{channel.title}</span>
              </div>

              {/* Precios lado a lado: Precio sin IVA y Precio + IVA (19%) */}
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/30 px-2.5 py-1.5">
                <div>
                  <div className="text-[0.625rem] font-medium text-muted-foreground">
                    Precio sin IVA
                  </div>
                  <div className={`font-mono text-sm font-bold tabular-nums ${channel.priceColorClass}`}>
                    {formatCurrency(priceWithoutIva)}
                  </div>
                </div>
                <div className="border-l border-border/60 pl-2.5">
                  <div className="text-[0.625rem] font-medium text-muted-foreground">
                    Precio + IVA (19%)
                  </div>
                  <div className="font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(priceWithIva)}
                  </div>
                </div>
              </div>

              {/* Control deslizador + campo numérico editable [0, 99] */}
              <div className="mt-2 flex items-center gap-2">
                <label
                  htmlFor={`margin-slider-${channel.key}`}
                  className="text-[0.6875rem] text-muted-foreground"
                >
                  Margen:
                </label>
                <input
                  id={`margin-slider-${channel.key}`}
                  type="range"
                  min={MIN_MARGIN_PERCENT}
                  max={MAX_MARGIN_PERCENT}
                  step={1}
                  value={margin}
                  onChange={(e) => handleSliderChange(channel.key, e.target.value)}
                  aria-label={`Deslizador de margen para ${channel.title}`}
                  className={`h-1.5 flex-1 cursor-pointer ${channel.accentClass}`}
                />
                <div className="flex items-center gap-1">
                  <label htmlFor={`margin-input-${channel.key}`} className="sr-only">
                    Digitar margen porcentual para {channel.title}
                  </label>
                  <Input
                    id={`margin-input-${channel.key}`}
                    type="number"
                    min={MIN_MARGIN_PERCENT}
                    max={MAX_MARGIN_PERCENT}
                    step="0.5"
                    value={draftInputs[channel.key]}
                    onChange={(e) => handleTypedMarginChange(channel.key, e.target.value)}
                    onBlur={() => handleTypedMarginBlur(channel.key)}
                    aria-invalid={Boolean(validationError)}
                    className="h-7 w-16 px-1.5 text-right font-mono text-xs font-bold"
                  />
                  <span className="font-mono text-xs font-bold text-foreground">%</span>
                </div>
              </div>

              {validationError && (
                <div
                  role="alert"
                  className="mt-1.5 flex items-center gap-1 text-[0.625rem] font-semibold text-amber-700 dark:text-amber-300"
                >
                  <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                  <span>{validationError}</span>
                </div>
              )}

              {isBelowMinProfitable && (
                <div
                  role="status"
                  className="mt-1.5 flex items-center gap-1 rounded bg-rose-500/10 px-2 py-1 text-[0.625rem] font-bold text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                  <span>
                    Alerta: Margen inferior al mínimo rentable ({MIN_PROFITABLE_MARGIN_PERCENT}%)
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
