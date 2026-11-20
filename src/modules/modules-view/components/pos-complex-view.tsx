'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Barcode,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Landmark,
  Lock,
  Minus,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Smartphone,
  Store,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/config'
import { PosElectronicInvoiceModal } from './sales/pos-electronic-invoice-modal'
import {
  CLIENT_DIRECTORY_SEED,
  CONSUMIDOR_FINAL_NAME,
  CONSUMIDOR_FINAL_NIT,
  FEDV_RESOLUTION,
  formatClientDocument,
  IVA_DIVISOR,
  POS_RESOLUTION,
  type ClientDirectoryEntry,
} from './sales/sales-constants'

interface PosCartItem {
  id: string
  name: string
  presentation: string
  quantity: number
  unitPrice: number
}

interface PosPaymentSplit {
  efectivo: number
  nequiDaviplata: number
  tarjetaDatafono: number
  transferenciaBancolombia: number
}

interface PosDigitalTotals {
  nequiDaviplata: number
  transferenciaBancolombia: number
  tarjetaDatafono: number
}

interface PosCompletedTicket {
  id: string
  documentCode: string
  documentType: 'POS' | 'FEDV'
  clientName: string
  clientDocument: string
  totalCOP: number
  changeCOP: number
  paymentBreakdownText: string
  issuedAt: string
}

const INITIAL_SHIFT_BASE = 100000
const INITIAL_EXPECTED_CASH_SALES = 350000
const INITIAL_DIGITAL_SHIFT_TOTALS: PosDigitalTotals = {
  nequiDaviplata: 185000,
  transferenciaBancolombia: 240000,
  tarjetaDatafono: 315000,
}

const EMPTY_PAYMENTS: PosPaymentSplit = {
  efectivo: 0,
  nequiDaviplata: 0,
  tarjetaDatafono: 0,
  transferenciaBancolombia: 0,
}

