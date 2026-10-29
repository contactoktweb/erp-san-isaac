/**
 * Sistema de Control de Acceso Basado en Roles (RBAC)
 * ERP Velas, Velones y Cirios San Isaac SAS
 * Documento de Requerimientos Técnicos - Sección 4
 */

export const SYSTEM_ROLES = {
  ADMIN: 'ADMIN',
  VENTAS: 'VENTAS',
  JEFE_PLANTA: 'JEFE_PLANTA',
  ALISTAMIENTO: 'ALISTAMIENTO',
} as const

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]

export interface PermissionDefinition {
  code: string
  name: string
  module: 'Administración' | 'Ventas' | 'Producción' | 'Inventarios' | 'Facturación'
  description: string
}

export const GRANULAR_PERMISSIONS: PermissionDefinition[] = [
  // Módulo Administración
  {
    code: 'admin.users.read',
    name: 'Consultar colaboradores',
    module: 'Administración',
    description: 'Visualizar directorio de usuarios internos, sedes y centros de costo.',
  },
  {
    code: 'admin.users.manage',
    name: 'Gestionar colaboradores',
    module: 'Administración',
    description: 'Crear nuevos usuarios, editar datos, alternar estado y restablecer claves.',
  },
  {
    code: 'admin.roles.manage',
    name: 'Administrar roles RBAC',
    module: 'Administración',
    description: 'Configurar permisos asignados a cada uno de los 4 perfiles oficiales.',
  },
  {
    code: 'admin.audit.read',
    name: 'Consultar bitácora de auditoría',
    module: 'Administración',
    description: 'Acceso a la trazabilidad cronológica inmutable de acciones del sistema.',
  },
  {
    code: 'admin.config.manage',
    name: 'Configuraciones e impuestos',
    module: 'Administración',
    description: 'Gestionar consecutivos DIAN, matriz tributaria y respaldos en la nube.',
  },

  // Módulo Ventas y Pedidos
  {
    code: 'orders.read',
    name: 'Consultar pedidos y alistamiento',
    module: 'Ventas',
    description: 'Monitorear el tablero multipedido con semáforos dinámicos en vivo.',
  },
  {
    code: 'orders.create',
    name: 'Crear pedidos manuales',
    module: 'Ventas',
    description: 'Registrar pedidos comerciales en planta con fecha pactada de entrega.',
  },
  {
    code: 'orders.reprogram',
    name: 'Reprogramar fecha pactada',
    module: 'Ventas',
    description: 'Modificar la fecha estipulada de entrega exigiendo motivo obligatorio.',
  },
  {
    code: 'orders.cancel',
    name: 'Cancelar pedidos',
    module: 'Ventas',
    description: 'Anulación formal del pedido con reversión inmediata de empaque a stock.',
  },
  {
    code: 'orders.invoice',
    name: 'Facturación electrónica DIAN',
    module: 'Facturación',
    description: 'Habilitar conversión de pedido empacado al 100% en Factura Electrónica.',
  },

  // Módulo Producción y Empaque
  {
    code: 'packing.read',
    name: 'Visualizar avance de empaque',
    module: 'Producción',
    description: 'Consultar pedidos en alistamiento y desglose de cajas armadas.',
  },
  {
    code: 'packing.create_box',
    name: 'Armar cajas de empaque',
    module: 'Producción',
    description: 'Crear cajas mixtas ("Caja X de N") y descontar unidades por lote PEPS.',
  },
  {
    code: 'packing.correct_box',
    name: 'Corregir y rectificar cajas',
    module: 'Producción',
    description: 'Rectificar unidades en caja por cubicaje físico y devolver saldo pendiente.',
  },
  {
    code: 'packing.print_labels',
    name: 'Imprimir rótulos y Packing List',
    module: 'Producción',
    description: 'Generar e imprimir rótulos de caja individual y lista de despacho en PDF.',
  },

  // Módulo Inventarios
  {
    code: 'inventory.read',
    name: 'Consultar catálogo y stock',
    module: 'Inventarios',
    description: 'Ver inventario disponible de parafinas, pabilos, velones y cirios.',
  },
  {
    code: 'inventory.kardex',
    name: 'Kardex valorizado PEPS',
    module: 'Inventarios',
    description: 'Historial valorizado de entradas, salidas y saldos por método PEPS.',
  },
]

export const ROLE_PERMISSION_MATRIX: Record<string, string[]> = {
  ADMIN: GRANULAR_PERMISSIONS.map((p) => p.code),
  VENTAS: [
    'orders.read',
    'orders.create',
    'orders.reprogram',
    'orders.invoice',
    'inventory.read',
    'packing.read',
    'admin.users.read',
  ],
  JEFE_PLANTA: [
    'orders.read',
    'packing.read',
    'packing.create_box',
    'packing.correct_box',
    'packing.print_labels',
    'inventory.read',
    'inventory.kardex',
    'admin.users.read',
  ],
  ALISTAMIENTO: [
    'orders.read',
    'packing.read',
    'packing.create_box',
    'packing.correct_box',
    'packing.print_labels',
  ],
}

/**
 * Verifica si un rol específico posee un permiso determinado en el sistema
 */
export function hasPermission(roleName: string | undefined | null, permissionCode: string): boolean {
  if (!roleName) return false
  const normalizedRole = roleName.trim().toUpperCase()
  if (normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR') {
    return true
  }
  const permissions = ROLE_PERMISSION_MATRIX[normalizedRole] || []
  return permissions.includes(permissionCode)
}

/**
 * Nombres y etiquetas descriptivas para mostrar los roles en la interfaz
 */
export const ROLE_DISPLAY_NAMES: Record<string, { label: string; badgeVariant: 'default' | 'info' | 'warning' | 'outline' }> = {
  ADMIN: { label: 'Administrador / Gerencia', badgeVariant: 'default' },
  VENTAS: { label: 'Ventas / Comercial', badgeVariant: 'info' },
  JEFE_PLANTA: { label: 'Jefe de Producción / Planta', badgeVariant: 'warning' },
  ALISTAMIENTO: { label: 'Encargado de Alistamiento', badgeVariant: 'outline' },
}
