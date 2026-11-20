/**
 * Parámetros Generales Fiscales y Laborales (fuente única del ERP).
 *
 * Todos los módulos (Administración, Compras, Nómina, Reportes) deben leer
 * estos valores desde aquí en lugar de escribirlos en su propio código.
 * En Fase 3 se migrarán a la tabla `parametros_generales` editable desde
 * Administración, conservando esta misma interfaz.
 */

export interface FiscalParameters {
  /** Año gravable vigente */
  fiscalYear: number
  /** Valor de la Unidad de Valor Tributario (UVT) vigente en COP */
  uvtCOP: number
  /** Salario Mínimo Mensual Legal Vigente en COP */
  smmlvCOP: number
  /**
   * Auxilio de transporte mensual en COP.
   * VALOR HIPOTÉTICO de demostración, pendiente de confirmación por San Isaac SAS.
   */
  transportAllowanceCOP: number
}

export const FISCAL_PARAMETERS: FiscalParameters = {
  fiscalYear: 2026,
  uvtCOP: 52_374,
  smmlvCOP: 1_750_905,
  transportAllowanceCOP: 249_095,
}

/** Precisión de redondeo DIAN para bases en pesos: al millar más cercano */
const DIAN_ROUNDING_STEP_COP = 1_000

/**
 * Convierte una base expresada en UVT a pesos aplicando el redondeo DIAN.
 * Fórmula del cliente: Base Mínima ($) = REDONDEAR(Base_UVT × Valor_UVT, -3)
 * Ej.: 10 UVT × 52.374 = 523.740 → 524.000 · 2 UVT = 104.748 → 105.000
 */
export function uvtToPesos(baseUvt: number, uvtCOP: number = FISCAL_PARAMETERS.uvtCOP): number {
  if (!Number.isFinite(baseUvt) || baseUvt <= 0) return 0
  return Math.round((baseUvt * uvtCOP) / DIAN_ROUNDING_STEP_COP) * DIAN_ROUNDING_STEP_COP
}

/** Topes legales de Revisoría Fiscal para SAS (Ley 43 de 1990, Art. 13 par. 2) */
export const STATUTORY_AUDIT_THRESHOLDS_SMMLV = {
  grossIncome: 3_000,
  grossAssets: 5_000,
} as const

/** Calcula un tope legal en pesos multiplicando por el SMMLV vigente */
export function smmlvToPesos(multiplier: number, smmlvCOP: number = FISCAL_PARAMETERS.smmlvCOP): number {
  return multiplier * smmlvCOP
}

/** Límite de exoneración Art. 114-1 E.T. (trabajadores con menos de 10 SMMLV) */
export const ART_114_1_SMMLV_LIMIT = 10

