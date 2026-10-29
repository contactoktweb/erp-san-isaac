'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  BookOpen,
  Building,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  PieChart as PieChartIcon,
  Printer,
  Scale,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ShareholderRecord } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'

interface CorporateComplexViewProps {
  shareholders: ShareholderRecord[]
}

export function CorporateComplexView({ shareholders }: CorporateComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<'book' | 'certificates' | 'minutes'>('book')
  const [activeCertificate, setActiveCertificate] = useState<ShareholderRecord | null>(null)

  // Capital breakdown constants — Velas, Velones y Cirios San Isaac SAS
  // Fuente: Certificado de Existencia Camara de Comercio Honda, Guaduas y Norte del Tolima — Matricula 71802
  // NIT: 901.473.704-4 | Rep. Legal: Edwin Mateo Ramirez Silva | CIIU 3290
  const authorizedCapitalCOP = 150000000 // 500 acciones @ 300,000 COP — Capital Autorizado oficial
  const totalSubscribedCOP = shareholders.reduce((acc, sh) => acc + (sh.subscribedCapitalCOP || sh.totalCapitalCOP), 0)
  const totalPaidCOP = shareholders.reduce((acc, sh) => acc + (sh.paidCapitalCOP || 0), 0)
  const totalPendingCOP = totalSubscribedCOP - totalPaidCOP

  const paidPercentage = Math.round((totalPaidCOP / totalSubscribedCOP) * 100) || 100
  const subscribedPercentage = Math.round((totalSubscribedCOP / authorizedCapitalCOP) * 100)

  // Status counters
  const fullyPaidCount = shareholders.filter((sh) => sh.paymentStatus === '100% Pagado').length
  const partialCount = shareholders.filter((sh) => sh.paymentStatus === 'Pago Parcial en Plazo').length
  const overdueCount = shareholders.filter((sh) => sh.paymentStatus === 'Plazo Vencido').length

  const handlePrintCertificate = (shareholderName: string, certNumber: string) => {
    alert(`Generando PDF oficial del Título Nominativo de Acciones No. ${certNumber} a favor de ${shareholderName}.`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Autorizado SAS
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(authorizedCapitalCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">500 acciones valor nominal $300.000 c/u</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Suscrito
            </CardTitle>
            <Scale className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSubscribedCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">{subscribedPercentage}% del capital autorizado</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capital Efectivamente Pagado
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaidCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">{paidPercentage}% del suscrito ingresado a bancos</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saldo por Cobrar Accionistas
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPendingCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">Plazo máx. 2 años (Ley 1258 Art. 9)</p>
          </CardContent>
        </Card>
      </div>

      {/* Ley 1258 Warning Notice */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-800 dark:text-rose-300 text-xs">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <div className="font-semibold text-sm">
              Alerta Legal Estatutaria: {overdueCount} aporte con plazo legal vencido (Ley 1258 de 2008)
            </div>
            <p className="mt-1">
              De conformidad con el Artículo 9 de la Ley 1258, las acciones suscritas en una SAS deben pagarse en un
              término no mayor a dos (2) años. El accionista en mora debe ser requerido formalmente o someter las acciones
              a la asamblea para cobro judicial o disminución del capital social.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="book" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Libro de Accionistas ({shareholders.length})
          </TabsTrigger>
          <TabsTrigger value="certificates" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Títulos de Acciones (Títulos Nominativos)
          </TabsTrigger>
          <TabsTrigger value="minutes" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Actas de Asamblea
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Shareholders Book */}
        <TabsContent value="book" className="space-y-4 pt-4">
          <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Accionista / Documento</th>
                  <th scope="col" className="px-4 py-3 text-right">No. Acciones</th>
                  <th scope="col" className="px-4 py-3 text-center">Participación</th>
                  <th scope="col" className="px-4 py-3 text-right">Capital Suscrito</th>
                  <th scope="col" className="px-4 py-3 text-right">Capital Pagado</th>
                  <th scope="col" className="px-4 py-3 text-right">Saldo Pendiente</th>
                  <th scope="col" className="px-4 py-3 text-center">Estado de Pago</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {shareholders.map((sh) => {
                  const subscribed = sh.subscribedCapitalCOP || sh.totalCapitalCOP
                  const paid = sh.paidCapitalCOP ?? subscribed
                  const pending = sh.pendingCapitalCOP ?? Math.max(0, subscribed - paid)
                  const isFullyPaid = sh.paymentStatus === '100% Pagado' || pending === 0
                  const isOverdue = sh.paymentStatus === 'Plazo Vencido'
                  const isPartial = sh.paymentStatus === 'Pago Parcial en Plazo'

                  return (
                    <tr key={sh.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{sh.shareholderName}</div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {sh.documentNumberMasked} • {sh.shareType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {sh.shareCount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {sh.sharePercentage}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground">
                        {formatCurrency(subscribed)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-emerald-600">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium">
                        {pending > 0 ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-amber-600'}>
                            {formatCurrency(pending)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">$0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isFullyPaid ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                          className="text-[11px]"
                        >
                          {sh.paymentStatus || '100% Pagado'}
                        </Badge>
                        {sh.paymentDeadline && !isFullyPaid && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            Plazo: {formatDate(sh.paymentDeadline)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => {
                            setActiveCertificate(sh)
                            setSelectedTab('certificates')
                          }}
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Ver Título
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab 2: Share Certificates */}
        <TabsContent value="certificates" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Seleccione Título Accionario:
              </div>
              {shareholders
                .filter((sh) => sh.shareCount > 0)
                .map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => setActiveCertificate(sh)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      activeCertificate?.id === sh.id
                        ? 'border-foreground bg-muted/50 shadow-sm'
                        : 'border-border/70 hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground font-mono">
                        {sh.shareCertificateNumber || 'TIT-001'}
                      </span>
                      <span className="text-xs text-muted-foreground">{sh.shareCount.toLocaleString('es-CO')} acc.</span>
                    </div>
                    <div className="text-xs text-foreground truncate mt-0.5">{sh.shareholderName}</div>
                  </button>
                ))}
            </div>

            <div className="lg:col-span-2">
              {activeCertificate ? (
                <Card className="border-2 border-foreground/20 shadow-md bg-card">
                  <CardHeader className="border-b pb-4 text-center">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                      República de Colombia • Cámara de Comercio de Bogotá
                    </div>
                    <CardTitle className="text-lg font-serif tracking-tight mt-1">
                      Velas, Velones y Cirios San Isaac SAS
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      NIT: 900.741.000-4 • Matrícula Mercantil No. 0341920
                    </CardDescription>
                    <div className="mt-2 inline-block px-3 py-1 bg-muted rounded font-mono text-xs font-bold">
                      TÍTULO NOMINATIVO DE ACCIONES No. {activeCertificate.shareCertificateNumber || 'TIT-001'}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 text-sm">
                    <p className="leading-relaxed text-foreground text-xs">
                      La sociedad <strong>Velas, Velones y Cirios San Isaac SAS</strong> certifica que{' '}
                      <strong>{activeCertificate.shareholderName}</strong>, identificado con{' '}
                      <strong>{activeCertificate.documentNumberMasked}</strong>, es titular legítimo de{' '}
                      <strong>{activeCertificate.shareCount.toLocaleString('es-CO')}</strong> acciones ordinarias de
                      capital, de un valor nominal de <strong>$10.000 COP</strong> cada una.
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 border rounded-lg text-xs">
                      <div>
                        <span className="text-muted-foreground">Capital Suscrito Representado:</span>
                        <div className="font-bold text-foreground">
                          {formatCurrency(activeCertificate.subscribedCapitalCOP || activeCertificate.totalCapitalCOP)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Capital Efectivamente Pagado:</span>
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(activeCertificate.paidCapitalCOP || activeCertificate.totalCapitalCOP)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                      <div className="border-t border-foreground/40 pt-2">
                        <div className="font-medium text-foreground">Gabriel Isaac Benavides</div>
                        <div className="text-[11px] text-muted-foreground">Representante Legal</div>
                      </div>
                      <div className="border-t border-foreground/40 pt-2">
                        <div className="font-medium text-foreground">Inversiones San Isaac SAS</div>
                        <div className="text-[11px] text-muted-foreground">Secretaría General de la Asamblea</div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          handlePrintCertificate(
                            activeCertificate.shareholderName,
                            activeCertificate.shareCertificateNumber || 'TIT-001'
                          )
                        }
                      >
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                        Imprimir / Descargar Título en PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed rounded-lg text-muted-foreground text-xs">
                  <Award className="h-8 w-8 mb-2 opacity-50" />
                  Seleccione un accionista para previsualizar su Título de Acciones
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Minutes Repository */}
        <TabsContent value="minutes" className="space-y-4 pt-4">
          <div className="rounded-lg border border-border/80 overflow-hidden bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Acta No. / Tipo de Reunión</th>
                  <th scope="col" className="px-4 py-3">Fecha de Sesión</th>
                  <th scope="col" className="px-4 py-3">Puntos Clave / Decisiones Adoptadas</th>
                  <th scope="col" className="px-4 py-3 text-center">Registro Cámara</th>
                  <th scope="col" className="px-4 py-3 text-right">Descargar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                <tr>
                  <td className="px-4 py-3 font-medium">
                    <div className="font-bold text-foreground">Acta No. 01 - Constitución</div>
                    <span className="text-[11px] text-muted-foreground">Asamblea Extraordinaria</span>
                  </td>
                  <td className="px-4 py-3">15/Ene/2022</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Constitución SAS, aprobación de estatutos y designación de Representante Legal.
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default" className="text-[10px]">Registrada CCB</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => alert('Descargando Acta 01...')}>
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">
                    <div className="font-bold text-foreground">Acta No. 04 - Asamblea Ordinaria 2024</div>
                    <span className="text-[11px] text-muted-foreground">Asamblea General Ordinaria</span>
                  </td>
                  <td className="px-4 py-3">22/Mar/2024</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Aprobación de estados financieros ejercicio 2023 y distribución de dividendos.
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default" className="text-[10px]">Registrada CCB</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => alert('Descargando Acta 04...')}>
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">
                    <div className="font-bold text-foreground">Acta No. 07 - Asamblea Ordinaria 2025</div>
                    <span className="text-[11px] text-muted-foreground">Asamblea General Ordinaria</span>
                  </td>
                  <td className="px-4 py-3">28/Mar/2025</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Aprobación de balances NIIF 2024 y plan de modernización de planta y pailas térmicas.
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="default" className="text-[10px]">Registrada CCB</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => alert('Descargando Acta 07...')}>
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">
                    <div className="font-bold text-foreground">Acta No. 09 - Sesión Extraordinaria</div>
                    <span className="text-[11px] text-muted-foreground">Asamblea Extraordinaria</span>
                  </td>
                  <td className="px-4 py-3">01/Nov/2025</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Autorización de encargo fiduciario y cesión preferente de cuotas de capital.
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">En Trámite CCB</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => alert('Descargando borrador Acta 09...')}>
                      <Download className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
