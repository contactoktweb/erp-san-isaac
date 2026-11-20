'use client'

import { useId, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileKey2,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/config'
import {
  buildSimulatedSerialHex,
  CERTIFICATE_MAX_FILE_SIZE_MB,
  DEFAULT_NEW_CERT_VALIDITY_YEARS,
  DIAN_ENVIRONMENTS,
  getCertificateValidity,
  getFutureDateIso,
  isDianEnvironmentKey,
  type DianCertificateInfo,
  type DianEnvironmentKey,
  type DianPingResult,
} from './dian-types'

interface DianCertificateTabProps {
  certificate: DianCertificateInfo
  onRenewCertificate: (nextCert: DianCertificateInfo) => void
  environment: DianEnvironmentKey
  onEnvironmentChange: (env: DianEnvironmentKey) => void
  isPinging: boolean
  lastPing: DianPingResult | null
  onTestPing: () => void
}

const CERTIFICATE_ISSUERS = [
  'Andes SCD S.A. / Certicámara',
  'Gestión de Seguridad Electrónica (GSE)',
  'Olimpia IT S.A.S.',
] as const

export function DianCertificateTab({
  certificate,
  onRenewCertificate,
  environment,
  onEnvironmentChange,
  isPinging,
  lastPing,
  onTestPing,
}: DianCertificateTabProps) {
  const envSelectId = useId()
  const certPasswordId = useId()
  const certExpirationId = useId()
  const certIssuerId = useId()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [certPassword, setCertPassword] = useState('')
  const [newExpirationDate, setNewExpirationDate] = useState(() =>
    getFutureDateIso(DEFAULT_NEW_CERT_VALIDITY_YEARS)
  )
  const [newIssuer, setNewIssuer] = useState<string>(certificate.issuer)

  const validity = getCertificateValidity(certificate.expirationDate)
  const envConfig = DIAN_ENVIRONMENTS[environment]
  const isExpired = validity.level === 'expired'

  const handleOpenModal = () => {
    setSelectedFile(null)
    setFileError(null)
    setCertPassword('')
    setNewExpirationDate(getFutureDateIso(DEFAULT_NEW_CERT_VALIDITY_YEARS))
    setNewIssuer(certificate.issuer)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setCertPassword('')
    setSelectedFile(null)
    setFileError(null)
    setIsModalOpen(false)
  }

  const handleSubmitRenewal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) {
      setFileError('Seleccione un archivo de certificado digital (.p12 o .pfx).')
      return
    }
    if (!certPassword.trim()) {
      toast.error('Ingrese la contraseña del certificado para validar la llave privada.')
      return
    }
    if (!newExpirationDate) {
      toast.error('Seleccione la fecha de vencimiento del certificado.')
      return
    }

    const updatedCertificate: DianCertificateInfo = {
      ...certificate,
      issuer: newIssuer,
      fileName: selectedFile.name,
      serialNumber: buildSimulatedSerialHex(selectedFile.name),
      expirationDate: `${newExpirationDate}T23:59:59-05:00`,
      lastUpdatedAt: new Date().toISOString(),
    }

    // Limpiar contraseña inmediatamente de memoria tras validación simulada
    setCertPassword('')
    onRenewCertificate(updatedCertificate)
    setIsModalOpen(false)
    toast.success(
      `Certificado ${selectedFile.name} aplicado en sesión local. Vencimiento: ${formatDate(updatedCertificate.expirationDate)}.`
    )
  }

  return (
    <div className="space-y-4">
      {isExpired && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                {validity.statusText} (venció el {formatDate(certificate.expirationDate)})
              </p>
              <p className="mt-0.5 text-rose-700/90 dark:text-rose-300/90">
                El certificado de firma digital expiró hace {Math.abs(validity.remainingDays)}{' '}
                {Math.abs(validity.remainingDays) === 1 ? 'día' : 'días'}. Cargue un nuevo archivo .p12 o .pfx
                para firmar XML UBL 2.1 ante la DIAN.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleOpenModal}
            className="h-8 text-xs shrink-0 gap-1.5"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            Renovar ahora
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta 1: Certificado Digital */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <KeyRound
                    className={`h-4 w-4 ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}
                    aria-hidden="true"
                  />
                  <h3>Certificado Digital de Firma Electrónica</h3>
                </div>
                <CardDescription className="text-xs mt-1">
                  Entidad de Certificación Abierta autorizada por ONAC
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenModal}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <Upload className="size-3.5" aria-hidden="true" />
                + Subir / Renovar Certificado (.p12 / .pfx)
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Emisor Certificador:</span>
              <span className="font-medium text-foreground text-right">{certificate.issuer}</span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Titular:</span>
              <span className="font-medium text-foreground text-right">{certificate.holder}</span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">NIT Titular:</span>
              <span className="font-mono text-foreground">{certificate.holderNit}</span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Archivo Activo:</span>
              <span className="font-mono text-foreground truncate max-w-[220px]" title={certificate.fileName}>
                {certificate.fileName}
              </span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Número de Serie:</span>
              <span className="font-mono text-foreground">{certificate.serialNumber}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Vigencia y Expiración:</span>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="font-mono text-foreground">{formatDate(certificate.expirationDate)}</span>
                {validity.level === 'expired' ? (
                  <Badge variant="danger" className="text-[11px] font-semibold">
                    {validity.statusText}
                  </Badge>
                ) : validity.level === 'critical' || validity.level === 'preventive' ? (
                  <Badge variant="warning" className="text-[11px] font-semibold">
                    {validity.statusText}
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[11px] font-semibold">
                    {validity.statusText}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex justify-between gap-2 py-1.5">
              <span className="text-muted-foreground">Algoritmo de Firma:</span>
              <span className="font-mono text-foreground">{certificate.algorithm}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Parámetros de Software Propio / Conexión DIAN */}
        <Card className="border-border/80">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <h3>Parámetros de Software Propio / Conexión DIAN</h3>
                </div>
                <CardDescription className="text-xs mt-1">{envConfig.description}</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPinging}
                onClick={onTestPing}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <RefreshCw className={`size-3.5 ${isPinging ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isPinging ? 'Probando conexión...' : 'Probar Conexión DIAN (Ping)'}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Modalidad de Transmisión:</span>
              <span className="font-medium text-foreground">Software Propio ERP San Isaac</span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Software ID (DIAN):</span>
              <span className="font-mono text-foreground">b892a014-41b2-4d22-b91c-8902c419e712</span>
            </div>
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">PIN de Seguridad:</span>
              <span className="font-mono text-foreground">Configurado en .env.local (Fase 3)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1.5 border-b border-border/50">
              <Label htmlFor={envSelectId} className="text-xs font-normal text-muted-foreground">
                Ambiente:
              </Label>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <select
                  id={envSelectId}
                  value={environment}
                  onChange={(e) => {
                    if (isDianEnvironmentKey(e.target.value)) {
                      onEnvironmentChange(e.target.value)
                    }
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="habilitacion">{DIAN_ENVIRONMENTS.habilitacion.label}</option>
                  <option value="produccion">{DIAN_ENVIRONMENTS.produccion.label}</option>
                </select>
                <Badge
                  variant={environment === 'produccion' ? 'success' : 'warning'}
                  className="text-[10px]"
                >
                  {envConfig.shortLabel}
                </Badge>
              </div>
            </div>
            {envConfig.testSetId && (
              <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">TestSetId Activo:</span>
                <span className="font-mono text-foreground">{envConfig.testSetId}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">WebService URL:</span>
              <span
                className="font-mono text-[11px] text-muted-foreground truncate max-w-[230px]"
                title={envConfig.webServiceUrl}
              >
                {envConfig.webServiceUrl}
              </span>
            </div>
            <div className="flex justify-between gap-2 py-1.5">
              <span className="text-muted-foreground">Último Ping de Latencia:</span>
              {lastPing ? (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {lastPing.latencyMs} ms ({lastPing.statusText} · {lastPing.checkedAt})
                </span>
              ) : (
                <span className="text-muted-foreground">Sin ping en esta sesión — Pulse Probar Conexión</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Subir / Renovar Certificado (.p12 / .pfx) */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-certificate"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileKey2 className="size-4 text-primary" aria-hidden="true" />
                <h3 id="modal-title-certificate" className="text-base font-bold text-foreground">
                  Subir / Renovar Certificado Digital (.p12 / .pfx)
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar modal de renovación de certificado"
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRenewal} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/25 p-3">
                <span className="font-semibold text-foreground">Archivo de Certificado Digital (.p12 / .pfx) *</span>
                <div className="flex flex-wrap items-center gap-2">
                  <FileUploadButton
                    accept=".p12,.pfx"
                    maxSizeMB={CERTIFICATE_MAX_FILE_SIZE_MB}
                    onFileSelected={(file) => {
                      setSelectedFile(file)
                      setFileError(null)
                    }}
                    onError={(msg) => {
                      setSelectedFile(null)
                      setFileError(msg)
                      toast.error(msg)
                    }}
                  >
                    {selectedFile ? 'Cambiar archivo (.p12 / .pfx)' : 'Seleccionar .p12 / .pfx'}
                  </FileUploadButton>
                  {selectedFile ? (
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                      {selectedFile.name} ({Math.max(1, Math.round(selectedFile.size / 1024))} KB)
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Máximo {CERTIFICATE_MAX_FILE_SIZE_MB} MB
                    </span>
                  )}
                </div>
                {fileError && <p className="text-[11px] font-medium text-destructive">{fileError}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={certPasswordId} className="text-xs font-semibold">
                  Contraseña de la Llave Privada (.p12 / .pfx) *
                </Label>
                <Input
                  id={certPasswordId}
                  type="password"
                  required
                  autoComplete="off"
                  value={certPassword}
                  onChange={(e) => setCertPassword(e.target.value)}
                  placeholder="Ingrese la contraseña del certificado"
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  La contraseña permanece solo en memoria durante esta sesión; se guardará encriptada en Fase 3.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={certIssuerId} className="text-xs font-semibold">
                    Entidad Certificadora (ONAC) *
                  </Label>
                  <select
                    id={certIssuerId}
                    value={newIssuer}
                    onChange={(e) => setNewIssuer(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CERTIFICATE_ISSUERS.map((issuerName) => (
                      <option key={issuerName} value={issuerName}>
                        {issuerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={certExpirationId} className="text-xs font-semibold">
                    Fecha de Vencimiento *
                  </Label>
                  <Input
                    id={certExpirationId}
                    type="date"
                    required
                    value={newExpirationDate}
                    onChange={(e) => setNewExpirationDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-semibold">
                  Aplicar Certificado (Demo)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
