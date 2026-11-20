import type { InventoryItem } from '@/database/schemas'

export type PucCategoryCode = '140501' | '141001' | '143005' | '145525' | '146001'

export interface PucCategoryConfig {
  code: PucCategoryCode
  label: string
  description: string
  schemaCategory: InventoryItem['category']
  pucDisplay: string
  badgeVariant: 'outline' | 'warning' | 'info' | 'secondary' | 'muted'
}

export const INVENTORY_PUC_CATEGORIES: PucCategoryConfig[] = [
  {
    code: '140501',
    label: 'Materia Prima',
    description: 'Parafinas, ceras de soya y estearinas',
    schemaCategory: 'Materia prima',
    pucDisplay: '140501 - Materia Prima',
    badgeVariant: 'outline',
  },
  {
    code: '141001',
    label: 'Producto en Proceso',
    description: 'Mezclas en pailas, moldeo y reposo',
    schemaCategory: 'Producto en proceso',
    pucDisplay: '141001 - Producto en Proceso',
    badgeVariant: 'warning',
  },
  {
    code: '143005',
    label: 'Producto Terminado',
    description: 'Velas, velones y cirios listos para despacho',
    schemaCategory: 'Producto terminado',
    pucDisplay: '143005 - Producto Terminado',
    badgeVariant: 'info',
  },
  {
    code: '145525',
    label: 'Insumos',
    description: 'Pabilos, colorantes y fragancias',
    schemaCategory: 'Insumo',
    pucDisplay: '145525 - Insumos',
    badgeVariant: 'secondary',
  },
  {
    code: '146001',
    label: 'Envases y Empaques',
    description: 'Vasos, cajas, celofán y etiquetas',
    schemaCategory: 'Insumo',
    pucDisplay: '146001 - Envases y Empaques',
    badgeVariant: 'muted',
  },
]

export const INVENTORY_PUC_MAP: Record<PucCategoryCode, PucCategoryConfig> = {
  '140501': INVENTORY_PUC_CATEGORIES[0],
  '141001': INVENTORY_PUC_CATEGORIES[1],
  '143005': INVENTORY_PUC_CATEGORIES[2],
  '145525': INVENTORY_PUC_CATEGORIES[3],
  '146001': INVENTORY_PUC_CATEGORIES[4],
}

export function resolveItemPucMeta(item: InventoryItem): PucCategoryConfig {
  const account = item.pucAccount || ''
  if (account.startsWith('146001')) return INVENTORY_PUC_MAP['146001']
  if (account.startsWith('145525')) return INVENTORY_PUC_MAP['145525']
  if (account.startsWith('141001') || item.category === 'Producto en proceso') {
    return INVENTORY_PUC_MAP['141001']
  }
  if (account.startsWith('143005') || item.category === 'Producto terminado') {
    return INVENTORY_PUC_MAP['143005']
  }
  if (item.category === 'Insumo') return INVENTORY_PUC_MAP['145525']
  return INVENTORY_PUC_MAP['140501']
}

export type MovementConceptValue =
  | 'Ajustes'
  | 'Devoluciones'
  | 'Pérdidas'
  | 'Desperdicios'
  | 'Bajas'
  | 'Traslados'
  | 'Costo de ventas'

export interface MovementConceptConfig {
  value: MovementConceptValue
  label: string
  defaultDirection: 'entrada' | 'salida' | 'traslado'
  allowsDirectionChoice: boolean
  pucCounterpart: string
  defaultDocPrefix: string
}

