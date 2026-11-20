'use client'

import { useMemo, useState } from 'react'
import { Check, FileCheck2, Search, UserPlus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/config'
import {
  calculateDianDv,
  FEDV_RESOLUTION,
  formatClientDocument,
  type ClientDirectoryEntry,
} from './sales-constants'

interface PosElectronicInvoiceModalProps {
  isOpen: boolean
  nextFedvNumber: number
  totalAmountCOP: number
  clients: ClientDirectoryEntry[]
  selectedClient: ClientDirectoryEntry | null
  paymentSummaryText: string
  isPaymentValid: boolean
  paymentValidationMessage: string | null
  onClose: () => void
  onCreateClient: (newClient: ClientDirectoryEntry) => void
  onConfirmEmitFedv: (client: ClientDirectoryEntry) => void
}

export function PosElectronicInvoiceModal({
  isOpen,
  nextFedvNumber,
  totalAmountCOP,
  clients,
  selectedClient,
  paymentSummaryText,
  isPaymentValid,
  paymentValidationMessage,
  onClose,
  onCreateClient,
  onConfirmEmitFedv,
}: PosElectronicInvoiceModalProps) {
  const [tabMode, setTabMode] = useState<'search' | 'create'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [pickedClientId, setPickedClientId] = useState<string>(
    selectedClient?.id ?? clients[0]?.id ?? ''
  )

  // Campos de creación rápida de cliente (NIT / RUT)
  const [documentType, setDocumentType] = useState<'NIT' | 'CC'>('NIT')
  const [documentNumber, setDocumentNumber] = useState('')
  const [dvOverride, setDvOverride] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCity, setClientCity] = useState('Guaduas (Cundinamarca)')
  const [formError, setFormError] = useState<string | null>(null)

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.documentNumber.includes(q) ||
        c.email.toLowerCase().includes(q)
    )
  }, [clients, searchQuery])

  if (!isOpen) return null

  const cleanDigits = documentNumber.replace(/\D/g, '')
  const computedDv = documentType === 'NIT' ? calculateDianDv(cleanDigits) : ''
  const effectiveDv = dvOverride.trim() || computedDv
  const pickedClient = clients.find((c) => c.id === pickedClientId) ?? filteredClients[0] ?? null

  const handleEmitFromSearch = () => {
    if (!pickedClient || !isPaymentValid) return
    onConfirmEmitFedv(pickedClient)
    onClose()
  }

  const handleCreateAndEmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (!cleanDigits || cleanDigits.length < 5) {
      setFormError('Ingrese un número de NIT o Cédula válido (solo dígitos).')
      return
    }
    if (documentType === 'NIT' && !effectiveDv) {
      setFormError('El Dígito de Verificación (DV) es obligatorio para NIT / RUT.')
      return
    }
    if (!clientName.trim()) {
      setFormError('Ingrese el nombre completo o razón social del adquirente.')
      return
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setFormError('Ingrese un correo electrónico válido para envío de XML/PDF DIAN.')
      return
    }

    const newClient: ClientDirectoryEntry = {
      id: `cli-${Date.now()}`,
      documentType,
      documentNumber: cleanDigits,
      verificationDigit: documentType === 'NIT' ? effectiveDv : '',
      name: clientName.trim(),
      city: clientCity.trim() || 'Guaduas (Cundinamarca)',
      email: clientEmail.trim(),
      defaultPaymentTerms: 'Contado',
    }

    onCreateClient(newClient)
    setPickedClientId(newClient.id)
    setDocumentNumber('')
    setDvOverride('')
    setClientName('')
    setClientEmail('')

    if (isPaymentValid) {
      onConfirmEmitFedv(newClient)
      onClose()
    } else {
      setTabMode('search')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-pos-fedv"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-emerald-600" aria-hidden="true" />
            <h3 id="modal-title-pos-fedv" className="text-base font-bold text-foreground">
              Emitir Factura Electrónica DIAN ({FEDV_RESOLUTION.prefix}-{nextFedvNumber})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal de factura electrónica"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
          <div>
            <div className="font-bold text-emerald-900 dark:text-emerald-300">
              Consecutivo: {FEDV_RESOLUTION.prefix}-{nextFedvNumber} · Res. DIAN{' '}
              {FEDV_RESOLUTION.resolutionNumber}
            </div>
            <div className="text-[0.6875rem] text-emerald-800/80 dark:text-emerald-300/80">
              {paymentSummaryText}
            </div>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(totalAmountCOP)}
          </div>
        </div>

        {!isPaymentValid && paymentValidationMessage && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-800 dark:text-rose-300"
          >
            {paymentValidationMessage}
          </div>
        )}

        {/* Selector Buscar vs Crear Cliente */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={tabMode === 'search' ? 'default' : 'outline'}
            onClick={() => setTabMode('search')}
            className="gap-1.5 text-xs"
          >
            <Search className="size-3.5" /> Buscar Cliente Existente
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tabMode === 'create' ? 'default' : 'outline'}
            onClick={() => setTabMode('create')}
            className="gap-1.5 text-xs"
          >
            <UserPlus className="size-3.5" /> Crear Cliente (NIT / RUT)
          </Button>
        </div>

        {tabMode === 'search' ? (
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pos-client-search" className="font-semibold text-foreground">
                Buscador rápido (Nombre, NIT o Correo)
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  id="pos-client-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar adquirente para facturación electrónica..."
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            <div className="max-h-52 divide-y overflow-y-auto rounded-lg border bg-background">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No se encontraron clientes. Use la pestaña &ldquo;Crear Cliente (NIT / RUT)&rdquo;.
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isPicked = pickedClient?.id === client.id
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setPickedClientId(client.id)}
                      className={`flex w-full items-center justify-between p-3 text-left transition-colors ${
                        isPicked ? 'bg-primary/10' : 'hover:bg-muted/30'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{client.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.6875rem] text-muted-foreground">
                          <span className="font-mono">
                            {client.documentType}{' '}
                            {formatClientDocument(client.documentNumber, client.verificationDigit)}
                          </span>
                          <span>&bull;</span>
                          <span>{client.email}</span>
                        </div>
                      </div>
                      {isPicked && (
                        <Badge variant="success" className="gap-1 text-[0.625rem]">
                          <Check className="size-3" /> Seleccionado
                        </Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!pickedClient || !isPaymentValid}
                onClick={handleEmitFromSearch}
                className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                Generar {FEDV_RESOLUTION.prefix}-{nextFedvNumber}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAndEmit} className="flex flex-col gap-3 text-xs">
            {formError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-800 dark:text-rose-300"
              >
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="flex flex-col gap-1.5 sm:col-span-3">
                <label htmlFor="pos-new-doc-type" className="font-semibold text-foreground">
                  Tipo *
                </label>
                <select
                  id="pos-new-doc-type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as 'NIT' | 'CC')}
                  className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground"
                >
                  <option value="NIT">NIT / RUT</option>
                  <option value="CC">Cédula</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-6">
                <label htmlFor="pos-new-doc-num" className="font-semibold text-foreground">
                  Número de Documento *
                </label>
                <Input
                  id="pos-new-doc-num"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej. 901473704"
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-3">
                <label htmlFor="pos-new-doc-dv" className="font-semibold text-foreground">
                  DV {documentType === 'NIT' ? '*' : '(N/A)'}
                </label>
                <Input
                  id="pos-new-doc-dv"
                  maxLength={1}
                  disabled={documentType !== 'NIT'}
                  value={documentType === 'NIT' ? effectiveDv : ''}
                  onChange={(e) => setDvOverride(e.target.value.replace(/\D/g, ''))}
                  placeholder={computedDv || '0'}
                  className="text-center font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pos-new-name" className="font-semibold text-foreground">
                  Nombre o Razón Social *
                </label>
                <Input
                  id="pos-new-name"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Ferretería y Velas El Patriarca SAS"
                  className="text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="pos-new-email" className="font-semibold text-foreground">
                  Correo Electrónico (DIAN) *
                </label>
                <Input
                  id="pos-new-email"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="facturacion@empresa.com"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="pos-new-city" className="font-semibold text-foreground">
                Municipio / Ciudad
              </label>
              <Input
                id="pos-new-city"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
              >
                {isPaymentValid
                  ? `Guardar Cliente y Generar ${FEDV_RESOLUTION.prefix}-${nextFedvNumber}`
                  : 'Guardar Cliente en Directorio'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
