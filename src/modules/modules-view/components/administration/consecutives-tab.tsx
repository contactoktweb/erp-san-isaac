'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber } from '@/lib/config'
import {
  DIAN_RESOLUTIONS,
  getResolutionStatus,
  RESOLUTION_ALERT_LABELS,
  RESOLUTION_ALERT_RULE,
  type ResolutionAlertLevel,
  type ResolutionStatus,
} from '@/lib/dian-resolutions'

const ALERT_BADGE_VARIANT: Record<
  ResolutionAlertLevel,
  'danger' | 'warning' | 'success'
> = {
  expired: 'danger',
  critical: 'danger',
  preventive: 'warning',
  ok: 'success',
}

const PROGRESS_BAR_CLASS: Record<ResolutionAlertLevel, string> = {
  expired: 'bg-rose-600',
  critical: 'bg-rose-500',
  preventive: 'bg-amber-500',
  ok: 'bg-emerald-500',
}

function getAlertReason(status: ResolutionStatus): string {
  if (status.remainingDays <= 0) {
    return `Resolución vencida (${Math.abs(status.remainingDays)} d)`
  }
  if (status.remainingFolios === 0) {
    return 'Sin folios disponibles'
  }
  if (status.alertLevel === 'critical') {
    if (status.remainingDays <= RESOLUTION_ALERT_RULE.criticalDays) {
      return `≤ ${RESOLUTION_ALERT_RULE.criticalDays} días para vencer`
    }
    return `< ${RESOLUTION_ALERT_RULE.criticalFolioPercent}% folios libres`
  }
  if (status.alertLevel === 'preventive') {
    if (status.remainingDays <= RESOLUTION_ALERT_RULE.preventiveDays) {
      return `≤ ${RESOLUTION_ALERT_RULE.preventiveDays} días para vencer`
    }
    return `< ${RESOLUTION_ALERT_RULE.preventiveFolios} folios libres`
  }
  return `${formatNumber(status.remainingFolios)} folios disponibles`
}

function AlertStatusIcon({ level }: { level: ResolutionAlertLevel }) {
  switch (level) {
    case 'expired':
      return <ShieldAlert className="size-3.5" aria-hidden="true" />
    case 'critical':
      return <AlertTriangle className="size-3.5" aria-hidden="true" />
    case 'preventive':
      return <Clock className="size-3.5" aria-hidden="true" />
    case 'ok':
      return <CheckCircle2 className="size-3.5" aria-hidden="true" />
  }
}

export function ConsecutivesTab() {
  const [referenceDate] = useState<Date>(() => new Date())

  return (
    <section aria-labelledby="heading-consecutives" className="flex flex-col gap-4">
      <div className="rounded-lg border border-rose-500/20 bg-rose-50/50 p-3.5 text-xs text-rose-950 dark:bg-rose-950/20 dark:text-rose-200">
        <h3 id="heading-consecutives" className="text-sm font-bold text-foreground mb-1">
          Consecutivos y Vigencia de Resoluciones DIAN
        </h3>
        <p className="leading-relaxed">
          <strong>Regla única de alerta temprana:</strong>{' '}
          <span className="font-semibold">Crítica</span> si restan &le;{' '}
          {RESOLUTION_ALERT_RULE.criticalDays} días para vencer o &lt;{' '}
          {RESOLUTION_ALERT_RULE.criticalFolioPercent}% de folios disponibles;{' '}
          <span className="font-semibold">Preventiva</span> si restan &le;{' '}
          {RESOLUTION_ALERT_RULE.preventiveDays} días para vencer o &lt;{' '}
          {formatNumber(RESOLUTION_ALERT_RULE.preventiveFolios)} folios disponibles;{' '}
          <span className="font-semibold">Vencida / Agotada</span> si llegan a 0 días o 0 folios.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2.5">Tipo de Documento</th>
              <th scope="col" className="px-3 py-2.5">Prefijo</th>
              <th scope="col" className="px-3 py-2.5">Rango Autorizado</th>
              <th scope="col" className="px-3 py-2.5">Actual / Último</th>
              <th scope="col" className="px-3 py-2.5">% Uso Folios</th>
              <th scope="col" className="px-3 py-2.5">Resolución DIAN</th>
              <th scope="col" className="px-3 py-2.5">Vencimiento</th>
              <th scope="col" className="px-3 py-2.5 text-right">Semáforo Vigencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {DIAN_RESOLUTIONS.map((res) => {
              const status = getResolutionStatus(res, referenceDate)
              const usedPercentRounded = Math.min(100, Math.max(0, status.usedPercent))
              const usedPercentLabel = usedPercentRounded.toLocaleString('es-CO', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })

              return (
                <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-foreground">{res.documentType}</div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      Expedida: {formatDate(res.issueDate)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono font-bold text-foreground">{res.prefix}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    <div>
                      {formatNumber(res.rangeFrom)} al {formatNumber(res.rangeTo)}
                    </div>
                    <div className="text-[0.6875rem]">
                      {formatNumber(status.totalFolios)} folios autorizados
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                    <div className="font-bold text-foreground">{status.formattedCurrent}</div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      {formatNumber(status.remainingFolios)} folios libres
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        {usedPercentLabel}%
                      </span>
                      <div
                        role="progressbar"
                        aria-label={`Uso de folios para ${res.prefix}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Number(usedPercentRounded.toFixed(1))}
                        className="h-1.5 w-16 rounded-full bg-muted overflow-hidden"
                      >
                        <div
                          className={`h-full rounded-full ${PROGRESS_BAR_CLASS[status.alertLevel]}`}
                          style={{ width: `${Math.max(usedPercentRounded, status.usedFolios > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-0.5 font-mono text-[0.625rem] text-muted-foreground">
                      {formatNumber(status.usedFolios)} / {formatNumber(status.totalFolios)} usados
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-foreground">
                    {res.resolutionNumber}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="font-mono font-semibold text-foreground">
                      {formatDate(res.expirationDate)}
                    </div>
                    <div className="text-[0.6875rem] text-muted-foreground">
                      {status.remainingDays > 0
                        ? `${status.remainingDays} días restantes`
                        : status.remainingDays === 0
                          ? 'Vence hoy'
                          : `Vencida (${Math.abs(status.remainingDays)} días)`}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex flex-col items-end gap-0.5">
                      <Badge
                        variant={ALERT_BADGE_VARIANT[status.alertLevel]}
                        className="text-[0.6875rem] font-semibold"
                      >
                        <AlertStatusIcon level={status.alertLevel} />
                        {RESOLUTION_ALERT_LABELS[status.alertLevel]}
                      </Badge>
                      <span className="text-[0.625rem] text-muted-foreground">
                        {getAlertReason(status)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
