import { formatCurrency } from '@/lib/config'

/**
 * Estado de Costos de Producción y Ventas (12 líneas, Decreto 2650).
 * Componente ÚNICO compartido entre Contabilidad (Pestaña 2) y Reportes (REP-CST-09).
 * En Fase 3, `values` saldrá de la misma consulta SQL que alimenta la cuenta 612095.
 */
export interface CostStatementValues {
  rawMaterialOpening: number
  netPurchases: number
  rawMaterialClosing: number
  directLabor: number
  overhead: number
  wipOpening: number
  wipClosing: number
  finishedGoodsOpening: number
  finishedGoodsClosing: number
}

/** Datos de demostración del periodo 2026-Q1 (cuadrados con el PUC de Contabilidad) */
export const COST_STATEMENT_DEMO: CostStatementValues = {
  rawMaterialOpening: 24_500_000,
  netPurchases: 73_500_000,
  rawMaterialClosing: 29_800_000,
  directLabor: 14_200_000,
  overhead: 8_600_000,
  wipOpening: 8_900_000,
  wipClosing: 5_600_000,
  finishedGoodsOpening: 21_800_000,
  finishedGoodsClosing: 32_400_000,
}

export function computeCostStatement(v: CostStatementValues) {
  const rawMaterialUsed = v.rawMaterialOpening + v.netPurchases - v.rawMaterialClosing
  const productionCost = rawMaterialUsed + v.directLabor + v.overhead
  const finishedGoodsCost = productionCost + v.wipOpening - v.wipClosing
  const costOfSales = finishedGoodsCost + v.finishedGoodsOpening - v.finishedGoodsClosing
  return { rawMaterialUsed, productionCost, finishedGoodsCost, costOfSales }
}

type LineKind = 'base' | 'add' | 'subtract' | 'subtotal' | 'total'

interface StatementLine {
  label: string
  amount: number
  kind: LineKind
}

const LINE_STYLES: Record<LineKind, string> = {
  base: 'py-2 flex justify-between font-semibold text-foreground',
  add: 'py-2 flex justify-between text-muted-foreground pl-4',
  subtract: 'py-2 flex justify-between text-muted-foreground pl-4',
  subtotal: 'py-2.5 flex justify-between font-bold text-foreground bg-muted/20 px-2 rounded',
  total: 'py-3 flex justify-between font-bold text-sm text-primary bg-primary/10 px-3 rounded',
}

const formatSigned = (kind: LineKind, amount: number) =>
  kind === 'add' ? `+${formatCurrency(amount)}` : kind === 'subtract' ? `-${formatCurrency(amount)}` : formatCurrency(amount)

interface CostStatementTableProps {
  values?: CostStatementValues
}

export function CostStatementTable({ values = COST_STATEMENT_DEMO }: CostStatementTableProps) {
  const totals = computeCostStatement(values)

  const lines: StatementLine[] = [
    { label: '1. Inventario Inicial de Materias Primas (140501)', amount: values.rawMaterialOpening, kind: 'base' },
    { label: '(+) Compras Netas de Parafinas, Ceras y Pabilos', amount: values.netPurchases, kind: 'add' },
    { label: '(-) Inventario Final de Materias Primas (140501)', amount: values.rawMaterialClosing, kind: 'subtract' },
    { label: '(=) Materia Prima Directa Utilizada en Fábrica', amount: totals.rawMaterialUsed, kind: 'subtotal' },
    { label: '(+) Mano de Obra Directa (MOD — 720501)', amount: values.directLabor, kind: 'add' },
    { label: '(+) Costos Indirectos de Fabricación y Gas (CIF — 730501)', amount: values.overhead, kind: 'add' },
    { label: '(=) Costo Total de Producción del Periodo', amount: totals.productionCost, kind: 'subtotal' },
    { label: '(+) Inventario Inicial de Productos en Proceso (141001)', amount: values.wipOpening, kind: 'add' },
    { label: '(-) Inventario Final de Productos en Proceso (141001)', amount: values.wipClosing, kind: 'subtract' },
    { label: '(=) Costo de Productos Terminados en el Periodo', amount: totals.finishedGoodsCost, kind: 'subtotal' },
    { label: '(+) Inventario Inicial de Producto Terminado (143005)', amount: values.finishedGoodsOpening, kind: 'add' },
    { label: '(-) Inventario Final de Producto Terminado (143005)', amount: values.finishedGoodsClosing, kind: 'subtract' },
    { label: '(=) COSTO DE VENTAS TOTAL (CUENTA 612095)', amount: totals.costOfSales, kind: 'total' },
  ]

  return (
    <div className="divide-y divide-border/50 text-xs" role="table" aria-label="Estado de Costos de Producción y Ventas">
      {lines.map((line) => (
        <div key={line.label} role="row" className={LINE_STYLES[line.kind]}>
          <span role="cell">{line.label}</span>
          <span role="cell" className={line.kind === 'total' ? 'font-mono text-base' : 'font-mono'}>
            {formatSigned(line.kind, line.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}

