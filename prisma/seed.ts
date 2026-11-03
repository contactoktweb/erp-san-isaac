import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Cargar variables de entorno si el script se ejecuta directamente con tsx
try {
  if (typeof (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile === 'function') {
    try { (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile('.env.local') } catch {}
    try { (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile('.env') } catch {}
  }
} catch {}

const prisma = new PrismaClient()

// Matriz Oficial de 4 Roles según Documento de Requerimientos Técnicos (Sección 4)
const ROLES = [
  {
    name: 'ADMIN',
    description: 'Administrador / Gerencia. Control total sobre pedidos, reprogramaciones, cancelaciones, auditoría y facturación.',
  },
  {
    name: 'VENTAS',
    description: 'Ventas / Comercial. Crear pedidos manuales, gestionar pedidos web, reprogramar con motivo obligatorio y facturar.',
  },
  {
    name: 'JEFE_PLANTA',
    description: 'Jefe de Producción / Planta. Tablero multipedido, alistamiento simultáneo, empaque e impresión de rótulos.',
  },
  {
    name: 'ALISTAMIENTO',
    description: 'Encargado de Alistamiento. Crear Cajas de Empaque, registrar unidades por lote PEPS y corregir conteos en planta.',
  },
]

// Catálogo de Permisos Granulares
const PERMISSIONS = [
  // Módulo Administración
  { code: 'admin.users.read', name: 'Consultar colaboradores', module: 'Administración', description: 'Ver directorio de usuarios internos' },
  { code: 'admin.users.manage', name: 'Gestionar colaboradores', module: 'Administración', description: 'Crear, editar, activar/desactivar usuarios' },
  { code: 'admin.roles.manage', name: 'Administrar roles RBAC', module: 'Administración', description: 'Asignar permisos y perfiles de acceso' },
  { code: 'admin.audit.read', name: 'Consultar bitácora de auditoría', module: 'Administración', description: 'Ver trazabilidad de eventos del sistema' },
  { code: 'admin.config.manage', name: 'Configuraciones e impuestos', module: 'Administración', description: 'Parámetros, consecutivos DIAN e impuestos' },
  // Módulo Ventas y Pedidos
  { code: 'orders.read', name: 'Consultar pedidos y alistamiento', module: 'Ventas', description: 'Ver pedidos comerciales y semáforos de plazo' },
  { code: 'orders.create', name: 'Crear pedidos manuales', module: 'Ventas', description: 'Registrar órdenes comerciales de clientes' },
  { code: 'orders.reprogram', name: 'Reprogramar fecha de entrega', module: 'Ventas', description: 'Cambiar fecha pactada con motivo obligatorio' },
  { code: 'orders.cancel', name: 'Cancelar pedidos', module: 'Ventas', description: 'Anular pedidos y revertir empaque a stock' },
  { code: 'orders.invoice', name: 'Facturación electrónica', module: 'Ventas', description: 'Generar factura y convertir en venta al 100%' },
  // Módulo Producción y Empaque
  { code: 'packing.read', name: 'Monitorear avance de empaque', module: 'Producción', description: 'Ver pedidos en alistamiento y cajas armadas' },
  { code: 'packing.create_box', name: 'Armar cajas de empaque', module: 'Producción', description: 'Crear caja mixta y descontar lotes PEPS' },
  { code: 'packing.correct_box', name: 'Corregir y rectificar cajas', module: 'Producción', description: 'Editar unidades empacadas y devolver saldo' },
  { code: 'packing.print_labels', name: 'Imprimir rótulos y Packing List', module: 'Producción', description: 'Generar PDF de caja X de N y lista de despacho' },
  // Módulo Inventarios
  { code: 'inventory.read', name: 'Consultar existencias', module: 'Inventarios', description: 'Ver stock de parafinas, velones y cirios' },
  { code: 'inventory.kardex', name: 'Kardex valorizado PEPS', module: 'Inventarios', description: 'Consultar movimientos y valoración contable' },
]

// Mapeo de Permisos por Rol
const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.code), // Acceso total
  VENTAS: [
    'orders.read',
    'orders.create',
    'orders.reprogram',
    'orders.invoice',
    'inventory.read',
    'packing.read',
  ],
  JEFE_PLANTA: [
    'orders.read',
    'packing.read',
    'packing.create_box',
    'packing.correct_box',
    'packing.print_labels',
    'inventory.read',
    'inventory.kardex',
  ],
  ALISTAMIENTO: [
    'orders.read',
    'packing.read',
    'packing.create_box',
    'packing.correct_box',
    'packing.print_labels',
  ],
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@vvcsanisaac.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'SanIsaac2026*'

  console.log('Iniciando seed de la base de datos (Fase 2: RBAC y Auditoría)...')

  // 1. Upsert de los 4 Roles Oficiales
  const savedRoles: Record<string, string> = {}
  for (const r of ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    })
    savedRoles[r.name] = roleRecord.id
    console.log(`Rol asegurado: ${roleRecord.name} (ID: ${roleRecord.id})`)
  }

  // 2. Upsert de Permisos Granulares
  const savedPermissions: Record<string, string> = {}
  for (const p of PERMISSIONS) {
    const permRecord = await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module, description: p.description },
      create: { code: p.code, name: p.name, module: p.module, description: p.description },
    })
    savedPermissions[p.code] = permRecord.id
  }
  console.log(`Permisos granulares catalogados: ${PERMISSIONS.length}`)

  // 3. Vincular Permisos a cada Rol
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    const roleId = savedRoles[roleName]
    if (!roleId) continue

    for (const code of permCodes) {
      const permissionId = savedPermissions[code]
      if (!permissionId) continue

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      })
    }
  }
  console.log('Matriz de permisos asignada a roles exitosamente.')

  // 4. Hash con bcryptjs para contraseñas seguras
  const saltRounds = 10
  const adminHash = await bcrypt.hash(adminPassword, saltRounds)
  const defaultCollabHash = await bcrypt.hash('SanIsaac2026*', saltRounds)

  // 5. Upsert del Usuario Administrador Principal
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      isActive: true,
      roleId: savedRoles.ADMIN,
      assignedBranch: 'Sede Administrativa Bogotá',
      costCenter: 'CC-200 Administración',
    },
    create: {
      name: 'Administrador San Isaac',
      email: adminEmail,
      passwordHash: adminHash,
      isActive: true,
      roleId: savedRoles.ADMIN,
      assignedBranch: 'Sede Administrativa Bogotá',
      costCenter: 'CC-200 Administración',
    },
  })
  console.log(`Usuario administrador asegurado: ${adminUser.email} (ID: ${adminUser.id})`)

  // 6. Colaboradores de Fábrica y Planta para los 4 Roles
  const PLANT_USERS = [
    {
      name: 'Carlos Alberto Méndez',
      email: 'carlos.mendez@vvcsanisaac.com',
      role: 'JEFE_PLANTA',
      assignedBranch: 'Planta Principal Guaduas',
      costCenter: 'CC-100 Producción',
    },
    {
      name: 'Sonia Esperanza Pardo',
      email: 'sonia.pardo@vvcsanisaac.com',
      role: 'VENTAS',
      assignedBranch: 'Sede Administrativa Bogotá',
      costCenter: 'CC-400 Ventas',
    },
    {
      name: 'Jorge Eliécer Duarte',
      email: 'jorge.duarte@vvcsanisaac.com',
      role: 'ALISTAMIENTO',
      assignedBranch: 'Bodega Central Guaduas',
      costCenter: 'CC-300 Logística',
    },
  ]

  for (const pu of PLANT_USERS) {
    const roleId = savedRoles[pu.role]
    if (!roleId) continue

    await prisma.user.upsert({
      where: { email: pu.email },
      update: {
        name: pu.name,
        roleId,
        assignedBranch: pu.assignedBranch,
        costCenter: pu.costCenter,
        isActive: true,
      },
      create: {
        name: pu.name,
        email: pu.email,
        passwordHash: defaultCollabHash,
        roleId,
        assignedBranch: pu.assignedBranch,
        costCenter: pu.costCenter,
        isActive: true,
      },
    })
  }
  console.log(`Colaboradores de planta y ventas asegurados (${PLANT_USERS.length} usuarios).`)

  // 7. Registro de Auditoría Inicial
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'init-phase-2',
      details: 'Sembrado inicial de 4 roles oficiales, matriz de permisos granulares RBAC y usuarios de planta.',
      userName: adminUser.name,
      userId: adminUser.id,
      ipAddress: '127.0.0.1 (Local)',
    },
  })
  console.log('Registro de auditoría inicial creado con éxito.')
  console.log('Seed Fase 2 completado exitosamente.')
}

main()
  .catch(async (error) => {
    console.error('Error durante la ejecución del seed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