export function PosComplexView() {
  const [activeTab, setActiveTab] = useState<'counter' | 'shiftRegister'>('counter')
  const [catalogSearch, setCatalogSearch] = useState('')

  // Estado del mostrador rápido POS
  const [cartItems, setCartItems] = useState<PosCartItem[]>([
    {
      id: 'pos-1',
      name: 'Vela Litúrgica Tradicional Blanca',
      presentation: 'Paquete x 12',
      quantity: 3,
      unitPrice: 18000,
    },
    {
      id: 'pos-2',
      name: 'Velón Votivo 3 Días Blanco',
      presentation: 'Unidad',
      quantity: 5,
      unitPrice: 9500,
    },
  ])

  const [payments, setPayments] = useState<PosPaymentSplit>({
    efectivo: 100000,
    nequiDaviplata: 15000,
    tarjetaDatafono: 0,
    transferenciaBancolombia: 0,
  })

  // Consecutivos y clientes POS
  const [nextPosNumber, setNextPosNumber] = useState<number>(POS_RESOLUTION.currentNumber + 1)
  const [nextFedvNumber, setNextFedvNumber] = useState<number>(FEDV_RESOLUTION.currentNumber + 1)
  const [clientDirectory, setClientDirectory] =
    useState<ClientDirectoryEntry[]>(CLIENT_DIRECTORY_SEED)
  const [selectedClient, setSelectedClient] = useState<ClientDirectoryEntry | null>(null)
  const [isFedvModalOpen, setIsFedvModalOpen] = useState(false)
  const [lastCompletedTicket, setLastCompletedTicket] = useState<PosCompletedTicket | null>(null)

  // Ventas digitales acumuladas del turno (Tab 2 informativo)
  const [digitalShiftTotals, setDigitalShiftTotals] = useState<PosDigitalTotals>(
    INITIAL_DIGITAL_SHIFT_TOTALS
  )

  // Estado del arqueo de caja (Numeral 11 — se mantiene intacto)
  const [countedCash, setCountedCash] = useState<number>(450000)
  const [isShiftClosed, setIsShiftClosed] = useState(false)
  const initialBase = INITIAL_SHIFT_BASE
  const expectedCashSales = INITIAL_EXPECTED_CASH_SALES
  const totalExpectedCash = initialBase + expectedCashSales
  const cashDifference = countedCash - totalExpectedCash
  const isCashBalanced = cashDifference === 0

  // Cálculos de carrito y pago mixto real
  const cartTotal = cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0)
  const subtotalWithoutIva = Math.round(cartTotal / IVA_DIVISOR)
  const ivaAmount = cartTotal - subtotalWithoutIva

  const digitalPaid =
    payments.nequiDaviplata + payments.tarjetaDatafono + payments.transferenciaBancolombia
  const totalPaid = payments.efectivo + digitalPaid
  const remainingToPay = Math.max(0, cartTotal - totalPaid)

  // Vueltas SOLO sobre efectivo: el efectivo recibido primero cubre lo que falte tras los pagos digitales
  const remainingAfterDigital = Math.max(0, cartTotal - digitalPaid)
  const cashChange =
    cartTotal > 0 && digitalPaid <= cartTotal
      ? Math.max(0, payments.efectivo - remainingAfterDigital)
      : 0

  const isDigitalOverTotal = cartTotal > 0 && digitalPaid > cartTotal
  const isInsufficientPayment = cartTotal > 0 && totalPaid < cartTotal
  const isPaymentValid =
    cartItems.length > 0 && cartTotal > 0 && totalPaid >= cartTotal && !isDigitalOverTotal

  const paymentValidationMessage =
    cartItems.length === 0
      ? 'Agregue al menos un producto al ticket para cobrar.'
      : isDigitalOverTotal
      ? `Los medios electrónicos suman ${formatCurrency(digitalPaid)} y superan el total (${formatCurrency(cartTotal)}). Las vueltas aplican únicamente sobre efectivo.`
      : isInsufficientPayment
      ? `Faltan ${formatCurrency(remainingToPay)} para cubrir el total del ticket.`
      : null

  const filteredCatalog = POS_CATALOG_DEMO.filter((prod) => {
    const q = catalogSearch.trim().toLowerCase()
    if (!q) return true
    return prod.name.toLowerCase().includes(q) || prod.sku.toLowerCase().includes(q)
  })

  const addProductToCart = (prod: (typeof POS_CATALOG_DEMO)[number]) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === prod.id)
      if (exists) {
        return prev.map((i) => (i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          presentation: prod.presentation,
          quantity: 1,
          unitPrice: prod.priceCOP,
        },
      ]
    })
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const handlePaymentInput = (key: keyof PosPaymentSplit, rawValue: string) => {
    const parsed = Math.max(0, Math.floor(Number(rawValue) || 0))
    setPayments((prev) => ({ ...prev, [key]: parsed }))
  }

  const fillRemainingIntoMethod = (key: keyof PosPaymentSplit) => {
    const otherSum = totalPaid - payments[key]
    const needed = Math.max(0, cartTotal - otherSum)
    setPayments((prev) => ({ ...prev, [key]: needed }))
  }

  const buildPaymentBreakdownText = (): string => {
    const parts: string[] = []
    if (payments.efectivo > 0) {
      const netCash = Math.max(0, payments.efectivo - cashChange)
      parts.push(`Efectivo: ${formatCurrency(netCash)}`)
    }
    if (payments.nequiDaviplata > 0) {
      parts.push(`Nequi/Daviplata: ${formatCurrency(payments.nequiDaviplata)}`)
    }
    if (payments.tarjetaDatafono > 0) {
      parts.push(`Tarjeta/Datáfono: ${formatCurrency(payments.tarjetaDatafono)}`)
    }
    if (payments.transferenciaBancolombia > 0) {
      parts.push(`Transferencia Bancolombia: ${formatCurrency(payments.transferenciaBancolombia)}`)
    }
    return parts.join(' | ') || 'Sin pago'
  }

  const recordDigitalShiftContribution = () => {
    setDigitalShiftTotals((prev) => ({
      nequiDaviplata: prev.nequiDaviplata + payments.nequiDaviplata,
      tarjetaDatafono: prev.tarjetaDatafono + payments.tarjetaDatafono,
      transferenciaBancolombia: prev.transferenciaBancolombia + payments.transferenciaBancolombia,
    }))
  }

  const handleCompletePosEquivalent = () => {
    if (!isPaymentValid) {
      toast.error(paymentValidationMessage || 'Verifique los montos de pago.')
      return
    }
    const docCode = `${POS_RESOLUTION.prefix}-${String(nextPosNumber).padStart(5, '0')}`
    const clientName = selectedClient?.name ?? CONSUMIDOR_FINAL_NAME
    const clientDoc = selectedClient
      ? formatClientDocument(selectedClient.documentNumber, selectedClient.verificationDigit)
      : CONSUMIDOR_FINAL_NIT
    const breakdownText = buildPaymentBreakdownText()

    recordDigitalShiftContribution()
    setLastCompletedTicket({
      id: `tkt-${Date.now()}`,
      documentCode: docCode,
      documentType: 'POS',
      clientName,
      clientDocument: clientDoc,
      totalCOP: cartTotal,
      changeCOP: cashChange,
      paymentBreakdownText: breakdownText,
      issuedAt: new Date().toISOString(),
    })
    setNextPosNumber((prev) => prev + 1)
    setCartItems([])
    setPayments(EMPTY_PAYMENTS)
    toast.success(
      `Documento Equivalente ${docCode} emitido a ${clientName} (${clientDoc}). Vueltas: ${formatCurrency(cashChange)}.`
    )
  }

  const handleConfirmEmitFedv = (client: ClientDirectoryEntry) => {
    if (!isPaymentValid) {
      toast.error(paymentValidationMessage || 'Verifique los montos de pago.')
      return
    }
    const docCode = `${FEDV_RESOLUTION.prefix}-${nextFedvNumber}`
    const formattedDoc = formatClientDocument(client.documentNumber, client.verificationDigit)
    const breakdownText = buildPaymentBreakdownText()

    setSelectedClient(client)
    recordDigitalShiftContribution()
    setLastCompletedTicket({
      id: `tkt-${Date.now()}`,
      documentCode: docCode,
      documentType: 'FEDV',
      clientName: client.name,
      clientDocument: formattedDoc,
      totalCOP: cartTotal,
      changeCOP: cashChange,
      paymentBreakdownText: breakdownText,
      issuedAt: new Date().toISOString(),
    })
    setNextFedvNumber((prev) => prev + 1)
    setCartItems([])
    setPayments(EMPTY_PAYMENTS)
    toast.success(
      `Factura Electrónica ${docCode} generada para ${client.name} (${client.documentType} ${formattedDoc}).`
    )
  }

  const totalDigitalShiftRevenue =
    digitalShiftTotals.nequiDaviplata +
    digitalShiftTotals.transferenciaBancolombia +
    digitalShiftTotals.tarjetaDatafono

  const activeClientLabel = selectedClient
    ? `${selectedClient.name} (${selectedClient.documentType} ${formatClientDocument(selectedClient.documentNumber, selectedClient.verificationDigit)})`
    : `${CONSUMIDOR_FINAL_NAME} (${CONSUMIDOR_FINAL_NIT})`

  return (
    <div className="flex flex-col gap-6 bg-background p-4 sm:p-6">
      {/* Selector de pestañas POS */}
      <nav
        aria-label="Vistas del Punto de Venta POS"
        className="flex flex-wrap items-center gap-2 border-b pb-3"
      >
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'counter' ? 'default' : 'outline'}
          onClick={() => setActiveTab('counter')}
          className="gap-1.5 text-xs"
        >
          <Store className="size-3.5" aria-hidden="true" />
          Mostrador de Venta Rápida &amp; Cobro POS
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'shiftRegister' ? 'default' : 'outline'}
          onClick={() => setActiveTab('shiftRegister')}
          className="gap-1.5 text-xs"
        >
          <Receipt className="size-3.5" aria-hidden="true" />
          Control de Turnos, Cierre y Arqueo de Caja
        </Button>
      </nav>

      {/* PESTAÑA 1: MOSTRADOR RÁPIDO DE VENTA POS */}
      {activeTab === 'counter' && (
        <section aria-labelledby="heading-pos-counter" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <h3 id="heading-pos-counter" className="sr-only">
            Mostrador de Venta Rápida POS y Pago Mixto
          </h3>

          {/* Panel Izquierdo: Catálogo Rápido con Lector de Barras */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
              <Barcode className="size-4 text-muted-foreground" aria-hidden="true" />
              <label htmlFor="pos-barcode-search" className="sr-only">
                Escanear código de barras o buscar producto
              </label>
              <input
                id="pos-barcode-search"
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const exactMatch = POS_CATALOG_DEMO.find(
                      (p) => p.sku.toLowerCase() === catalogSearch.trim().toLowerCase()
                    )
                    if (exactMatch) {
                      addProductToCart(exactMatch)
                      setCatalogSearch('')
                      toast.success(`${exactMatch.name} agregado al ticket.`)
                    }
                  }
                }}
                placeholder="Escanear código de barras o buscar producto (F9)..."
                className="w-full bg-transparent text-xs outline-hidden placeholder:text-muted-foreground"
              />
              <Badge variant="outline" className="shrink-0 text-[0.625rem]">
                Lector Activo
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredCatalog.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => addProductToCart(prod)}
                  className="flex cursor-pointer flex-col justify-between rounded-lg border bg-card p-3 text-left shadow-2xs transition-all hover:border-primary hover:shadow-xs"
                >
                  <div>
                    <div className="line-clamp-1 text-xs font-semibold text-foreground">
                      {prod.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
                      <span className="font-mono">{prod.sku}</span>
                      <span>&bull;</span>
                      <span>{prod.presentation}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-[0.6875rem] text-muted-foreground">
                      Stock: {prod.stock} uds
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {formatCurrency(prod.priceCOP)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Banner último comprobante emitido */}
            {lastCompletedTicket && (
              <div
                role="status"
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-950 dark:text-emerald-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
                    <span>
                      Última Venta Emitida: {lastCompletedTicket.documentCode} (
                      {lastCompletedTicket.documentType === 'FEDV'
                        ? 'Factura Electrónica DIAN'
                        : 'Doc. Equivalente POS'}
                      )
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {formatCurrency(lastCompletedTicket.totalCOP)}
                  </span>
                </div>
                <div className="mt-1 text-[0.6875rem]">
                  Cliente: <strong>{lastCompletedTicket.clientName}</strong> (
                  {lastCompletedTicket.clientDocument}) · Medios:{' '}
                  {lastCompletedTicket.paymentBreakdownText}
                  {lastCompletedTicket.changeCOP > 0
                    ? ` · Vueltas entregadas: ${formatCurrency(lastCompletedTicket.changeCOP)}`
                    : ''}
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Ticket de Venta, Pago Mixto Real y Doc. Equivalente POS / FEDV */}
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 lg:col-span-5">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <ShoppingCart className="size-4" aria-hidden="true" /> Ticket de Venta Actual
              </div>
              <Badge variant="info" className="font-mono text-[0.625rem]">
                Doc. Equivalente {POS_RESOLUTION.prefix}-{String(nextPosNumber).padStart(5, '0')}
              </Badge>
            </div>

            {/* Cliente por defecto Consumidor Final (222222222222) */}
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="truncate">
                  <span className="text-[0.6875rem] text-muted-foreground">Adquirente: </span>
                  <strong className="text-foreground">{activeClientLabel}</strong>
                </div>
              </div>
              {selectedClient && (
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="inline-flex shrink-0 items-center gap-1 text-[0.6875rem] font-medium text-primary hover:underline"
                  title="Volver a Consumidor Final (222222222222)"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Consumidor Final
                </button>
              )}
            </div>

            {/* Listado del Carrito */}
            <div className="max-h-48 divide-y divide-border/50 overflow-y-auto text-xs">
              {cartItems.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">
                  Ticket vacío. Seleccione productos del catálogo para iniciar una venta.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">{item.name}</div>
                      <div className="text-[0.625rem] text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)} ({item.presentation})
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -1)}
                        className="flex size-5 items-center justify-center rounded border bg-background text-muted-foreground hover:text-foreground"
                        aria-label={`Disminuir cantidad de ${item.name}`}
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center font-mono text-[0.6875rem] font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, 1)}
                        className="flex size-5 items-center justify-center rounded border bg-background text-muted-foreground hover:text-foreground"
                        aria-label={`Aumentar cantidad de ${item.name}`}
                      >
                        <Plus className="size-3" />
                      </button>
                      <span className="ml-1 w-20 text-right font-mono font-bold">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCartItems((prev) => prev.filter((i) => i.id !== item.id))
                        }
                        className="text-muted-foreground hover:text-rose-500"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totalizadores y Pago Mixto Real */}
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal sin IVA:</span>
                <span className="font-mono">{formatCurrency(subtotalWithoutIva)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (19% discriminado):</span>
                <span className="font-mono">{formatCurrency(ivaAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold text-foreground">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-base text-primary">{formatCurrency(cartTotal)}</span>
              </div>

              {/* Pago Mixto Real: 4 medios simultáneos */}
              <div className="mt-1 flex flex-col gap-2 border-t pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Pago Mixto (digite monto por medio):
                  </span>
                  <button
                    type="button"
                    onClick={() => setPayments(EMPTY_PAYMENTS)}
                    className="text-[0.6875rem] text-muted-foreground hover:text-foreground"
                  >
                    Limpiar montos
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* 1. Efectivo */}
                  <div className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2.5 py-1.5">
                    <label
                      htmlFor="pos-pay-cash"
                      className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-foreground"
                    >
                      <Wallet className="size-3.5 text-emerald-600" aria-hidden="true" />
                      Efectivo
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="pos-pay-cash"
                        type="number"
                        min={0}
                        value={payments.efectivo}
                        onChange={(e) => handlePaymentInput('efectivo', e.target.value)}
                        className="w-28 rounded border bg-background px-2 py-1 text-right font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => fillRemainingIntoMethod('efectivo')}
                        className="rounded border bg-background px-1.5 py-1 text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Exacto
                      </button>
                    </div>
                  </div>

                  {/* 2. Nequi / Daviplata */}
                  <div className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2.5 py-1.5">
                    <label
                      htmlFor="pos-pay-nequi"
                      className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-foreground"
                    >
                      <Smartphone className="size-3.5 text-purple-600" aria-hidden="true" />
                      Nequi / Daviplata
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="pos-pay-nequi"
                        type="number"
                        min={0}
                        value={payments.nequiDaviplata}
                        onChange={(e) => handlePaymentInput('nequiDaviplata', e.target.value)}
                        className="w-28 rounded border bg-background px-2 py-1 text-right font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => fillRemainingIntoMethod('nequiDaviplata')}
                        className="rounded border bg-background px-1.5 py-1 text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Exacto
                      </button>
                    </div>
                  </div>

                  {/* 3. Tarjeta / Datáfono */}
                  <div className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2.5 py-1.5">
                    <label
                      htmlFor="pos-pay-card"
                      className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-foreground"
                    >
                      <CreditCard className="size-3.5 text-sky-600" aria-hidden="true" />
                      Tarjeta / Datáfono
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="pos-pay-card"
                        type="number"
                        min={0}
                        value={payments.tarjetaDatafono}
                        onChange={(e) => handlePaymentInput('tarjetaDatafono', e.target.value)}
                        className="w-28 rounded border bg-background px-2 py-1 text-right font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => fillRemainingIntoMethod('tarjetaDatafono')}
                        className="rounded border bg-background px-1.5 py-1 text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Exacto
                      </button>
                    </div>
                  </div>

                  {/* 4. Transferencia Bancolombia */}
                  <div className="flex items-center justify-between gap-2 rounded border bg-muted/20 px-2.5 py-1.5">
                    <label
                      htmlFor="pos-pay-bancolombia"
                      className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-foreground"
                    >
                      <Landmark className="size-3.5 text-amber-600" aria-hidden="true" />
                      Transferencia Bancolombia
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="pos-pay-bancolombia"
                        type="number"
                        min={0}
                        value={payments.transferenciaBancolombia}
                        onChange={(e) =>
                          handlePaymentInput('transferenciaBancolombia', e.target.value)
                        }
                        className="w-28 rounded border bg-background px-2 py-1 text-right font-mono text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => fillRemainingIntoMethod('transferenciaBancolombia')}
                        className="rounded border bg-background px-1.5 py-1 text-[0.625rem] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Exacto
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resumen de validación y vueltas solo sobre efectivo */}
                <div className="flex flex-col gap-1 rounded bg-muted/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.6875rem] text-muted-foreground">
                      Suma Recibida (Mixto):
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        totalPaid >= cartTotal && !isDigitalOverTotal
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  {remainingToPay > 0 && (
                    <div className="flex items-center justify-between text-[0.6875rem] font-semibold text-rose-600 dark:text-rose-400">
                      <span>Saldo Faltante:</span>
                      <span className="font-mono">{formatCurrency(remainingToPay)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t pt-1 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Cambio / Vueltas (solo efectivo):
                    </span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(cashChange)}
                    </span>
                  </div>
                </div>

                {paymentValidationMessage && (
                  <div
                    role="alert"
                    className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[0.6875rem] text-rose-700 dark:text-rose-300"
                  >
                    {paymentValidationMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Acciones de Cierre de Venta POS */}
            <div className="mt-1 flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!isPaymentValid}
                onClick={handleCompletePosEquivalent}
                className="w-full gap-1.5 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                <Receipt className="size-4" aria-hidden="true" />
                Cobrar e Imprimir Doc. Equivalente POS
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info(
                      lastCompletedTicket
                        ? `Reimprimiendo ticket térmico 80mm (${lastCompletedTicket.documentCode}).`
                        : `Vista previa Ticket Térmico 80mm preparada (${formatCurrency(cartTotal)}).`
                    )
                  }
                  className="flex-1 gap-1 text-[0.6875rem]"
                >
                  <Printer className="size-3" aria-hidden="true" /> Ticket Térmico 80mm
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={cartItems.length === 0}
                  onClick={() => setIsFedvModalOpen(true)}
                  className="flex-1 gap-1 text-[0.6875rem]"
                >
                  <FileCheck2 className="size-3" aria-hidden="true" /> Emitir Factura Electrónica
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PESTAÑA 2: CONTROL DE TURNOS Y ARQUEO DE CAJA (NUMERAL 11) */}
      {activeTab === 'shiftRegister' && (
        <section aria-labelledby="heading-pos-shift" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Cajero Activo</div>
              <div className="text-sm font-bold text-foreground">Diana Carolina Vargas</div>
              <div className="font-mono text-[0.6875rem] text-muted-foreground">
                Turno Mañana (08:00 - 16:00)
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Base Inicial Efectivo</div>
              <div className="font-mono text-base font-bold text-foreground">
                {formatCurrency(initialBase)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Ventas Efectivo del Turno</div>
              <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(expectedCashSales)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Total Esperado en Caja</div>
              <div className="font-mono text-base font-bold text-primary">
                {formatCurrency(totalExpectedCash)}
              </div>
            </div>
          </div>

          {/* Tarjeta informativa requerida: Ventas Digitales del Turno (Nequi / Daviplata / Bancolombia / Datáfono) */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-50/40 p-4 dark:bg-sky-950/20">
            <div className="flex flex-col gap-2 border-b border-sky-500/20 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground">
                  Ventas Digitales del Turno (Nequi / Daviplata / Bancolombia / Datáfono)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="info" className="text-[0.6875rem]">
                  Informativo · Conciliación Bancaria
                </Badge>
                <span className="font-mono text-sm font-bold text-sky-700 dark:text-sky-300">
                  {formatCurrency(totalDigitalShiftRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-background/90 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Smartphone className="size-3.5 text-purple-600" aria-hidden="true" />
                  <span>Nequi / Daviplata</span>
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-foreground">
                  {formatCurrency(digitalShiftTotals.nequiDaviplata)}
                </div>
              </div>

              <div className="rounded-lg border bg-background/90 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Landmark className="size-3.5 text-amber-600" aria-hidden="true" />
                  <span>Transferencia Bancolombia</span>
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-foreground">
                  {formatCurrency(digitalShiftTotals.transferenciaBancolombia)}
                </div>
              </div>

              <div className="rounded-lg border bg-background/90 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CreditCard className="size-3.5 text-sky-600" aria-hidden="true" />
                  <span>Tarjeta / Datáfono</span>
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-foreground">
                  {formatCurrency(digitalShiftTotals.tarjetaDatafono)}
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-[0.6875rem] text-muted-foreground">
              Estos valores ingresan directamente a cuentas bancarias / pasarela de datáfono y no
              afectan el conteo físico de efectivo en gaveta.
            </p>
          </div>

          {/* Arqueo Físico de Efectivo (NO modificado) */}
          <div className="rounded-xl border bg-background p-4 shadow-xs">
            <h3
              id="heading-pos-shift"
              className="flex items-center justify-between border-b pb-2 text-sm font-bold text-foreground"
            >
              <span>Arqueo Físico y Cierre de Turno de Mostrador</span>
              <Badge variant="outline">
                POS-01 Mostrador Guaduas {isShiftClosed ? '· Cerrado' : ''}
              </Badge>
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3.5">
                <label
                  htmlFor="pos-counted-cash"
                  className="text-xs font-semibold text-foreground"
                >
                  Conteo Físico Real de Billetes y Monedas:
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    id="pos-counted-cash"
                    type="number"
                    disabled={isShiftClosed}
                    value={countedCash}
                    onChange={(e) => setCountedCash(Number(e.target.value))}
                    className="flex-1 rounded border bg-background px-3 py-1.5 font-mono text-sm font-bold text-foreground disabled:opacity-60"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isShiftClosed}
                    onClick={() => setCountedCash(totalExpectedCash)}
                  >
                    Calcular Exacto
                  </Button>
                </div>
                <span className="text-[0.6875rem] text-muted-foreground">
                  Ingrese el valor total contado en la gaveta física al cerrar el turno.
                </span>
              </div>

              <div className="flex flex-col justify-between rounded-lg border bg-muted/20 p-3.5">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Resultado del Cuadre de Caja:
                  </div>
                  <div className="mt-2">
                    {isCashBalanced ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                        🟢 Caja Cuadrada ($0 de diferencia)
                      </div>
                    ) : cashDifference > 0 ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-5" aria-hidden="true" />
                        🟡 Alerta: Sobrante de dinero (+{formatCurrency(cashDifference)})
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="size-5" aria-hidden="true" />
                        🔴 Alerta de Descuadre: Faltante (-
                        {formatCurrency(Math.abs(cashDifference))})
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toast.info(
                        `Comprobante Z generado: Efectivo ${formatCurrency(countedCash)} | Digital ${formatCurrency(totalDigitalShiftRevenue)}.`
                      )
                    }
                    className="gap-1 text-xs"
                  >
                    <Printer className="size-3.5" aria-hidden="true" /> Imprimir Comprobante Z
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isShiftClosed}
                    onClick={() => {
                      setIsShiftClosed(true)
                      toast.success(
                        `Turno cerrado y bloqueado con Comprobante Z (Efectivo: ${formatCurrency(countedCash)}, Digitales: ${formatCurrency(totalDigitalShiftRevenue)}).`
                      )
                    }}
                    className="gap-1 text-xs font-semibold"
                  >
                    <Lock className="size-3.5" aria-hidden="true" />{' '}
                    {isShiftClosed ? 'Turno Cerrado' : 'Cerrar y Bloquear Turno'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modal: Buscador Rápido o Creación de Cliente para Factura Electrónica FEDV */}
      <PosElectronicInvoiceModal
        isOpen={isFedvModalOpen}
        nextFedvNumber={nextFedvNumber}
        totalAmountCOP={cartTotal}
        clients={clientDirectory}
        selectedClient={selectedClient}
        paymentSummaryText={buildPaymentBreakdownText()}
        isPaymentValid={isPaymentValid}
        paymentValidationMessage={paymentValidationMessage}
        onClose={() => setIsFedvModalOpen(false)}
        onCreateClient={(newClient) => {
          setClientDirectory((prev) => [newClient, ...prev])
          setSelectedClient(newClient)
        }}
        onConfirmEmitFedv={handleConfirmEmitFedv}
      />
    </div>
  )
}

const POS_CATALOG_DEMO = [
  {
    id: 'pos-1',
    sku: 'PT-VLT-TRAD',
    name: 'Vela Litúrgica Tradicional Blanca',
    presentation: 'Paquete x 12',
    priceCOP: 18000,
    stock: 240,
  },
  {
    id: 'pos-2',
    sku: 'PT-V3D-BLA',
    name: 'Velón Votivo 3 Días Blanco',
    presentation: 'Unidad',
    priceCOP: 9500,
    stock: 180,
  },
  {
    id: 'pos-3',
    sku: 'PT-VEL-7POT',
    name: 'Velón 7 Potencias Multicolor 15 cm',
    presentation: 'Unidad',
    priceCOP: 12500,
    stock: 95,
  },
  {
    id: 'pos-4',
    sku: 'PT-CIR-PAS-60',
    name: 'Cirio Pascual Consagrado 12x60 cm',
    presentation: 'Unidad',
    priceCOP: 110000,
    stock: 18,
  },
]