export const MOVEMENT_CONCEPTS: MovementConceptConfig[] = [
  {
    value: 'Ajustes',
    label: '1. Ajustes de inventario',
    defaultDirection: 'salida',
    allowsDirectionChoice: true,
    pucCounterpart: '14xx Inventarios ↔ 4295 / 5395 Diferencia de arqueo físico',
    defaultDocPrefix: 'AJ-2026-',
  },
  {
    value: 'Devoluciones',
    label: '2. Devoluciones en compras/ventas',
    defaultDirection: 'entrada',
    allowsDirectionChoice: true,
    pucCounterpart: '14xx Inventarios ↔ 2205 Proveedores / 4175 Devoluciones',
    defaultDocPrefix: 'DEV-2026-',
  },
  {
    value: 'Pérdidas',
    label: '3. Pérdidas operativas',
    defaultDirection: 'salida',
    allowsDirectionChoice: false,
    pucCounterpart: '539595 Pérdidas operativas (Débito) ↔ 14xx Inventarios (Crédito)',
    defaultDocPrefix: 'PER-2026-',
  },
  {
    value: 'Desperdicios',
    label: '4. Desperdicios de fundición/merma',
    defaultDirection: 'salida',
    allowsDirectionChoice: false,
    pucCounterpart: '730501 CIF Merma de planta (Débito) ↔ 140501 / 145525 (Crédito)',
    defaultDocPrefix: 'MER-2026-',
  },
  {
    value: 'Bajas',
    label: '5. Bajas de inventario',
    defaultDirection: 'salida',
    allowsDirectionChoice: false,
    pucCounterpart: '531035 Bajas de inventario (Débito) ↔ 14xx Inventarios (Crédito)',
    defaultDocPrefix: 'BAJ-2026-',
  },
  {
    value: 'Traslados',
    label: '6. Traslados entre bodegas',
    defaultDirection: 'traslado',
    allowsDirectionChoice: false,
    pucCounterpart: 'Traslado interno entre bodegas (PUC 14xx sin variación de saldo)',
    defaultDocPrefix: 'TR-2026-',
  },
  {
    value: 'Costo de ventas',
    label: '7. Costo de ventas (Cuenta 612095)',
    defaultDirection: 'salida',
    allowsDirectionChoice: false,
    pucCounterpart: '612095 Costo de Ventas (Débito) ↔ 143005 Producto Terminado (Crédito)',
    defaultDocPrefix: 'FEDV-',
  },
]

export const WAREHOUSE_LOCATIONS: string[] = [
  'Bodega 1 - Materias Primas',
  'Bodega 2 - Insumos Menores',
  'Bodega 2 - Insumos Químicos',
  'Bodega 3 - Despachos',
  'Bodega 3 - Despachos Especiales',
  'Bodega 4 - Envases y Empaques',
  'Área de Pailas y Fundición (Planta)',
  'Área de Moldeo y Troquelado',
]

export const BASE_UNIT_OPTIONS: string[] = ['kg', 'unidad', 'metro', 'litro', 'g', 'ml']

export interface KardexEntry {
  id: string
  date: string
  documentNumber: string
  sku: string
  itemName: string
  pucAccount: string
  warehouseLocation: string
  concept: string
  batchNumber: string
  entryQty: number | null
  entryUnitCost: number | null
  entryTotalCost: number | null
  exitQty: number | null
  exitUnitCost: number | null
  exitTotalCost: number | null
  balanceQty: number
  balanceTotalCost: number
  notes?: string
}

/**
 * Kardex PEPS (FIFO) inicial matemáticamente consistente con las existencias de inventory.json.
 * Cada salida consume primero la capa/lote más antiguo a su costo exacto de ingreso.
 */
