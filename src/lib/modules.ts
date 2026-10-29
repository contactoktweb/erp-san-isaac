import {
  BarChart3,
  BookOpen,
  Boxes,
  Factory,
  FileCheck2,
  Scale,
  Settings,
  ShoppingCart,
  Store,
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
      {
        name: 'Registro de puntos de venta (POS)',
        description: 'Parametrización de mostradores, cajas físicas y tiendas vinculadas a sedes y bodegas.',
        status: 'Pendiente',
      },
      {
        name: 'Copias de seguridad y Google Drive',
        description: 'Copia diaria nocturna automatizada de Supabase hacia Google Drive con trazabilidad y alertas.',
        status: 'Disponible',
      },
    ],
  },
  {
    slug: 'inventarios',
    name: 'Inventarios',
    shortDescription:
      'Control de existencias de parafinas, pabilos, colorantes, velones y cirios con unidades base, PEPS y lotes.',
    area: 'Operación',
    icon: Boxes,
    status: 'Próximamente',
    entityName: 'Existencias y lotes de inventario',
    functions: [
      {
        name: 'Catálogo unificado y tienda web',
        description: 'Catálogo maestro con código/SKU sincronizado y switch de visibilidad para venta directa/web.',
        status: 'Pendiente',
      },
      {
        name: 'Presentaciones comerciales y unidades base',
        description: 'Conversión a unidad base (kg/unidad) para Unidad (1), Docena (12), Paquete, Display, Presentación Caja y Bulto.',
        status: 'Pendiente',
      },
      {
        name: 'Lotes y asignación PEPS automática',
        description: 'Trazabilidad por lote con sugerencia automática PEPS (FIFO) al momento de empacar pedidos.',
        status: 'Pendiente',
      },
      {
        name: 'Descuento de stock en empaque y reversión',
        description: 'Descargue inmediato al sellar cajas y reingreso automático al inventario disponible si se anula o corrige.',
        status: 'Pendiente',
      },
      {
        name: 'Bodegas operativas',
        description: 'Bodega Principal de Producto Terminado (Planta) y bodegas secundarias de insumos y materias primas.',
        status: 'Pendiente',
      },
      {
        name: 'Movimientos y traslados',
        description: 'Registro formal de entradas, salidas, mermas de fundición y traslados entre bodegas.',
        status: 'Pendiente',
      },
      {
        name: 'Ajustes y conteo físico',
        description: 'Correcciones periódicas de existencias por arqueo físico en planta.',
        status: 'Pendiente',
      },
      {
        name: 'Kardex valorizado (PEPS o Promedio Ponderado)',
        description: 'Historial cronológico detallado de entradas, salidas y saldos continuos con selector de método de valoración activo.',
        status: 'Disponible',
      },
      {
        name: 'Control contable y tributario de inventarios',
        description: 'Imputación automática a cuentas PUC según concepto: Ajustes, Devoluciones, Pérdidas, Desperdicios, Bajas, Traslados y Costo de ventas.',
        status: 'Disponible',
      },
      {
        name: 'Productos en proceso (Cuenta 1410)',
        description: 'Administración de mezclas, pailas en fundición y lotes en proceso antes de su traspaso a producto terminado (1430).',
        status: 'Disponible',
      },
    ],
  },
  {
    slug: 'produccion',
    name: 'Producción y costos',
    shortDescription:
      'Fichas técnicas, órdenes de fabricación, hoja de costos paramétrica y simulador de precios de venta.',
    area: 'Operación',
    icon: Factory,
    status: 'Próximamente',
    entityName: 'Órdenes de producción, recetas y costos',
    functions: [
      {
        name: 'Hoja de costos paramétrica',
        description: 'Cálculo del costo unitario total: Insumos con % de merma + Mano de Obra Directa (MOD) + CIF/Energéticos.',
        status: 'Pendiente',
      },
      {
        name: 'Simulador dinámico de precios',
        description: 'Cálculo de precio sugerido sin IVA por canal comercial: Detal (60%), Mayoreo (35%) y Distribuidor (20%).',
        status: 'Pendiente',
      },
      {
        name: 'Fórmulas y recetas versionadas',
        description: 'Dosificación exacta de ceras, parafinas, esencias, colorantes y pabilos con historial de versiones.',
        status: 'Pendiente',
      },
      {
        name: 'Órdenes de producción',
        description: 'Programación y seguimiento de lotes de fabricación por línea de moldeo, vaciado o prensado.',
        status: 'Pendiente',
      },
      {
        name: 'Consumos reales y mermas',
        description: 'Registro de consumos teóricos vs reales y control de pérdidas térmicas de fundición.',
        status: 'Pendiente',
      },
      {
        name: 'Reprocesos y rendimientos',
        description: 'Recuperación de cera sobrante para pailas y análisis de eficiencia por kilogramo procesado.',
        status: 'Pendiente',
      },
      {
        name: 'Mano de obra directa (MOD)',
        description: 'Tarifa horaria por operario imputada a las etapas de prensado, llenado y empaque.',
        status: 'Pendiente',
      },
      {
        name: 'Costos indirectos y energéticos (CIF)',
        description: 'Prorrateo de gas en calderas, energía eléctrica, arriendo de planta y supervisión.',
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
      {
        name: 'Impuestos y retenciones en compras',
        description: 'Liquidación automática de IVA descontable, Retefuente, ReteIVA y ReteICA según RUT y bases mínimas.',
        status: 'Disponible',
      },
      {
        name: 'Documentos soporte y archivos adjuntos',
        description: 'Emisión de Documento Soporte a no obligados ante la DIAN y resguardo digital de facturas/remisiones.',
        status: 'Disponible',
      },
    ],
  },
  {
    slug: 'ventas',
    name: 'Ventas y cartera',
    shortDescription:
      'Gestor dinámico de pedidos por fechas, empaque progresivo en cajas combinadas, alertas de entrega y cartera.',
    area: 'Finanzas y legal',
    icon: ShoppingCart,
    status: 'Próximamente',
    entityName: 'Gestor de pedidos complejos y empaque',
    functions: [
      {
        name: 'Gestor dinámico de pedidos y plazos',
        description: 'Cálculo automático de ventana de días (Entrega - Recepción), días transcurridos y cuenta regresiva de atraso.',
        status: 'Pendiente',
      },
      {
        name: 'Alistamiento progresivo multi-pedido',
        description: 'Capacidad de gestionar múltiples pedidos abiertos simultáneamente durante temporadas altas de producción.',
        status: 'Pendiente',
      },
      {
        name: 'Cajas de empaque combinadas (mixtas)',
        description: 'Asignación flexible de múltiples referencias en una misma caja física numerada internamente (Caja X de N).',
        status: 'Pendiente',
      },
      {
        name: 'Bloqueo de sobre-empaque y corrección',
        description: 'Bloqueo estricto si se intenta empacar de más y recálculo inmediato de saldos al corregir cantidades en caja.',
        status: 'Pendiente',
      },
      {
        name: 'Semáforo dinámico de alertas',
        description: 'Monitoreo visual: 🟢 En plazo, 🟡 Preventivo (≤3 días), 🔴 Vencido/Retraso y 🔵 100% Empacado.',
        status: 'Pendiente',
      },
      {
        name: 'Origen dual y Tienda en Línea',
        description: 'Consecutivo maestro PED-2026-XXXX con campo visible para N° de Orden Web (ej. WEB-1045) y búsqueda dual.',
        status: 'Pendiente',
      },
      {
        name: 'Conversión directa a Venta y Factura',
        description: 'Habilitación de botón directo al 100% de empaque para precargar datos y emitir Factura Electrónica DIAN.',
        status: 'Pendiente',
      },
      {
        name: 'Packing List y Rótulos PDF',
        description: 'Generación descargable de lista de empaque por pedido desglosado por caja y rótulos de identificación.',
        status: 'Pendiente',
      },
      {
        name: 'Cotizaciones y cartera de clientes',
        description: 'Propuestas comerciales, ventas de contado y crédito (15, 30 y 45 días) y control de antigüedad de saldos.',
        status: 'Disponible',
      },
    ],
  },
  {
    slug: 'pos',
    name: 'Punto de Venta - POS',
    shortDescription:
      'Control de mostradores físicos, apertura y cierre de caja, arqueos con semáforo, medios de pago mixtos y Documento Equivalente POS.',
    area: 'Finanzas y legal',
    icon: Store,
    status: 'Próximamente',
    entityName: 'Turnos de caja, ventas de mostrador y POS',
    functions: [
      {
        name: 'Apertura y cierre de caja',
        description: 'Registro de base inicial en efectivo, asignación de cajero/turno y control de tiempo de mostrador.',
        status: 'Disponible',
      },
      {
        name: 'Arqueo de caja y semáforo de cuadre',
        description: 'Comparativo automático: Dinero esperado vs Dinero contado con semáforo (🟢 Caja Cuadrada vs 🔴 Descuadre).',
        status: 'Disponible',
      },
      {
        name: 'Venta rápida de mostrador y lector de barras',
        description: 'Búsqueda ágil por código/nombre, selección de presentación comercial y descargue inmediato de inventario físico.',
        status: 'Disponible',
      },
      {
        name: 'Medios de pago mixtos',
        description: 'Registro de efectivo (con cálculo automático de cambio/vueltas), transferencias (Nequi/Daviplata/Bancolombia) y tarjetas.',
        status: 'Disponible',
      },
      {
        name: 'Documento equivalente electrónico POS',
        description: 'Generación con resolución autorizada, XML, firma digital, código QR y opción de FEV si el cliente lo solicita.',
        status: 'Disponible',
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
      {
        name: 'Estados financieros NIIF y revelaciones',
        description: 'Estado de Flujos de Efectivo, Cambios en el Patrimonio, comparativos de periodos y notas explicativas.',
        status: 'Disponible',
      },
      {
        name: 'Estado de costos de producción y ventas integrado',
        description: 'Integración contable de inventario inicial/final de MP, compras, MOD (7205), CIF (7305), producto en proceso (1410) y producto terminado (1430).',
        status: 'Disponible',
      },
      {
        name: 'Conciliación bancaria por extractos',
        description: 'Cruce de extractos bancarios con libros auxiliares y semáforo condicional (🟢 Conciliada, 🟡 Pendiente causar, 🔴 Diferencia).',
        status: 'Disponible',
      },
      {
        name: 'Asistente de información exógena DIAN',
        description: 'Configuración de formatos y conceptos, cruce de cuentas PUC con terceros, validación de cuantías y exportación.',
        status: 'Disponible',
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
      {
        name: 'Notas crédito, débito y notas de ajuste',
        description: 'Anulación o corrección de facturas, nómina electrónica y documentos soporte referenciando CUFE/CUNE/CUDS.',
        status: 'Disponible',
      },
      {
        name: 'Documento equivalente electrónico POS',
        description: 'Transmisión y control de ventas de mostrador con código QR y consulta de respuestas electrónicas.',
        status: 'Disponible',
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
        name: 'Aportes y parafiscales (Art. 114-1 E.T.)',
        description: 'Planilla PILA con exoneración automática de salud patronal, SENA e ICBF para devengos menores a 10 SMMLV.',
        status: 'Disponible',
      },
      {
        name: 'Nómina electrónica',
        description: 'Preparación de registros individuales para transmisión mensual certificada ante la DIAN.',
        status: 'Pendiente',
      },
      {
        name: 'Integración contable y de costos de nómina',
        description: 'Direccionamiento automático de personal de planta (CC-100) a 7205 MOD / 7305 CIF / 1410 y personal administrativo a 5105/5205.',
        status: 'Disponible',
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
        name: 'Participaciones y capital',
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
      {
        name: 'Títulos de acciones numerados (PDF)',
        description: 'Generación y descarga en formato PDF de títulos individuales con constancia de derechos al dorso.',
        status: 'Disponible',
      },
      {
        name: 'Archivos adjuntos y descarga de documentos',
        description: 'Repositorio seguro de estatutos sociales, actas firmadas y certificados de Cámara de Comercio.',
        status: 'Disponible',
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
      {
        name: 'Reprocesos y rendimientos',
        description: 'Análisis cuantitativo de recuperación de ceras en pailas y rendimiento fabril.',
        status: 'Disponible',
      },
      {
        name: 'Información exógena / Medios magnéticos',
        description: 'Informe maestro de cruces fiscales y formatos 1001, 1007 y 1003 para la DIAN.',
        status: 'Disponible',
      },
      {
        name: 'Ventas y arqueos de Punto de Venta (POS)',
        description: 'Consolidado de tirillas POS, cuadres de caja por turno y reporte de faltantes/sobrantes.',
        status: 'Disponible',
      },
      {
        name: 'Tesorería, flujo operativo y conciliación bancaria',
        description: 'Proyección de cobros y pagos con conciliación de saldos en cuentas corrientes.',
        status: 'Disponible',
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
