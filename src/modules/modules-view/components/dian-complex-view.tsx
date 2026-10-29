'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DianDocument } from '@/database/schemas'
import { formatCurrency, formatDate } from '@/lib/config'

interface DianComplexViewProps {
  documents: DianDocument[]
}

export function DianComplexView({ documents }: DianComplexViewProps) {
  const [selectedTab, setSelectedTab] = useState<'docs' | 'certificate' | 'stats'>('docs')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Aceptada' | 'Rechazada' | 'Pendiente'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDocDetail, setActiveDocDetail] = useState<DianDocument | null>(null)
  const [isSyncing, setIsSyncing] = useState<string | null>(null)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  const filteredDocs = documents.filter((doc) => {
    const matchesStatus = statusFilter === 'ALL' || doc.dianStatus === statusFilter
    const matchesSearch =
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.recipientNit.includes(searchQuery) ||
      doc.cufeOrCune.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const acceptedCount = documents.filter((d) => d.dianStatus === 'Aceptada').length
  const pendingCount = documents.filter((d) => d.dianStatus === 'Pendiente').length
  const rejectedCount = documents.filter((d) => d.dianStatus === 'Rechazada').length
  const totalTransmittedCOP = documents.reduce((acc, d) => acc + d.totalAmountCOP, 0)

  const handleSimulateSync = (docNumber: string) => {
    setIsSyncing(docNumber)
    setSyncFeedback(null)
    setTimeout(() => {
      setIsSyncing(null)
      setSyncFeedback(`Sincronización con WebService DIAN exitosa para ${docNumber}. Estado verificado en servidor DIAN.`)
      setTimeout(() => setSyncFeedback(null), 5000)
    }, 1200)
  }

  const handleDownloadMock = (type: 'xml' | 'pdf' | 'appresponse', docNumber: string) => {
    alert(`Descargando ${type.toUpperCase()} legal de ${docNumber} con firma digital y validación previa DIAN.`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* KPI Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Aceptadas por DIAN
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{acceptedCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">Con CUFE/CUNE validado previo</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              En Trámite / Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">En cola de transmisión o sync</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rechazadas / Con Error
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{rejectedCount} docs</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren ajuste de datos</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monto Transmitido
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalTransmittedCOP)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total acumulado en registros</p>
          </CardContent>
        </Card>
      </div>

      {syncFeedback && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
        <TabsList className="inline-flex h-auto p-1.5 bg-muted/80 rounded-xl gap-1.5 border border-border/60 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="docs" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Documentos DIAN ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="certificate" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Certificado y Configuración UBL 2.1
          </TabsTrigger>
          <TabsTrigger value="stats" className="px-3.5 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
            Resolución y Rangos Autorizados
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Documents list */}
        <TabsContent value="docs" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por Folio, Cliente, NIT o CUFE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filtrar:</span>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'Aceptada', 'Pendiente', 'Rechazada'] as const).map((st) => (
                  <Button
                    key={st}
                    variant={statusFilter === st ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(st)}
                    className="h-8 text-xs font-medium px-2.5"
                  >
                    {st === 'ALL' ? 'Todos' : st}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/80 overflow-x-auto bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Folio / Tipo</th>
                  <th scope="col" className="px-4 py-3">Adquirente / Receptor</th>
                  <th scope="col" className="px-4 py-3">Fecha y CUFE / CUNE</th>
                  <th scope="col" className="px-4 py-3 text-right">Total Factura</th>
                  <th scope="col" className="px-4 py-3 text-center">Estado DIAN</th>
                  <th scope="col" className="px-4 py-3 text-center">Soportes Legales</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDocs.map((doc) => {
                  const isAccepted = doc.dianStatus === 'Aceptada'
                  const isPending = doc.dianStatus === 'Pendiente'
                  const isRejected = doc.dianStatus === 'Rechazada'

                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{doc.documentNumber}</div>
                        <span className="text-[11px] text-muted-foreground">{doc.documentType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground text-xs">{doc.recipientName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">NIT: {doc.recipientNit}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-foreground">{formatDate(doc.transmissionDate)}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]" title={doc.cufeOrCune}>
                          {doc.cufeOrCune.substring(0, 18)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatCurrency(doc.totalAmountCOP)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isAccepted ? 'default' : isPending ? 'secondary' : 'destructive'}
                          className="text-[11px] font-medium"
                        >
                          {doc.dianStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Descargar XML UBL 2.1 firmado"
                            onClick={() => handleDownloadMock('xml', doc.documentNumber)}
                          >
                            <FileCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Descargar PDF con QR y CUFE"
                            onClick={() => handleDownloadMock('pdf', doc.documentNumber)}
                          >
                            <FileText className="h-4 w-4 text-rose-600" />
                          </Button>
                          {isAccepted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Descargar ApplicationResponse DIAN"
                              onClick={() => handleDownloadMock('appresponse', doc.documentNumber)}
                            >
                              <FileCheck className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAccepted && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => alert(`Enviando factura electrónica ${doc.documentNumber} al buzón tributario de ${doc.recipientName}`)}
                              >
                                <Mail className="h-3 w-3 mr-1" /> Reenviar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2 text-amber-600 hover:text-amber-700"
                                onClick={() => alert(`Iniciando Nota Crédito Electrónica vinculada a ${doc.documentNumber} (${doc.cufeOrCune})`)}
                              >
                                Nota Crédito
                              </Button>
                            </>
                          )}

                          {isPending && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 text-xs px-2"
                              disabled={isSyncing === doc.documentNumber}
                              onClick={() => handleSimulateSync(doc.documentNumber)}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing === doc.documentNumber ? 'animate-spin' : ''}`} />
                              Ping DIAN
                            </Button>
                          )}

                          {isRejected && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => setActiveDocDetail(doc)}
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Ver Error y Corregir
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Modal / Panel for Rejection Detail */}
          {activeDocDetail && (
            <Card className="border-rose-500/40 bg-rose-500/5 mt-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Detalle de Rechazo Validación Previa DIAN - {activeDocDetail.documentNumber}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveDocDetail(null)} className="h-7 text-xs">
                    Cerrar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 bg-background border border-rose-200 dark:border-rose-900/50 rounded-md">
                  <div className="font-medium text-foreground text-xs uppercase text-rose-600 mb-1">
                    Diagnóstico del WebService DIAN (Código de Error UBL):
                  </div>
                  <p className="text-xs text-foreground font-mono">
                    {activeDocDetail.rejectionReason ||
                      'Regla FAS01: Error de validación previa en dígito de verificación del Adquirente. El NIT no coincide con el algoritmo Módulo 11 en base RUT.'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Modifique el RUT del tercero en el módulo de Administración antes de re-transmitir.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => alert(`Abriendo editor de adquirente ${activeDocDetail.recipientNit}`)}
                    >
                      Editar Tercero
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        alert(`Re-transmitiendo ${activeDocDetail.documentNumber} al WebService DIAN... Documento aprobado con CUFE generado.`)
                        setActiveDocDetail(null)
                      }}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Re-transmitir a la DIAN
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Certificate & Parameters */}
        <TabsContent value="certificate" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/80">
              <CardHeader>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <KeyRound className="h-4 w-4 text-emerald-600" />
                  Certificado Digital de Firma Electrónica
                </div>
                <CardDescription className="text-xs">
                  Entidad de Certificación Abierta autorizada por ONAC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Emisor Certificador:</span>
                  <span className="font-medium text-foreground">Andes SCD S.A. / Certicámara</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Titular:</span>
                  <span className="font-medium text-foreground">Velas, Velones y Cirios San Isaac SAS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">NIT Titular:</span>
                  <span className="font-mono text-foreground">901.473.704-4</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Número de Serie:</span>
                  <span className="font-mono text-foreground">7A:4F:9C:12:08:E4:31:88</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Vigencia y Expiración:</span>
                  <span className="font-medium text-amber-600">Válido hasta 12/Nov/2026 — ⚠️ Vence en 15 días</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Algoritmo de Firma:</span>
                  <span className="font-mono text-foreground">SHA-256 con RSA 2048 bits</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80">
              <CardHeader>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Parámetros de Software Propio / Conexión DIAN
                </div>
                <CardDescription className="text-xs">
                  Ambiente de Producción Habilitado Resolución 000042
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Modalidad de Transmisión:</span>
                  <span className="font-medium text-foreground">Software Propio ERP San Isaac</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Software ID (DIAN):</span>
                  <span className="font-mono text-foreground">b892a014-41b2-4d22-b91c-8902c419e712</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">PIN de Seguridad:</span>
                  <span className="font-mono text-foreground">••••• (Configurado en .env)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Ambiente:</span>
                  <Badge variant="default" className="text-[10px] bg-emerald-600">
                    Producción (Habilitado)
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">WebService URL:</span>
                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                    https://vpfe.dian.gov.co/WcfDianCustomerServices.svc
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Último Ping de Latencia:</span>
                  <span className="font-medium text-emerald-600">142 ms (Operacional)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Resolution & Ranges */}
        <TabsContent value="stats" className="space-y-4 pt-4">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Resolución de Facturación Electrónica DIAN Vigente
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Rango autorizado para el establecimiento comercial y planta fabril
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                  Vigencia 18 Meses
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-xs text-muted-foreground">Número de Resolución</div>
                  <div className="text-base font-bold text-foreground">18764084314318</div>
                  <div className="text-[11px] text-muted-foreground">Expedida: 28/Nov/2024</div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-xs text-muted-foreground">Prefijo y Rango Autorizado</div>
                  <div className="text-base font-bold text-foreground">FEDV (135 al 2.000)</div>
                  <div className="text-[11px] text-muted-foreground">Último usado: FEDV-140</div>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <div className="text-xs text-muted-foreground">Disponibilidad de Folios</div>
                  <div className="text-base font-bold text-amber-500">1.860 folios libres</div>
                  <div className="text-[11px] text-muted-foreground">97.0% de disponibilidad</div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70 bg-card text-xs text-muted-foreground space-y-1.5">
                <div className="font-semibold text-foreground">Control de Alerta Temprana de Vencimiento de Rango:</div>
                <p>
                  El sistema emitirá alerta automática a la Gerencia y Contabilidad cuando queden menos de 200 folios
                  o cuando falten 30 días para el vencimiento de la resolución (Fecha límite: 28/Nov/2026). También
                  se alertará el vencimiento del Certificado de Firma Digital (12/Nov/2026).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
