'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck2,
  Lock,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, formatNumber } from '@/lib/config'

export function PosComplexView() {
  const [activeTab, setActiveTab] = useState<'counter' | 'shiftRegister'>('counter')

  // Estado del mostrador rápido POS
  const [cartItems, setCartItems] = useState<
    Array<{ id: string; name: string; presentation: string; quantity: number; unitPrice: number }>
  >([
    {
      id: 'p-1',
      name: 'Vela Litúrgica Tradicional Blanca',
      presentation: 'Paquete x 12',
      quantity: 3,
      unitPrice: 18000,
    },
    {
      id: 'p-2',
      name: 'Velón Votivo 3 Días Blanco',
      presentation: 'Unidad',
      quantity: 5,
      unitPrice: 9500,
    },
  ])

  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta'>('Efectivo')
  const [cashReceived, setCashReceived] = useState<number>(120000)

  const cartTotal = cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0)
  const cashChange = Math.max(0, cashReceived - cartTotal)

  // Estado del arqueo de caja (Numeral 11)
  const [countedCash, setCountedCash] = useState<number>(450000)
  const initialBase = 100000
  const expectedCashSales = 350000
  const totalExpectedCash = initialBase + expectedCashSales
  const cashDifference = countedCash - totalExpectedCash
  const isCashBalanced = cashDifference === 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Selector de pestañas POS */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'counter' ? 'default' : 'outline'}
          onClick={() => setActiveTab('counter')}
          className="text-xs gap-1.5"
        >
          <Store className="size-3.5" />
          Mostrador de Venta Rápida &amp; Cobro POS
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'shiftRegister' ? 'default' : 'outline'}
          onClick={() => setActiveTab('shiftRegister')}
          className="text-xs gap-1.5"
        >
          <Receipt className="size-3.5" />
          Control de Turnos, Cierre y Arqueo de Caja
        </Button>
      </div>

      {/* PESTAÑA 1: MOSTRADOR RÁPIDO DE VENTA POS */}
      {activeTab === 'counter' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Panel Izquierdo: Catálogo Rápido con Lector de Barras */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
              <Barcode className="size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Escanear código de barras o buscar producto (F9)..."
                className="w-full bg-transparent text-xs outline-hidden placeholder:text-muted-foreground"
                defaultValue=""
              />
              <Badge variant="outline" className="text-[0.625rem]">Lector Activo</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {POS_CATALOG_DEMO.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setCartItems((prev) => {
                      const exists = prev.find((i) => i.id === prod.id)
                      if (exists) {
                        return prev.map((i) =>
                          i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i
                        )
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
                  }}
                  className="flex cursor-pointer flex-col justify-between rounded-lg border bg-card p-3 shadow-2xs transition-all hover:border-primary hover:shadow-xs"
                >
                  <div>
                    <div className="font-semibold text-xs text-foreground line-clamp-1">{prod.name}</div>
                    <div className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground mt-0.5">
                      <span className="font-mono">{prod.sku}</span>
                      <span>&bull;</span>
                      <span>{prod.presentation}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-2">
                    <span className="text-[0.6875rem] text-muted-foreground">Stock: {prod.stock} uds</span>
                    <span className="font-mono font-bold text-xs text-primary">{formatCurrency(prod.priceCOP)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Derecho: Ticket de Venta, Medios de Pago y Doc. Equivalente POS */}
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 lg:col-span-5">
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                <ShoppingCart className="size-4" /> Ticket de Venta Actual
              </div>
              <Badge variant="info" className="text-[0.625rem]">Doc. Equivalente POS-01451</Badge>
            </div>

            {/* Listado del Carrito */}
            <div className="max-h-56 divide-y divide-border/50 overflow-y-auto text-xs">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="text-[0.625rem] text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.unitPrice)} ({item.presentation})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    <button
                      type="button"
                      onClick={() => setCartItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totalizadores y Métodos de Pago */}
            <div className="rounded-lg border bg-background p-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal sin IVA:</span>
                <span className="font-mono">{formatCurrency(Math.round(cartTotal / 1.19))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA (19% discriminado):</span>
                <span className="font-mono">{formatCurrency(cartTotal - Math.round(cartTotal / 1.19))}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground border-t pt-2">
                <span>TOTAL A PAGAR:</span>
                <span className="font-mono text-primary text-base">{formatCurrency(cartTotal)}</span>
              </div>

              {/* Selector de Medios de Pago */}
              <div className="mt-2 flex items-center gap-1.5 border-t pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`flex-1 rounded py-1 text-center font-semibold text-[0.6875rem] transition-colors ${
                    paymentMethod === 'Efectivo' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferencia')}
                  className={`flex-1 rounded py-1 text-center font-semibold text-[0.6875rem] transition-colors ${
                    paymentMethod === 'Transferencia' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Nequi/Daviplata
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Tarjeta')}
                  className={`flex-1 rounded py-1 text-center font-semibold text-[0.6875rem] transition-colors ${
                    paymentMethod === 'Tarjeta' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Tarjeta/Datáfono
                </button>
              </div>

              {paymentMethod === 'Efectivo' && (
                <div className="mt-2 rounded bg-muted/40 p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.6875rem] text-muted-foreground">Efectivo Recibido:</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="w-24 rounded border bg-background px-1.5 py-0.5 text-right font-mono font-bold text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-1 font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400">Cambio / Vueltas:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(cashChange)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones de Cierre de Venta POS */}
            <div className="flex flex-col gap-2 mt-1">
              <Button size="sm" className="w-full gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                <Receipt className="size-4" /> Cobrar e Imprimir Doc. Equivalente POS
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-[0.6875rem] gap-1">
                  <Printer className="size-3" /> Ticket Térmico 80mm
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-[0.6875rem] gap-1">
                  <FileCheck2 className="size-3" /> Emitir Factura Electrónica
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONTROL DE TURNOS Y ARQUEO DE CAJA (NUMERAL 11) */}
      {activeTab === 'shiftRegister' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Cajero Activo</div>
              <div className="font-bold text-sm text-foreground">Diana Carolina Vargas</div>
              <div className="text-[0.6875rem] text-muted-foreground font-mono">Turno Mañana (08:00 - 16:00)</div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Base Inicial Efectivo</div>
              <div className="font-mono font-bold text-base text-foreground">{formatCurrency(initialBase)}</div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Ventas Efectivo del Turno</div>
              <div className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {formatCurrency(expectedCashSales)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3.5">
              <div className="text-xs text-muted-foreground">Total Esperado en Caja</div>
              <div className="font-mono font-bold text-base text-primary">{formatCurrency(totalExpectedCash)}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-background p-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center justify-between">
              <span>Arqueo Físico y Cierre de Turno de Mostrador</span>
              <Badge variant="outline">Caja Principal 01 - Funza</Badge>
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3.5">
                <div className="text-xs font-semibold text-foreground">Conteo Físico Real de Billetes y Monedas:</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(Number(e.target.value))}
                    className="flex-1 rounded border bg-background px-3 py-1.5 font-mono font-bold text-sm text-foreground"
                  />
                  <Button size="sm" variant="outline" onClick={() => setCountedCash(totalExpectedCash)}>
                    Calcular Exacto
                  </Button>
                </div>
                <span className="text-[0.6875rem] text-muted-foreground">
                  Ingrese el valor total contado en la gaveta física al cerrar el turno.
                </span>
              </div>

              <div className="flex flex-col justify-between rounded-lg border bg-muted/20 p-3.5">
                <div>
                  <div className="text-xs font-semibold text-foreground">Resultado del Cuadre de Caja:</div>
                  <div className="mt-2">
                    {isCashBalanced ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-5" />
                        🟢 Caja Cuadrada ($0 de diferencia)
                      </div>
                    ) : cashDifference > 0 ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-5" />
                        🟡 Alerta: Sobrante de dinero (+{formatCurrency(cashDifference)})
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                        <AlertCircle className="size-5" />
                        🔴 Alerta de Descuadre: Faltante (-{formatCurrency(Math.abs(cashDifference))})
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-2 border-t pt-2.5">
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Printer className="size-3.5" /> Imprimir Comprobante Z
                  </Button>
                  <Button size="sm" className="text-xs gap-1 font-semibold">
                    <Lock className="size-3.5" /> Cerrar y Bloquear Turno
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
