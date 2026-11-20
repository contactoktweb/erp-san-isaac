import type { ProductionOrder } from '@/database/schemas'

export const IVA_RATE = 0.19
export const MIN_PROFITABLE_MARGIN_PERCENT = 15
export const MIN_MARGIN_PERCENT = 0
export const MAX_MARGIN_PERCENT = 99

export type SalesChannelKey = 'detal' | 'mayoreo' | 'distribuidor'

export interface MaterialCostItem {
  id: string
  name: string
  quantitySpec: string
  costCOP: number
}

export interface OverheadCostItem {
  id: string
  name: string
  detailSpec: string
  costCOP: number
  isLabor?: boolean
}

export interface TechnicalSheet {
  id: string
  formulaCode: string
  productName: string
  baseUnitLabel: string
  materials: MaterialCostItem[]
  overheads: OverheadCostItem[]
}

export function computeSheetCosts(sheet: TechnicalSheet) {
  const rawMaterialsSubtotal = sheet.materials.reduce((acc, item) => acc + item.costCOP, 0)
  const modSubtotal = sheet.overheads
    .filter((item) => item.isLabor)
    .reduce((acc, item) => acc + item.costCOP, 0)
  const cifSubtotal = sheet.overheads
    .filter((item) => !item.isLabor)
    .reduce((acc, item) => acc + item.costCOP, 0)
  const totalUnitCost = rawMaterialsSubtotal + modSubtotal + cifSubtotal
  return { rawMaterialsSubtotal, modSubtotal, cifSubtotal, totalUnitCost }
}

/**
 * Fórmula oficial de margen sobre venta (NO modificar):
 * Precio sin IVA = Costo Unitario Total / (1 - Margen / 100)
 */
export function calculatePriceWithoutIva(totalUnitCost: number, marginPercent: number): number {
  const clampedMargin = Math.min(MAX_MARGIN_PERCENT, Math.max(MIN_MARGIN_PERCENT, marginPercent))
  return Math.round(totalUnitCost / (1 - clampedMargin / 100))
}

export function calculatePriceWithIva(priceWithoutIva: number): number {
  return Math.round(priceWithoutIva * (1 + IVA_RATE))
}

export function formatAccountingStatusDisplay(
  status: ProductionOrder['accountingStatus']
): string {
  switch (status) {
    case 'En proceso (PUC 1410)':
      return 'En proceso (PUC 141001)'
    case 'Terminada en Bodega (PUC 1430)':
      return 'Terminada en Bodega (PUC 143005)'
    default:
      return status
  }
}