export const INITIAL_KARDEX_DEMO: KardexEntry[] = [
  // MP-PAR-001: Saldo final = 4.500 kg @ $9.800 = $44.100.000 (Lote LOT-MP-2026-042)
  {
    id: 'kdx-001',
    date: '2026-02-01T08:00:00.000Z',
    documentNumber: 'SI-2026-001',
    sku: 'MP-PAR-001',
    itemName: 'Parafina Semi-refinada 58/60 Ecopetrol',
    pucAccount: '140501 - Materia Prima',
    warehouseLocation: 'Bodega 1 - Materias Primas',
    concept: 'Saldo inicial / Compra lote anterior',
    batchNumber: 'LOT-MP-2026-020',
    entryQty: 2000,
    entryUnitCost: 9400,
    entryTotalCost: 18800000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 2000,
    balanceTotalCost: 18800000,
  },
  {
    id: 'kdx-002',
    date: '2026-02-10T10:15:00.000Z',
    documentNumber: 'FC-ECP-8812',
    sku: 'MP-PAR-001',
    itemName: 'Parafina Semi-refinada 58/60 Ecopetrol',
    pucAccount: '140501 - Materia Prima',
    warehouseLocation: 'Bodega 1 - Materias Primas',
    concept: 'Compra Nacional (Ingreso PEPS)',
    batchNumber: 'LOT-MP-2026-042',
    entryQty: 5000,
    entryUnitCost: 9800,
    entryTotalCost: 49000000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 7000,
    balanceTotalCost: 67800000,
  },
  {
    id: 'kdx-003',
    date: '2026-02-18T14:30:00.000Z',
    documentNumber: 'OP-2026-081',
    sku: 'MP-PAR-001',
    itemName: 'Parafina Semi-refinada 58/60 Ecopetrol',
    pucAccount: '140501 - Materia Prima',
    warehouseLocation: 'Bodega 1 - Materias Primas',
    concept: 'Traslados (Consumo planta — agota lote antiguo PEPS)',
    batchNumber: 'LOT-MP-2026-020',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 2000,
    exitUnitCost: 9400,
    exitTotalCost: 18800000,
    balanceQty: 5000,
    balanceTotalCost: 49000000,
  },
  {
    id: 'kdx-004',
    date: '2026-02-27T07:30:00.000Z',
    documentNumber: 'OP-2026-081',
    sku: 'MP-PAR-001',
    itemName: 'Parafina Semi-refinada 58/60 Ecopetrol',
    pucAccount: '140501 - Materia Prima',
    warehouseLocation: 'Bodega 1 - Materias Primas',
    concept: 'Traslados (Consumo complementario a PUC 141001)',
    batchNumber: 'LOT-MP-2026-042',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 500,
    exitUnitCost: 9800,
    exitTotalCost: 4900000,
    balanceQty: 4500,
    balanceTotalCost: 44100000,
  },
  // PT-VEL-3D: Saldo final = 1.820 und @ $4.150 = $7.553.000 (Lote LOT-PT-2026-104)
  {
    id: 'kdx-005',
    date: '2026-02-20T16:00:00.000Z',
    documentNumber: 'OP-2026-075',
    sku: 'PT-VEL-3D',
    itemName: 'Velón Votivo Blanco 3 Días San Isaac',
    pucAccount: '143005 - Producto Terminado',
    warehouseLocation: 'Bodega 3 - Despachos',
    concept: 'Ingreso Producto Terminado desde Planta',
    batchNumber: 'LOT-PT-2026-091',
    entryQty: 1200,
    entryUnitCost: 3950,
    entryTotalCost: 4740000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 1200,
    balanceTotalCost: 4740000,
  },
  {
    id: 'kdx-006',
    date: '2026-03-01T17:00:00.000Z',
    documentNumber: 'OP-2026-081',
    sku: 'PT-VEL-3D',
    itemName: 'Velón Votivo Blanco 3 Días San Isaac',
    pucAccount: '143005 - Producto Terminado',
    warehouseLocation: 'Bodega 3 - Despachos',
    concept: 'Ingreso Producto Terminado desde Planta',
    batchNumber: 'LOT-PT-2026-104',
    entryQty: 2400,
    entryUnitCost: 4150,
    entryTotalCost: 9960000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 3600,
    balanceTotalCost: 14700000,
  },
  {
    id: 'kdx-007',
    date: '2026-03-03T11:20:00.000Z',
    documentNumber: 'FEDV-136',
    sku: 'PT-VEL-3D',
    itemName: 'Velón Votivo Blanco 3 Días San Isaac',
    pucAccount: '143005 - Producto Terminado',
    warehouseLocation: 'Bodega 3 - Despachos',
    concept: 'Costo de ventas (Cuenta 612095 — agota lote antiguo PEPS)',
    batchNumber: 'LOT-PT-2026-091',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 1200,
    exitUnitCost: 3950,
    exitTotalCost: 4740000,
    balanceQty: 2400,
    balanceTotalCost: 9960000,
  },
  {
    id: 'kdx-008',
    date: '2026-03-05T15:45:00.000Z',
    documentNumber: 'FEDV-138',
    sku: 'PT-VEL-3D',
    itemName: 'Velón Votivo Blanco 3 Días San Isaac',
    pucAccount: '143005 - Producto Terminado',
    warehouseLocation: 'Bodega 3 - Despachos',
    concept: 'Costo de ventas (Cuenta 612095)',
    batchNumber: 'LOT-PT-2026-104',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 580,
    exitUnitCost: 4150,
    exitTotalCost: 2407000,
    balanceQty: 1820,
    balanceTotalCost: 7553000,
  },
  // INS-PAB-018: Saldo final = 14.000 m @ $220 = $3.080.000 (Lote LOT-INS-2026-014)
  {
    id: 'kdx-009',
    date: '2026-01-15T09:00:00.000Z',
    documentNumber: 'FC-HIL-304',
    sku: 'INS-PAB-018',
    itemName: 'Pabilo Trenzado de Algodón con Alma de Papel #18',
    pucAccount: '145525 - Insumos',
    warehouseLocation: 'Bodega 2 - Insumos Menores',
    concept: 'Compra Nacional de Insumos',
    batchNumber: 'LOT-INS-2026-014',
    entryQty: 16000,
    entryUnitCost: 220,
    entryTotalCost: 3520000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 16000,
    balanceTotalCost: 3520000,
  },
  {
    id: 'kdx-010',
    date: '2026-02-28T13:10:00.000Z',
    documentNumber: 'MER-2026-004',
    sku: 'INS-PAB-018',
    itemName: 'Pabilo Trenzado de Algodón con Alma de Papel #18',
    pucAccount: '145525 - Insumos',
    warehouseLocation: 'Bodega 2 - Insumos Menores',
    concept: 'Desperdicios (Corte y pabilado en planta)',
    batchNumber: 'LOT-INS-2026-014',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 2000,
    exitUnitCost: 220,
    exitTotalCost: 440000,
    balanceQty: 14000,
    balanceTotalCost: 3080000,
  },
  // EMP-VAS-001: Saldo final = 3.200 und @ $420 = $1.344.000 (Lote LOT-EMP-2026-011)
  {
    id: 'kdx-011',
    date: '2026-02-12T11:00:00.000Z',
    documentNumber: 'FC-VID-119',
    sku: 'EMP-VAS-001',
    itemName: 'Vaso Vidrio / Termoformado para Velón 3 Días',
    pucAccount: '146001 - Envases y Empaques',
    warehouseLocation: 'Bodega 4 - Envases y Empaques',
    concept: 'Compra Envases y Empaques',
    batchNumber: 'LOT-EMP-2026-011',
    entryQty: 4000,
    entryUnitCost: 420,
    entryTotalCost: 1680000,
    exitQty: null,
    exitUnitCost: null,
    exitTotalCost: null,
    balanceQty: 4000,
    balanceTotalCost: 1680000,
  },
  {
    id: 'kdx-012',
    date: '2026-03-02T16:20:00.000Z',
    documentNumber: 'AJ-2026-009',
    sku: 'EMP-VAS-001',
    itemName: 'Vaso Vidrio / Termoformado para Velón 3 Días',
    pucAccount: '146001 - Envases y Empaques',
    warehouseLocation: 'Bodega 4 - Envases y Empaques',
    concept: 'Ajustes (Consumo y rotura por arqueo)',
    batchNumber: 'LOT-EMP-2026-011',
    entryQty: null,
    entryUnitCost: null,
    entryTotalCost: null,
    exitQty: 800,
    exitUnitCost: 420,
    exitTotalCost: 336000,
    balanceQty: 3200,
    balanceTotalCost: 1344000,
  },
]
