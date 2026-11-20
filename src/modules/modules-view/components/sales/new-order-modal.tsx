'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { OrderItem, OrderOrigin, SalesOrder } from '@/database/schemas'
import { formatCurrency, formatNumber } from '@/lib/config'
import {
  CLIENT_DIRECTORY_SEED,
  computeTrafficLight,
  formatClientDocument,
  MS_PER_DAY,
  normalizeNitDigits,
  SALES_CATALOG_PRODUCTS,
} from './sales-constants'

interface DraftItemRow {
  rowId: string
  productId: string
  commercialQuantity: number
  unitPriceCOP: number
  customizationNote: string
}

interface NewOrderModalProps {
  isOpen: boolean
  existingOrdersCount: number
  blockedClientDocs: Set<string>
  authorizedExceptionDocs: Set<string>
  onClose: () => void
  onCreateOrder: (newOrder: SalesOrder, isQuotation: boolean) => void
}

const DEFAULT_LEAD_DAYS = 7

function toIsoDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function NewOrderModal({
  isOpen,
  existingOrdersCount,
  blockedClientDocs,
  authorizedExceptionDocs,
  onClose,
  onCreateOrder,
}: NewOrderModalProps) {
  const today = new Date()
  const defaultDelivery = new Date(today.getTime() + DEFAULT_LEAD_DAYS * MS_PER_DAY)

  const [documentMode, setDocumentMode] = useState<'PEDIDO' | 'COTIZACION'>('PEDIDO')
  const [origin, setOrigin] = useState<OrderOrigin>('ERP')
  const [webOrderNumber, setWebOrderNumber] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>(CLIENT_DIRECTORY_SEED[0].id)
  const [customClientName, setCustomClientName] = useState('')
  const [customClientDocument, setCustomClientDocument] = useState('')
  const [destinationCity, setDestinationCity] = useState(CLIENT_DIRECTORY_SEED[0].city)
  const [receptionDate, setReceptionDate] = useState(toIsoDateInput(today))
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(toIsoDateInput(defaultDelivery))
  const [paymentTerms, setPaymentTerms] = useState<SalesOrder['paymentTerms']>(
    CLIENT_DIRECTORY_SEED[0].defaultPaymentTerms
  )
  const [items, setItems] = useState<DraftItemRow[]>([
    {
      rowId: 'draft-1',
      productId: SALES_CATALOG_PRODUCTS[0].id,
      commercialQuantity: 5,
      unitPriceCOP: SALES_CATALOG_PRODUCTS[0].unitPriceCOP,
      customizationNote: '',
    },
  ])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const isCustomClient = selectedClientId === 'CUSTOM'
  const selectedClient = CLIENT_DIRECTORY_SEED.find((c) => c.id === selectedClientId)
  const effectiveDoc = isCustomClient
    ? customClientDocument.trim()
    : selectedClient
    ? formatClientDocument(selectedClient.documentNumber, selectedClient.verificationDigit)
    : ''
  const effectiveDocDigits = normalizeNitDigits(effectiveDoc)
  const isClientBlocked = Boolean(effectiveDocDigits && blockedClientDocs.has(effectiveDocDigits))
  const hasAdminException = Boolean(
    effectiveDocDigits && authorizedExceptionDocs.has(effectiveDocDigits)
  )

  const handleClientSelectChange = (clientId: string) => {
    setSelectedClientId(clientId)
    const found = CLIENT_DIRECTORY_SEED.find((c) => c.id === clientId)
    if (found) {
      setDestinationCity(found.city)
      setPaymentTerms(found.defaultPaymentTerms)
    } else {
      setDestinationCity('')
    }
  }

  const handleAddItemRow = () => {
    const nextProduct = SALES_CATALOG_PRODUCTS[items.length % SALES_CATALOG_PRODUCTS.length]
    setItems((prev) => [
      ...prev,
      {
        rowId: `draft-${Date.now()}-${prev.length}`,
        productId: nextProduct.id,
        commercialQuantity: 1,
        unitPriceCOP: nextProduct.unitPriceCOP,
        customizationNote: '',
      },
    ])
  }

  const handleRemoveItemRow = (rowId: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((row) => row.rowId !== rowId) : prev))
  }

  const handleProductChange = (rowId: string, productId: string) => {
    const prod = SALES_CATALOG_PRODUCTS.find((p) => p.id === productId)
    setItems((prev) =>
      prev.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              productId,
              unitPriceCOP: prod ? prod.unitPriceCOP : row.unitPriceCOP,
            }
          : row
      )
    )
  }

  const computedTotalCOP = items.reduce((sum, row) => {
    const prod = SALES_CATALOG_PRODUCTS.find((p) => p.id === row.productId)
    const baseUnits = (prod?.unitsPerPresentation ?? 1) * Math.max(0, row.commercialQuantity)
    return sum + baseUnits * Math.max(0, row.unitPriceCOP)
  }, 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    const clientName = isCustomClient ? customClientName.trim() : (selectedClient?.name ?? '')
    const clientDocument = effectiveDoc
    if (!clientName || !clientDocument) {
      setErrorMessage('Complete el nombre o razón social y el documento/NIT del cliente.')
      return
    }
    if (origin === 'TIENDA_WEB' && !webOrderNumber.trim()) {
      setErrorMessage('Ingrese el número de orden web (ej. WEB-1055) para pedidos de Tienda Web.')
      return
    }
    if (items.some((it) => it.commercialQuantity <= 0 || it.unitPriceCOP <= 0)) {
      setErrorMessage('Todas las líneas deben tener cantidad y precio unitario mayores a cero.')
      return
    }

    const startMs = new Date(`${receptionDate}T08:00:00`).getTime()
    const endMs = new Date(`${estimatedDeliveryDate}T17:00:00`).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
      setErrorMessage('La fecha pactada de entrega no puede ser anterior a la fecha de recepción.')
      return
    }

    const totalAgreedDays = Math.max(1, Math.round((endMs - startMs) / MS_PER_DAY))
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const remainingDays = Math.ceil((endMs - todayStart.getTime()) / MS_PER_DAY)

    const nextSeq = String(existingOrdersCount + 1).padStart(4, '0')
    const orderNumber =
      documentMode === 'COTIZACION' ? `COT-2026-${nextSeq}` : `PED-2026-${nextSeq}`

    const builtItems: OrderItem[] = items.map((row, idx) => {
      const prod =
        SALES_CATALOG_PRODUCTS.find((p) => p.id === row.productId) ?? SALES_CATALOG_PRODUCTS[0]
      const orderedBase = row.commercialQuantity * prod.unitsPerPresentation
      return {
        id: `item-${Date.now()}-${idx}`,
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        commercialPresentation: prod.commercialPresentation,
        unitsPerPresentation: prod.unitsPerPresentation,
        orderedQuantityCommercial: row.commercialQuantity,
        orderedQuantityBase: orderedBase,
        packedQuantityBase: 0,
        pendingQuantityBase: orderedBase,
        progressPercentage: 0,
        customizationNote:
          row.customizationNote.trim() ||
          (documentMode === 'COTIZACION' ? 'Cotización comercial sujeta a confirmación' : undefined),
      }
    })

    const itemsSummary = builtItems
      .map((it) => `${it.orderedQuantityBase} uds ${it.productName}`)
      .join(' + ')

    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber,
      origin,
      webOrderNumber: origin === 'TIENDA_WEB' ? webOrderNumber.trim().toUpperCase() : undefined,
      clientName,
      clientDocument,
      destinationCity: destinationCity.trim() || 'Bogotá D.C.',
      receptionDate: new Date(`${receptionDate}T08:00:00.000Z`).toISOString(),
      estimatedDeliveryDate: new Date(`${estimatedDeliveryDate}T17:00:00.000Z`).toISOString(),
      totalAgreedDays,
      elapsedDays: 0,
      remainingDays,
      trafficLightStatus: computeTrafficLight(remainingDays, 0),
      orderStatus: 'Registrado',
      overallProgressPercentage: 0,
      totalBoxesCount: 0,
      itemsSummary:
        documentMode === 'COTIZACION' ? `[Cotización] ${itemsSummary}` : itemsSummary,
      totalAmountCOP: Math.max(1, computedTotalCOP),
      pendingBalanceCOP: paymentTerms === 'Contado' ? 0 : Math.max(0, computedTotalCOP),
      paymentTerms,
      paymentStatus: paymentTerms === 'Contado' ? 'Al día' : 'Pendiente',
      items: builtItems,
      boxes: [],
    }

    onCreateOrder(newOrder, documentMode === 'COTIZACION')
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title-new-order"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4 text-primary" aria-hidden="true" />
            <h3 id="modal-title-new-order" className="text-base font-bold text-foreground">
              Nuevo Pedido / Cotización Comercial
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar modal de nuevo pedido"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-800 dark:text-rose-300"
            >
              {errorMessage}
            </div>
          )}

          {isClientBlocked && !hasAdminException && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-800 dark:text-rose-300"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <div className="font-bold">Alerta de Bloqueo Comercial en Cartera</div>
                <p className="mt-0.5 text-[0.6875rem]">
                  El cliente seleccionado registra mora o cupo excedido. Para despachar un pedido en
                  firme, un usuario con rol <strong>ADMIN</strong> debe autorizar la excepción en la
                  pestaña Cartera (se recomienda registrar como Cotización mientras se aprueba).
                </p>
              </div>
            </div>
          )}

          {isClientBlocked && hasAdminException && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-800 dark:text-emerald-300"
            >
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                Cliente con <strong>Excepción Comercial autorizada por ADMIN</strong> (registrada en
                Bitácora de Auditoría).
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-doc-mode" className="font-semibold text-foreground">
                Tipo de Registro *
              </label>
              <select
                id="order-doc-mode"
                value={documentMode}
                onChange={(e) => setDocumentMode(e.target.value as 'PEDIDO' | 'COTIZACION')}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PEDIDO">Pedido en Firme (PED-2026)</option>
                <option value="COTIZACION">Cotización Comercial (COT-2026)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-origin" className="font-semibold text-foreground">
                Canal de Origen *
              </label>
              <select
                id="order-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value as OrderOrigin)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ERP">ERP Planta</option>
                <option value="TIENDA_WEB">Tienda Web (WEB-XXXX)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-web-number" className="font-semibold text-foreground">
                Orden Tienda Web {origin === 'TIENDA_WEB' ? '*' : '(Opcional)'}
              </label>
              <Input
                id="order-web-number"
                value={webOrderNumber}
                onChange={(e) => setWebOrderNumber(e.target.value)}
                disabled={origin !== 'TIENDA_WEB'}
                placeholder="Ej. WEB-1058"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-client-select" className="font-semibold text-foreground">
                Cliente / Razón Social *
              </label>
              <select
                id="order-client-select"
                value={selectedClientId}
                onChange={(e) => handleClientSelectChange(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CLIENT_DIRECTORY_SEED.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.name} ({formatClientDocument(cli.documentNumber, cli.verificationDigit)})
                  </option>
                ))}
                <option value="CUSTOM">+ Ingresar otro cliente...</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-city" className="font-semibold text-foreground">
                Ciudad de Destino *
              </label>
              <Input
                id="order-city"
                required
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="Ej. Guaduas (Cundinamarca)"
                className="text-xs"
              />
            </div>
          </div>

          {isCustomClient && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-client-name" className="font-semibold text-foreground">
                  Nombre o Razón Social Nuevo Cliente *
                </label>
                <Input
                  id="custom-client-name"
                  required
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  placeholder="Ej. Parroquia Santa Ana"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-client-doc" className="font-semibold text-foreground">
                  NIT o Cédula *
                </label>
                <Input
                  id="custom-client-doc"
                  required
                  value={customClientDocument}
                  onChange={(e) => setCustomClientDocument(e.target.value)}
                  placeholder="Ej. 901.234.567-8"
                  className="text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-reception-date" className="font-semibold text-foreground">
                Fecha Recepción *
              </label>
              <Input
                id="order-reception-date"
                type="date"
                required
                value={receptionDate}
                onChange={(e) => setReceptionDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-delivery-date" className="font-semibold text-foreground">
                Entrega Pactada *
              </label>
              <Input
                id="order-delivery-date"
                type="date"
                required
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="order-payment-terms" className="font-semibold text-foreground">
                Condición de Pago *
              </label>
              <select
                id="order-payment-terms"
                value={paymentTerms}
                onChange={(e) =>
                  setPaymentTerms(e.target.value as SalesOrder['paymentTerms'])
                }
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Contado">Contado</option>
                <option value="Crédito 15 días">Crédito 15 días</option>
                <option value="Crédito 30 días">Crédito 30 días</option>
                <option value="Crédito 45 días">Crédito 45 días</option>
              </select>
            </div>
          </div>

          {/* Líneas de productos */}
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Productos del {documentMode === 'COTIZACION' ? 'Presupuesto' : 'Pedido'}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddItemRow}
                className="h-7 gap-1 text-[0.6875rem]"
              >
                <Plus className="size-3" /> Agregar Ítem
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {items.map((row, idx) => {
                const prod =
                  SALES_CATALOG_PRODUCTS.find((p) => p.id === row.productId) ??
                  SALES_CATALOG_PRODUCTS[0]
                const baseUnits = row.commercialQuantity * prod.unitsPerPresentation
                return (
                  <div
                    key={row.rowId}
                    className="grid grid-cols-1 gap-2 rounded-md border bg-background p-2.5 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="flex flex-col gap-1 sm:col-span-5">
                      <label
                        htmlFor={`item-prod-${idx}`}
                        className="text-[0.6875rem] font-medium text-muted-foreground"
                      >
                        Producto ({prod.commercialPresentation})
                      </label>
                      <select
                        id={`item-prod-${idx}`}
                        value={row.productId}
                        onChange={(e) => handleProductChange(row.rowId, e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                      >
                        {SALES_CATALOG_PRODUCTS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} · {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label
                        htmlFor={`item-qty-${idx}`}
                        className="text-[0.6875rem] font-medium text-muted-foreground"
                      >
                        Cant. ({formatNumber(baseUnits)} base)
                      </label>
                      <Input
                        id={`item-qty-${idx}`}
                        type="number"
                        min={1}
                        required
                        value={row.commercialQuantity}
                        onChange={(e) => {
                          const qty = Math.max(0, Number(e.target.value))
                          setItems((prev) =>
                            prev.map((it) =>
                              it.rowId === row.rowId ? { ...it, commercialQuantity: qty } : it
                            )
                          )
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-3">
                      <label
                        htmlFor={`item-price-${idx}`}
                        className="text-[0.6875rem] font-medium text-muted-foreground"
                      >
                        Vr. Unitario Base (COP)
                      </label>
                      <Input
                        id={`item-price-${idx}`}
                        type="number"
                        min={1}
                        required
                        value={row.unitPriceCOP}
                        onChange={(e) => {
                          const price = Math.max(0, Number(e.target.value))
                          setItems((prev) =>
                            prev.map((it) =>
                              it.rowId === row.rowId ? { ...it, unitPriceCOP: price } : it
                            )
                          )
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-end sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItemRow(row.rowId)}
                        className="h-8 px-2 text-muted-foreground hover:text-rose-600"
                        aria-label={`Eliminar línea ${idx + 1}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-1 sm:col-span-12">
                      <label
                        htmlFor={`item-note-${idx}`}
                        className="text-[0.6875rem] text-muted-foreground"
                      >
                        Detalle / Personalización (color, aroma o dedicatoria)
                      </label>
                      <Input
                        id={`item-note-${idx}`}
                        value={row.customizationNote}
                        onChange={(e) => {
                          const note = e.target.value
                          setItems((prev) =>
                            prev.map((it) =>
                              it.rowId === row.rowId ? { ...it, customizationNote: note } : it
                            )
                          )
                        }}
                        placeholder="Opcional: ej. Grabado litúrgico o etiqueta personalizada"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-2 font-semibold text-foreground">
              <span>Total Estimado del {documentMode === 'COTIZACION' ? 'Presupuesto' : 'Pedido'}:</span>
              <span className="font-mono text-sm text-primary">{formatCurrency(computedTotalCOP)}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold">
              {documentMode === 'COTIZACION' ? 'Guardar Cotización' : 'Crear Pedido'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