export const INITIAL_TECHNICAL_SHEETS: TechnicalSheet[] = [
  {
    id: 'sheet-v3d',
    formulaCode: 'FORM-V3D-REF',
    productName: 'Velón Votivo Blanco 3 Días San Isaac',
    baseUnitLabel: '1 velón (280 g)',
    materials: [
      { id: 'm-1', name: 'Parafina 58/60 Ecopetrol', quantitySpec: '250 g • Merma 3.5%', costCOP: 2450 },
      { id: 'm-2', name: 'Estearina Vegetal', quantitySpec: '30 g • Merma 1.0%', costCOP: 260 },
      { id: 'm-3', name: 'Pabilo Algodón Calibre 24', quantitySpec: '15 cm • 0.15 m', costCOP: 70 },
      { id: 'm-4', name: 'Vaso Termoformado Protector', quantitySpec: '1 unidad', costCOP: 60 },
    ],
    overheads: [
      {
        id: 'o-1',
        name: 'MOD Vaciado, Pabilado y Empaque',
        detailSpec: '0.05 h/und • Tarifa $13.000/h',
        costCOP: 650,
        isLabor: true,
      },
      {
        id: 'o-2',
        name: 'Gas Industrial Calderas y Pailas',
        detailSpec: 'Prorrateo térmico por lote',
        costCOP: 210,
      },
      {
        id: 'o-3',
        name: 'Energía Eléctrica y Maquinaria',
        detailSpec: 'Consumo extractores y luz',
        costCOP: 120,
      },
      {
        id: 'o-4',
        name: 'Depreciación Moldes y Arriendo Planta',
        detailSpec: 'Cuota fija imputada',
        costCOP: 130,
      },
    ],
  },
  {
    id: 'sheet-cir-60',
    formulaCode: 'FORM-CIR-PAS-60',
    productName: 'Cirio Pascual Consagrado 12x60 cm Decorado',
    baseUnitLabel: '1 cirio (3.200 g)',
    materials: [
      {
        id: 'm-21',
        name: 'Parafina Totalmente Refinada 60/62',
        quantitySpec: '2.900 g • Merma 3.0%',
        costCOP: 37040,
      },
      { id: 'm-22', name: 'Estearina Vegetal Triple Prensado', quantitySpec: '300 g • Merma 1.0%', costCOP: 3090 },
      { id: 'm-23', name: 'Pabilo Algodón #18', quantitySpec: '70 cm • 0.70 m', costCOP: 155 },
      { id: 'm-24', name: 'Apliques Cera y Embalaje Acolchado', quantitySpec: '1 kit completo', costCOP: 12215 },
    ],
    overheads: [
      {
        id: 'o-21',
        name: 'MOD Moldeo, Reposo y Decoración',
        detailSpec: '1.10 h/und • Tarifa $13.000/h',
        costCOP: 14300,
        isLabor: true,
      },
      {
        id: 'o-22',
        name: 'Gas Industrial Calderas y Pailas',
        detailSpec: 'Fusión de alta pureza',
        costCOP: 2800,
      },
      {
        id: 'o-23',
        name: 'Energía Eléctrica y Climatización',
        detailSpec: 'Área de moldeo y reposo',
        costCOP: 1100,
      },
      {
        id: 'o-24',
        name: 'Depreciación Moldes Cilíndricos',
        detailSpec: 'Cuota fija por unidad',
        costCOP: 3300,
      },
    ],
  },
  {
    id: 'sheet-vlt-trad',
    formulaCode: 'FORM-VLT-TRAD',
    productName: 'Vela Litúrgica Tradicional Blanca Paquete x 12',
    baseUnitLabel: '1 paquete x 12 velas (360 g)',
    materials: [
      { id: 'm-31', name: 'Parafina 58/60 Ecopetrol', quantitySpec: '330 g • Merma 2.5%', costCOP: 545 },
      { id: 'm-32', name: 'Estearina Vegetal', quantitySpec: '30 g • Merma 1.0%', costCOP: 35 },
      { id: 'm-33', name: 'Pabilo Calibre 24 (12 cortes)', quantitySpec: '1.80 m totales', costCOP: 45 },
      { id: 'm-34', name: 'Celofán y Etiqueta Litúrgica', quantitySpec: '1 unidad empaque', costCOP: 45 },
    ],
    overheads: [
      {
        id: 'o-31',
        name: 'MOD Troquelado y Empaque',
        detailSpec: 'Rendimiento 120 paq/h',
        costCOP: 105,
        isLabor: true,
      },
      { id: 'o-32', name: 'Gas Industrial Calderas', detailSpec: 'Prorrateo por lote', costCOP: 35 },
      { id: 'o-33', name: 'Energía Eléctrica', detailSpec: 'Troqueladora continua', costCOP: 20 },
      { id: 'o-34', name: 'Depreciación y Arriendo', detailSpec: 'Cuota fija imputada', costCOP: 20 },
    ],
  },
  {
    id: 'sheet-v7p',
    formulaCode: 'FORM-V7P-MULT',
    productName: 'Velón 7 Potencias Multicolor 15 cm',
    baseUnitLabel: '1 velón (320 g)',
    materials: [
      { id: 'm-41', name: 'Parafina Refinada 60/62', quantitySpec: '280 g • Merma 3.5%', costCOP: 3150 },
      { id: 'm-42', name: 'Colorantes Liposolubles (7 Capas)', quantitySpec: '6 g mezclados', costCOP: 240 },
      { id: 'm-43', name: 'Esencia Aromática Sándalo', quantitySpec: '4 ml dosificados', costCOP: 180 },
      { id: 'm-44', name: 'Pabilo #18 + Vaso Protector', quantitySpec: '0.20 m + 1 vaso', costCOP: 330 },
    ],
    overheads: [
      {
        id: 'o-41',
        name: 'MOD Vaciado en 7 Tiempos y Empaque',
        detailSpec: '0.065 h/und • $13.000/h',
        costCOP: 850,
        isLabor: true,
      },
      { id: 'o-42', name: 'Gas Industrial Calderas', detailSpec: '7 pailas independientes', costCOP: 210 },
      { id: 'o-43', name: 'Energía Eléctrica y Extractores', detailSpec: 'Consumo por turno', costCOP: 110 },
      { id: 'o-44', name: 'Depreciación Moldes y Planta', detailSpec: 'Cuota fija imputada', costCOP: 130 },
    ],
  },
  {
    id: 'sheet-var-can',
    formulaCode: 'FORM-VAR-CAN-GLS',
    productName: 'Velón Aromático Canela y Manzana Vaso Vidrio',
    baseUnitLabel: '1 velón (240 g)',
    materials: [
      { id: 'm-51', name: 'Cera de Soya Natural', quantitySpec: '220 g • Merma 2.0%', costCOP: 3700 },
      { id: 'm-52', name: 'Esencia Canela y Manzana', quantitySpec: '15 ml concentrado', costCOP: 1100 },
      { id: 'm-53', name: 'Pabilo Algodón Trenzado', quantitySpec: '15 cm', costCOP: 40 },
      { id: 'm-54', name: 'Vaso Vidrio + Caja y Etiqueta', quantitySpec: '1 set completo', costCOP: 1660 },
    ],
    overheads: [
      {
        id: 'o-51',
        name: 'MOD Mezclado, Vaciado y Sellado',
        detailSpec: '0.10 h/und • $13.000/h',
        costCOP: 1300,
        isLabor: true,
      },
      { id: 'o-52', name: 'Gas / Baño María Térmico', detailSpec: 'Control temperatura soya', costCOP: 320 },
      { id: 'o-53', name: 'Energía Eléctrica', detailSpec: 'Consumo planta', costCOP: 180 },
      { id: 'o-54', name: 'Depreciación y Arriendo', detailSpec: 'Cuota fija imputada', costCOP: 200 },
    ],
  },
  {
    id: 'sheet-cir-baut',
    formulaCode: 'FORM-CIR-BAUT',
    productName: 'Cirio para Bautizo y Primera Comunión 5x30 cm',
    baseUnitLabel: '1 cirio (480 g)',
    materials: [
      { id: 'm-61', name: 'Parafina Refinada 60/62', quantitySpec: '440 g • Merma 3.0%', costCOP: 5620 },
      { id: 'm-62', name: 'Estearina Vegetal', quantitySpec: '40 g • Merma 1.0%', costCOP: 420 },
      { id: 'm-63', name: 'Pabilo #24 + Aplique Dorado', quantitySpec: '0.35 m + 1 aplique', costCOP: 2860 },
    ],
    overheads: [
      {
        id: 'o-61',
        name: 'MOD Moldeo y Decoración Litúrgica',
        detailSpec: '0.20 h/und • $13.000/h',
        costCOP: 2600,
        isLabor: true,
      },
      { id: 'o-62', name: 'Gas Industrial Calderas', detailSpec: 'Prorrateo térmico', costCOP: 480 },
      { id: 'o-63', name: 'Energía Eléctrica', detailSpec: 'Área de moldeo', costCOP: 240 },
      { id: 'o-64', name: 'Depreciación Moldes', detailSpec: 'Cuota fija imputada', costCOP: 280 },
    ],
  },
  {
    id: 'sheet-vte-mini',
    formulaCode: 'FORM-VTE-MINI',
    productName: 'Vela Té Votiva Miniatura Caja x 50',
    baseUnitLabel: '1 caja x 50 velas (650 g)',
    materials: [
      { id: 'm-71', name: 'Parafina Semi-refinada 58/60', quantitySpec: '600 g • Merma 3.5%', costCOP: 1650 },
      { id: 'm-72', name: 'Pabilo + Portavela Aluminio x 50', quantitySpec: '50 sets completos', costCOP: 780 },
      { id: 'm-73', name: 'Caja Plegadiza y Celofán', quantitySpec: '1 unidad', costCOP: 220 },
    ],
    overheads: [
      {
        id: 'o-71',
        name: 'MOD Dosificado y Empaque x 50',
        detailSpec: '0.03 h/caja • $13.000/h',
        costCOP: 390,
        isLabor: true,
      },
      { id: 'o-72', name: 'Gas Industrial', detailSpec: 'Prorrateo térmico', costCOP: 120 },
      { id: 'o-73', name: 'Energía Eléctrica', detailSpec: 'Consumo planta', costCOP: 70 },
      { id: 'o-74', name: 'Depreciación y Arriendo', detailSpec: 'Cuota fija imputada', costCOP: 70 },
    ],
  },
  {
    id: 'sheet-cir-vig',
    formulaCode: 'FORM-CIR-VIG-40',
    productName: 'Cirio de Vigilia Pascual Decoración Cruz Roja 8x40 cm',
    baseUnitLabel: '1 cirio (1.550 g)',
    materials: [
      { id: 'm-81', name: 'Parafina Refinada 60/62', quantitySpec: '1.400 g • Merma 3.0%', costCOP: 17880 },
      { id: 'm-82', name: 'Estearina Vegetal', quantitySpec: '150 g • Merma 1.0%', costCOP: 1550 },
      { id: 'm-83', name: 'Pabilo #18 + Cruz Roja en Cera + Caja', quantitySpec: '1 kit decorado', costCOP: 2770 },
    ],
    overheads: [
      {
        id: 'o-81',
        name: 'MOD Moldeo, Acabado y Cruz Roja',
        detailSpec: '0.30 h/und • $13.000/h',
        costCOP: 3900,
        isLabor: true,
      },
      { id: 'o-82', name: 'Gas Industrial Calderas', detailSpec: 'Prorrateo térmico', costCOP: 950 },
      { id: 'o-83', name: 'Energía Eléctrica', detailSpec: 'Área de moldeo', costCOP: 420 },
      { id: 'o-84', name: 'Depreciación Moldes', detailSpec: 'Cuota fija imputada', costCOP: 530 },
    ],
  },
]
