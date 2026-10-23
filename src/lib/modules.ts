import {
  BarChart3,
  BookOpen,
  Boxes,
  Factory,
  FileCheck2,
  Scale,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ModuleStatus = 'En desarrollo' | 'Próximamente'

export type FunctionStatus = 'Disponible' | 'Pendiente'

export type ModuleFunction = {
  name: string
  description: string
  status: FunctionStatus
}

export type ModuleArea =
  | 'Base del sistema'
  | 'Operación'
  | 'Finanzas y legal'
  | 'Análisis'

export type ModuleItem = {
  slug: string
  name: string
  shortDescription: string
  area: ModuleArea
  icon: LucideIcon
  status: ModuleStatus
  entityName: string
  functions: ModuleFunction[]
}

export const MODULES: ModuleItem[] = [
  {
    slug: 'administracion',
    name: 'Administración del sistema',
    shortDescription:
      'Gestión centralizada de accesos, roles, sedes, bodegas, terceros y parámetros generales de la empresa.',
    area: 'Base del sistema',
    icon: Settings,
    status: 'En desarrollo',
    entityName: 'Usuarios y roles del sistema',
    functions: [
      {
        name: 'Inicio de sesión',
        description: 'Autenticación corporativa mediante credenciales y control de sesiones seguras.',
        status: 'Disponible',
      },
      {
        name: 'Usuarios',
        description: 'Registro, asignación de sedes y control de estado de colaboradores internos.',
        status: 'Pendiente',
      },
      {
        name: 'Roles y permisos',
        description: 'Definición de perfiles de acceso granular a módulos y funciones del ERP.',
        status: 'Pendiente',
      },
      {
        name: 'Recuperación de acceso',
        description: 'Flujo de restablecimiento seguro de claves mediante canal administrativo.',
        status: 'Pendiente',
      },
      {
        name: 'Información de la empresa',
        description: 'Razón social, NIT, representación legal, actividad económica y datos de contacto.',
        status: 'Pendiente',
      },
      {
        name: 'Sedes',
        description: 'Administración de sedes operativas, comerciales y plantas de fabricación.',
        status: 'Pendiente',
      },
      {
        name: 'Bodegas',
        description: 'Zonas de almacenamiento de materias primas, insumos y producto terminado.',
        status: 'Pendiente',
      },
      {
        name: 'Centros de costos',
        description: 'Estructura para la imputación precisa de gastos y costos operacionales.',
        status: 'Pendiente',
      },
      {
        name: 'Terceros',
        description: 'Directorio maestro unificado de personas naturales y jurídicas relacionadas.',
        status: 'Pendiente',
      },
      {
        name: 'Clientes',
        description: 'Clasificación comercial, plazos de pago, listas de precios y cupos asignados.',
        status: 'Pendiente',
      },
      {
        name: 'Proveedores',
        description: 'Catálogo de abastecedores con condiciones comerciales y datos bancarios.',
        status: 'Pendiente',
      },
      {
        name: 'Consecutivos',
        description: 'Numeración oficial para pedidos, remisiones, comprobantes y órdenes de fábrica.',
        status: 'Pendiente',
      },
      {
        name: 'Impuestos',
        description: 'Configuración de tarifas de IVA, retenciones en la fuente, ICA y autorretenciones.',
        status: 'Pendiente',
      },
      {
        name: 'Configuraciones generales',
        description: 'Parámetros del sistema, moneda base COP y políticas operativas.',
        status: 'Pendiente',
      },
      {
        name: 'Auditoría básica',
        description: 'Registro de trazabilidad sobre creaciones, ediciones y accesos al sistema.',
        status: 'Pendiente',
      },
      {
        name: 'Documentos adjuntos',
        description: 'Almacenamiento de RUT, cédulas, certificaciones bancarias y contratos asociados.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'inventarios',
    name: 'Inventarios',
    shortDescription:
      'Control de existencias de parafinas, pabilos, colorantes, velones y cirios con equivalencias y lotes.',
    area: 'Operación',
    icon: Boxes,
    status: 'Próximamente',
    entityName: 'Existencias y lotes de inventario',
    functions: [
      {
        name: 'Productos terminados',
        description: 'Catálogo de velas litúrgicas, velones aromáticos, cirios pascuales y presentación comercial.',
        status: 'Pendiente',
      },
      {
        name: 'Materias primas',
        description: 'Parafinas refinadas y semi-refinadas, cera de soya, microcristalina y estearina.',
        status: 'Pendiente',
      },
      {
        name: 'Insumos',
        description: 'Pabilos trenzados con alma de papel/algodón, colorantes a la grasa y esencias aromáticas.',
        status: 'Pendiente',
      },
      {
        name: 'Lotes',
        description: 'Identificación única de lotes con fecha de fabricación y seguimiento de calidad.',
        status: 'Pendiente',
      },
      {
        name: 'Movimientos',
        description: 'Registro formal de entradas, salidas, mermas y consumos en planta.',
        status: 'Pendiente',
      },
      {
        name: 'Ajustes',
        description: 'Correcciones de inventario por conteo físico periódico y auditoría de existencias.',
        status: 'Pendiente',
      },
      {
        name: 'Traslados entre bodegas',
        description: 'Transferencias documentadas entre bodegas de materia prima, producción y despachos.',
        status: 'Pendiente',
      },
      {
        name: 'Existencias',
        description: 'Consulta de saldo disponible, reservado y en tránsito en tiempo real.',
        status: 'Pendiente',
      },
      {
        name: 'Kardex',
        description: 'Historial cronológico detallado de entradas y salidas por cada ítem y bodega.',
        status: 'Pendiente',
      },
      {
        name: 'Trazabilidad por lote',
        description: 'Rastreo desde la compra de parafina hasta la orden de producción y despacho final.',
        status: 'Pendiente',
      },
      {
        name: 'Presentaciones y equivalencias',
        description: 'Conversión entre unidades de empaque (cajas, paquetes, gruesas) y unidad base (kg, unidad).',
        status: 'Pendiente',
      },
      {
        name: 'PEPS o promedio ponderado',
        description: 'Valoración contable de inventarios según normativa fiscal colombiana.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'produccion',
    name: 'Producción y costos',
    shortDescription:
      'Planificación de tirajes de fábrica, formulaciones de cera, consumo de insumos y costeo de fabricación.',
    area: 'Operación',
    icon: Factory,
    status: 'Próximamente',
    entityName: 'Órdenes de producción y formulaciones',
    functions: [
      {
        name: 'Órdenes',
        description: 'Programación y seguimiento del estado de fabricación por línea de moldeo o vaciado.',
        status: 'Pendiente',
      },
      {
        name: 'Fórmulas',
        description: 'Recetas maestras con proporciones exactas de ceras, aditivos, aromas y pabilos requeridos.',
        status: 'Pendiente',
      },
      {
        name: 'Consumos',
        description: 'Descarga automática de materias primas según formulación estándar y cantidades reales.',
        status: 'Pendiente',
      },
      {
        name: 'Cantidades programadas y producidas',
        description: 'Monitoreo de cumplimiento de meta de producción frente al rendimiento real obtenido.',
        status: 'Pendiente',
      },
      {
        name: 'Lotes',
        description: 'Asignación de lote de salida vinculado a los insumos utilizados en el lote de origen.',
        status: 'Pendiente',
      },
      {
        name: 'Desperdicios',
        description: 'Registro de mermas técnicas no reutilizables generadas durante el proceso térmico.',
        status: 'Pendiente',
      },
      {
        name: 'Reprocesos',
        description: 'Recuperación controlada de cera sobrante para reingreso a pailas de fundición.',
        status: 'Pendiente',
      },
      {
        name: 'Rendimientos',
        description: 'Análisis de eficiencia por kilogramo de parafina fundida frente a unidades terminadas.',
        status: 'Pendiente',
      },
      {
        name: 'Mano de obra',
        description: 'Imputación del tiempo y costo de operarios por orden y etapa de producción.',
        status: 'Pendiente',
      },
      {
        name: 'Costos indirectos',
        description: 'Distribución de energía, gas en pailas, moldes, depreciación y consumibles de fábrica.',
        status: 'Pendiente',
      },
      {
        name: 'Costos básicos',
        description: 'Determinación del costo unitario estándar y real por cada tipo de velón o cirio.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'compras',
    name: 'Compras y proveedores',
    shortDescription:
      'Adquisición de insumos industriales, control de recepciones, órdenes de compra y programación de pagos.',
    area: 'Operación',
    icon: Truck,
    status: 'Próximamente',
    entityName: 'Órdenes de compra y cuentas por pagar',
    functions: [
      {
        name: 'Órdenes de compra',
        description: 'Generación, aprobación y envío formal de requerimientos de abastecimiento.',
        status: 'Pendiente',
      },
      {
        name: 'Compras',
        description: 'Causación de facturas de compra de materias primas con desglose de impuestos.',
        status: 'Pendiente',
      },
      {
        name: 'Recepción',
        description: 'Validación física de cantidades, pesos de bultos y especificaciones técnicas recibidas.',
        status: 'Pendiente',
      },
      {
        name: 'Entradas de inventario',
        description: 'Cargue automático en bodega correspondiente tras confirmación del recibido de almacén.',
        status: 'Pendiente',
      },
      {
        name: 'Cuentas por pagar',
        description: 'Estado de obligaciones vigentes con proveedores de cera, pabilo y material de empaque.',
        status: 'Pendiente',
      },
      {
        name: 'Pagos',
        description: 'Registro de desembolsos, transferencias bancarias y emisión de comprobantes de egreso.',
        status: 'Pendiente',
      },
      {
        name: 'Saldos',
        description: 'Monitoreo de compromisos por vencer y deudas vencidas para planificación de tesorería.',
        status: 'Pendiente',
      },
      {
        name: 'Historial',
        description: 'Trazabilidad de compras anteriores, evolución de precios unitarios y tiempos de entrega.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'ventas',
    name: 'Ventas y cartera',
    shortDescription:
      'Cotizaciones comerciales, pedidos a distribuidores, facturación de despachos y gestión de cuentas por cobrar.',
    area: 'Finanzas y legal',
    icon: ShoppingCart,
    status: 'Próximamente',
    entityName: 'Cotizaciones, pedidos y cartera de clientes',
    functions: [
      {
        name: 'Cotizaciones',
        description: 'Elaboración de propuestas comerciales con vigencia, precios mayoristas y condiciones de entrega.',
        status: 'Pendiente',
      },
      {
        name: 'Pedidos',
        description: 'Recepción y formalización de solicitudes de compra de clientes institucionales y mayoristas.',
        status: 'Pendiente',
      },
      {
        name: 'Ventas',
        description: 'Consolidación de ventas efectivas para despacho y facturación comercial.',
        status: 'Pendiente',
      },
      {
        name: 'Descuento de inventario',
        description: 'Descargue automático de bodega al momento de despachar el pedido.',
        status: 'Pendiente',
      },
      {
        name: 'Medios de pago',
        description: 'Control de consignaciones, transferencias bancarias, efectivo y cheques.',
        status: 'Pendiente',
      },
      {
        name: 'Contado y crédito',
        description: 'Gestión diferenciada de ventas de contado y ventas a plazos (15, 30 y 60 días).',
        status: 'Pendiente',
      },
      {
        name: 'Cuentas por cobrar',
        description: 'Seguimiento de cartera por cliente, límites de crédito y días de mora.',
        status: 'Pendiente',
      },
      {
        name: 'Abonos',
        description: 'Aplicación de pagos parciales contra facturas pendientes de cobro.',
        status: 'Pendiente',
      },
      {
        name: 'Saldos',
        description: 'Extractos de cuenta detallados por cliente con saldo consolidado.',
        status: 'Pendiente',
      },
      {
        name: 'Comprobantes',
        description: 'Generación de recibos de caja por recaudos recibidos.',
        status: 'Pendiente',
      },
      {
        name: 'Integración con facturación electrónica',
        description: 'Vínculo directo para transformar pedidos y remisiones en facturas electrónicas de venta.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'contabilidad',
    name: 'Contabilidad',
    shortDescription:
      'Plan único de cuentas (PUC), comprobantes de diario, causaciones, libro mayor y balances de prueba.',
    area: 'Finanzas y legal',
    icon: BookOpen,
    status: 'Próximamente',
    entityName: 'Plan de cuentas y comprobantes contables',
    functions: [
      {
        name: 'Catálogo de cuentas',
        description: 'Estructura jerárquica del PUC comercial adaptado a la industria de manufactura.',
        status: 'Pendiente',
      },
      {
        name: 'Comprobantes',
        description: 'Registro de asientos de diario, ajustes de fin de mes, notas de contabilidad e ingresos.',
        status: 'Pendiente',
      },
      {
        name: 'Débito y crédito',
        description: 'Validación en tiempo real de partida doble balanceada en cada registro.',
        status: 'Pendiente',
      },
      {
        name: 'Terceros y centros de costos',
        description: 'Asociación obligatoria de NIT y centro operativo en cada asiento para analítica contable.',
        status: 'Pendiente',
      },
      {
        name: 'Libro diario',
        description: 'Cronología completa y foliada de transacciones económicas de la empresa.',
        status: 'Pendiente',
      },
      {
        name: 'Libro mayor',
        description: 'Saldos acumulados y movimientos mensuales cuenta por cuenta.',
        status: 'Pendiente',
      },
      {
        name: 'Auxiliares',
        description: 'Detalle analítico de transacciones por cuenta, tercero y rango de fechas.',
        status: 'Pendiente',
      },
      {
        name: 'Balance de prueba',
        description: 'Verificación de sumas iguales con discriminación de saldos anteriores, débitos, créditos y nuevo saldo.',
        status: 'Pendiente',
      },
      {
        name: 'Cierre de periodos',
        description: 'Bloqueo mensual y anual para salvaguardar la integridad de la información fiscal.',
        status: 'Pendiente',
      },
      {
        name: 'Estados financieros básicos',
        description: 'Generación preliminar de Estado de Situación Financiera y Estado de Resultados.',
        status: 'Pendiente',
      },
      {
        name: 'Ajustes',
        description: 'Causación de depreciaciones de moldes y maquinaria, amortizaciones y diferidos.',
        status: 'Pendiente',
      },
      {
        name: 'Exportación para el contador',
        description: 'Descarga en hojas de cálculo y archivos planos estructurados para revisión contable externa.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'documentos-electronicos',
    name: 'Documentos electrónicos DIAN',
    shortDescription:
      'Facturas electrónicas de venta, documentos soporte y nómina electrónica con estado de transmisión oficial.',
    area: 'Finanzas y legal',
    icon: FileCheck2,
    status: 'Próximamente',
    entityName: 'Facturas electrónicas y documentos fiscales DIAN',
    functions: [
      {
        name: 'Factura electrónica de venta',
        description: 'Generación del archivo XML UBL 2.1, cálculo de CUFE, código QR y validación previa de la DIAN.',
        status: 'Pendiente',
      },
      {
        name: 'Documento soporte de nómina electrónica',
        description: 'Emisión mensual de devengados y deducciones laborales con transmisión del CUNE correspondiente.',
        status: 'Pendiente',
      },
      {
        name: 'Documento soporte para adquisiciones a no obligados a facturar',
        description: 'Formalización fiscal de pagos a proveedores informales de insumos y servicios de transporte.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'nomina',
    name: 'Nómina y seguridad social',
    shortDescription:
      'Administración del personal de fábrica, contratos laborales, horas extras de planta y liquidaciones de ley.',
    area: 'Finanzas y legal',
    icon: Users,
    status: 'Próximamente',
    entityName: 'Trabajadores, contratos y planillas de nómina',
    functions: [
      {
        name: 'Trabajadores',
        description: 'Ficha personal de operarios de vaciado, paileros, empacadores y personal administrativo.',
        status: 'Pendiente',
      },
      {
        name: 'Contratos',
        description: 'Manejo de contratos a término fijo, indefinido y de aprendizaje con sus respectivos salarios.',
        status: 'Pendiente',
      },
      {
        name: 'Devengados',
        description: 'Cálculo de sueldo básico, auxilio de transporte legal y bonificaciones no salariales.',
        status: 'Pendiente',
      },
      {
        name: 'Deducciones',
        description: 'Descuentos de ley por salud (4%), pensión (4%), libranzas y préstamos a trabajadores.',
        status: 'Pendiente',
      },
      {
        name: 'Horas extras',
        description: 'Reporte y liquidación de jornadas extras diurnas, nocturnas y trabajo dominical en planta.',
        status: 'Pendiente',
      },
      {
        name: 'Recargos',
        description: 'Cálculo de recargos nocturnos ordinarios para turnos de fundición y empaque.',
        status: 'Pendiente',
      },
      {
        name: 'Comisiones',
        description: 'Liquidación de incentivos por cumplimiento de metas de ventas mayoristas.',
        status: 'Pendiente',
      },
      {
        name: 'Prestaciones',
        description: 'Provisiones contables periódicas de cesantías, intereses, prima de servicios y vacaciones.',
        status: 'Pendiente',
      },
      {
        name: 'Vacaciones',
        description: 'Control de días causados, disfrutados y saldos pendientes por colaborador.',
        status: 'Pendiente',
      },
      {
        name: 'Cesantías',
        description: 'Consignación anual a fondos de cesantías e intereses pagados en enero.',
        status: 'Pendiente',
      },
      {
        name: 'Prima',
        description: 'Liquidación y pago de prima semestral en junio y diciembre.',
        status: 'Pendiente',
      },
      {
        name: 'Liquidaciones',
        description: 'Cálculo definitivo de prestaciones sociales e indemnizaciones por terminación de contrato.',
        status: 'Pendiente',
      },
      {
        name: 'Aportes',
        description: 'Generación de resumen de PILA para aportes patronales a salud, pensión, ARL y parafiscales.',
        status: 'Pendiente',
      },
      {
        name: 'Nómina electrónica',
        description: 'Preparación de registros individuales para transmisión mensual certificada ante la DIAN.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'libros-societarios',
    name: 'Libros societarios',
    shortDescription:
      'Control de socios accionistas de la SAS, composición del capital, actas de asamblea y reformas de estatutos.',
    area: 'Finanzas y legal',
    icon: Scale,
    status: 'Próximamente',
    entityName: 'Libro de accionistas y actas de asamblea',
    functions: [
      {
        name: 'Accionistas',
        description: 'Padrón oficial de socios con cédula/NIT, domicilio y porcentaje de propiedad de la SAS.',
        status: 'Pendiente',
      },
      {
        name: 'Participaciones',
        description: 'Número de acciones ordinarias suscritas, pagadas y valor nominal unitario en COP.',
        status: 'Pendiente',
      },
      {
        name: 'Movimientos accionarios',
        description: 'Registro cronológico de compraventas, cesiones y emisión de títulos de capital.',
        status: 'Pendiente',
      },
      {
        name: 'Actas y consecutivo',
        description: 'Libro foliado de actas de asamblea general ordinaria y reuniones de junta.',
        status: 'Pendiente',
      },
      {
        name: 'Reuniones',
        description: 'Convocatorias, quórum deliberatorio y decisorio según estatutos comerciales.',
        status: 'Pendiente',
      },
      {
        name: 'Decisiones',
        description: 'Constancia formal de aprobaciones de estados financieros y distribución de utilidades.',
        status: 'Pendiente',
      },
      {
        name: 'Reformas estatutarias',
        description: 'Historial de modificaciones al objeto social, domicilio y representación legal.',
        status: 'Pendiente',
      },
      {
        name: 'Certificaciones',
        description: 'Emisión de certificados de composición accionaria para entidades bancarias y notariales.',
        status: 'Pendiente',
      },
    ],
  },
  {
    slug: 'reportes',
    name: 'Reportes',
    shortDescription:
      'Catálogo de informes operativos y gerenciales de ventas, compras, kardex, costos y estados financieros.',
    area: 'Análisis',
    icon: BarChart3,
    status: 'Próximamente',
    entityName: 'Catálogo de informes operativos y gerenciales',
    functions: [
      {
        name: 'Ventas',
        description: 'Reporte consolidado y discriminado por cliente, producto, línea y zona comercial.',
        status: 'Pendiente',
      },
      {
        name: 'Compras',
        description: 'Resumen de compras por proveedor, insumo y cumplimiento de tiempos de entrega.',
        status: 'Pendiente',
      },
      {
        name: 'Inventarios',
        description: 'Existencias físicas y valorizadas en bodega con alertas de stock mínimo de seguridad.',
        status: 'Pendiente',
      },
      {
        name: 'Kardex',
        description: 'Movimiento histórico de entradas y salidas por artículo con saldos continuos.',
        status: 'Pendiente',
      },
      {
        name: 'Lotes',
        description: 'Informe de lotes activos, fechas de fabricación y trazabilidad de destino.',
        status: 'Pendiente',
      },
      {
        name: 'Producción',
        description: 'Seguimiento de órdenes ejecutadas, tiempos de fabricación y cumplimiento de metas.',
        status: 'Pendiente',
      },
      {
        name: 'Desperdicios',
        description: 'Estadística de mermas de parafina y material no recuperable por proceso térmico.',
        status: 'Pendiente',
      },
      {
        name: 'Costos',
        description: 'Variación entre el costo presupuestado y el costo real de fabricación por línea.',
        status: 'Pendiente',
      },
      {
        name: 'Cartera',
        description: 'Antigüedad de saldos de clientes por franjas (corriente, 30, 60 y más de 90 días).',
        status: 'Pendiente',
      },
      {
        name: 'Cuentas por pagar',
        description: 'Proyección de pagos a proveedores de materia prima para control de flujo de caja.',
        status: 'Pendiente',
      },
      {
        name: 'Contables',
        description: 'Emisión de balances de comprobación y auxiliares para soporte tributario.',
        status: 'Pendiente',
      },
      {
        name: 'Nómina',
        description: 'Consolidado mensual de costos salariales, horas extras y aportes de seguridad social.',
        status: 'Pendiente',
      },
      {
        name: 'Documentos electrónicos',
        description: 'Estado de transmisiones emitidas, aceptadas y pendientes de aprobación en la DIAN.',
        status: 'Pendiente',
      },
      {
        name: 'Indicadores básicos',
        description: 'Métricas clave de rotación de producto, margen bruto y días promedio de cobranza.',
        status: 'Pendiente',
      },
      {
        name: 'Exportación a PDF o Excel',
        description: 'Formatos estandarizados descargables listos para auditorías contables y gerencia.',
        status: 'Pendiente',
      },
    ],
  },
]

export const MODULE_AREAS: ModuleArea[] = [
  'Base del sistema',
  'Operación',
  'Finanzas y legal',
  'Análisis',
]

export function getModules(): ModuleItem[] {
  return MODULES
}

export function getModuleBySlug(slug: string): ModuleItem | undefined {
  return MODULES.find((m) => m.slug === slug)
}

export function getModulesByArea(): Record<ModuleArea, ModuleItem[]> {
  const grouped: Record<ModuleArea, ModuleItem[]> = {
    'Base del sistema': [],
    Operación: [],
    'Finanzas y legal': [],
    Análisis: [],
  }

  for (const item of MODULES) {
    grouped[item.area].push(item)
  }

  return grouped
}
