'use client'

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatNumber } from '@/lib/config'
import {
  DIAN_RESOLUTIONS,
  getResolutionStatus,
  RESOLUTION_ALERT_LABELS,
  RESOLUTION_ALERT_RULE,
  type ResolutionAlertLevel,
} from '@/lib/dian-resolutions'
import { getCertificateValidity, type DianCertificateInfo } from './dian-types'

interface DianResolutionsTabProps {
  certificate: DianCertificateInfo
}

function getAlertBadgeVariant(
  level: ResolutionAlertLevel
): 'danger' | 'warning' | 'success' {
  if (level === 'expired' || level === 'critical') return 'danger'
  if (level === 'preventive') return 'warning'
  return 'success'
}

export function DianResolutionsTab({ certificate }: DianResolutionsTabProps) {
  const primaryResolution = DIAN_RESOLUTIONS[0]
  const primaryStatus = getResolutionStatus(primaryResolution)
  const certValidity = getCertificateValidity(certificate.expirationDate)

  return (
    <div className="space-y-4">
      {/* Tarjeta principal de la resolución FEDV consumiendo DIAN_RESOLUTIONS + getResolutionStatus */}
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Resolución de Facturación Electrónica DIAN Vigente ({primaryResolution.prefix})
              </h3>
              <CardDescription className="text-xs">
                Rango autorizado para el establecimiento comercial y planta fabril — Fuente maestra única
              </CardDescription>
            </div>
            <Badge variant={getAlertBadgeVariant(primaryStatus.alertLevel)} className="text-xs">
              {RESOLUTION_ALERT_LABELS[primaryStatus.alertLevel]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 rounded-lg space-y-0.5">
              <div className="text-xs text-muted-foreground">Número de Resolución</div>
              <div className="text-base font-bold font-mono text-foreground">
                {primaryResolution.resolutionNumber}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Expedida: {formatDate(primaryResolution.issueDate)} · Vence:{' '}
                {formatDate(primaryResolution.expirationDate)}
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg space-y-0.5">
              <div className="text-xs text-muted-foreground">Prefijo y Rango Autorizado</div>
              <div className="text-base font-bold text-foreground">
                {primaryResolution.prefix} ({formatNumber(primaryResolution.rangeFrom)} al{' '}
                {formatNumber(primaryResolution.rangeTo)})
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Último usado: {primaryStatus.formattedCurrent}
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg space-y-0.5">
              <div className="text-xs text-muted-foreground">Disponibilidad de Folios y Vigencia</div>
              <div className="text-base font-bold text-foreground">
                {formatNumber(primaryStatus.remainingFolios)} folios libres
              </div>
              <div className="text-[11px] text-muted-foreground">
                {primaryStatus.remainingFolioPercent.toFixed(1)}% disponible ·{' '}
                {primaryStatus.remainingDays > 0
                  ? `${primaryStatus.remainingDays} ${primaryStatus.remainingDays === 1 ? 'día restante' : 'días restantes'}`
                  : 'Vencida'}
              </div>
            </div>
          </div>

          {/* Tabla maestra con todas las resoluciones DIAN (FEDV, DS, POS) */}
          <div className="rounded-lg border border-border/80 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/50 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Tipo de Documento</th>
                  <th scope="col" className="px-3 py-2.5">Prefijo / Resolución</th>
                  <th scope="col" className="px-3 py-2.5">Rango</th>
                  <th scope="col" className="px-3 py-2.5">Último Usado</th>
                  <th scope="col" className="px-3 py-2.5">Disponibilidad Folios</th>
                  <th scope="col" className="px-3 py-2.5">Vencimiento (En vivo)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {DIAN_RESOLUTIONS.map((res) => {
                  const status = getResolutionStatus(res)
                  return (
                    <tr key={res.id} className="hover:bg-muted/25">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{res.documentType}</td>
                      <td className="px-3 py-2.5 font-mono">
                        <span className="font-bold text-foreground">{res.prefix}</span>
                        <div className="text-[11px] text-muted-foreground">{res.resolutionNumber}</div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {formatNumber(res.rangeFrom)} – {formatNumber(res.rangeTo)}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-foreground">
                        {status.formattedCurrent}
                      </td>
                      <td className="px-3 py-2.5 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-foreground">
                            {formatNumber(status.remainingFolios)} libres
                          </span>
                          <span className="text-muted-foreground">
                            {status.remainingFolioPercent.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={status.usedPercent} />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        <div>{formatDate(res.expirationDate)}</div>
                        <div className="text-[11px]">
                          {status.remainingDays > 0
                            ? `${status.remainingDays} días`
                            : `Vencida (${Math.abs(status.remainingDays)} días)`}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Badge variant={getAlertBadgeVariant(status.alertLevel)} className="text-[11px]">
                          {status.alertLevel === 'ok' ? (
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="size-3" aria-hidden="true" />
                          )}
                          {RESOLUTION_ALERT_LABELS[status.alertLevel]}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Regla única parametrizada RESOLUTION_ALERT_RULE */}
          <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Info className="size-3.5 text-primary" aria-hidden="true" />
              <h4>Regla Única de Alerta Temprana de Resoluciones y Vigencia DIAN</h4>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-rose-700 dark:text-rose-400">
                  {RESOLUTION_ALERT_LABELS.critical}:
                </strong>{' '}
                cuando resten <strong>≤ {RESOLUTION_ALERT_RULE.criticalDays} días</strong> para el vencimiento
                de la resolución o quede menos del{' '}
                <strong>{RESOLUTION_ALERT_RULE.criticalFolioPercent}%</strong> de los folios autorizados.
              </li>
              <li>
                <strong className="text-amber-700 dark:text-amber-400">
                  {RESOLUTION_ALERT_LABELS.preventive}:
                </strong>{' '}
                cuando resten <strong>≤ {RESOLUTION_ALERT_RULE.preventiveDays} días</strong> para el vencimiento
                o queden menos de{' '}
                <strong>{formatNumber(RESOLUTION_ALERT_RULE.preventiveFolios)} folios</strong> disponibles.
              </li>
              <li>
                <strong className="text-foreground">Certificado Digital (.p12 / .pfx):</strong>{' '}
                vencimiento registrado el <strong>{formatDate(certificate.expirationDate)}</strong> —{' '}
                <span
                  className={
                    certValidity.level === 'expired'
                      ? 'font-semibold text-rose-600 dark:text-rose-400'
                      : 'text-foreground'
                  }
                >
                  {certValidity.statusText}
                </span>
                .
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
