import { PrismaClient } from '@prisma/client'

// Cargar variables de entorno si el script se ejecuta directamente con tsx
try {
  if (typeof (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile === 'function') {
    try { (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile('.env.local') } catch {}
    try { (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile('.env') } catch {}
  }
} catch {}

const prisma = new PrismaClient()

async function main() {
  console.log('--- VERIFICACIÓN DE FASE 2: RBAC Y AUDITORÍA EN BASE DE DATOS ---')

  const totalRoles = await prisma.role.count()
  const totalPermissions = await prisma.permission.count()
  const totalUsers = await prisma.user.count()
  const totalLogs = await prisma.auditLog.count()

  console.log(`\nTotal de Roles registrados: ${totalRoles}`)
  const roles = await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } })
  roles.forEach((role) => {
    console.log(`  -> Rol: "${role.name}" (${role.permissions.length} permisos asignados) | ID: ${role.id}`)
  })

  console.log(`\nTotal de Permisos Granulares registrados: ${totalPermissions}`)

  console.log(`\nTotal de Usuarios registrados: ${totalUsers}`)
  const users = await prisma.user.findMany({ include: { role: true } })
  users.forEach((user) => {
    console.log(`  -> Usuario: "${user.email}" | Nombre: "${user.name}" | Rol: "${user.role.name}" | Sede: "${user.assignedBranch}"`)
  })

  console.log(`\nTotal de Registros de Auditoría: ${totalLogs}`)
  const logs = await prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  logs.forEach((log) => {
    console.log(`  -> [${log.action}] ${log.entity} - ${log.details} (${log.userName || 'Sistema'})`)
  })

  console.log('\n--- RESULTADO DE LA PRUEBA FASE 2 ---')
  if (totalRoles >= 4 && totalPermissions >= 15 && totalUsers >= 4) {
    console.log('✅ ÉXITO: Los 4 roles oficiales, matriz de permisos y usuarios de planta están presentes.')
  } else {
    console.log(`⚠️ ALERTA: Faltan registros en la base de datos (${totalRoles} roles, ${totalPermissions} permisos, ${totalUsers} usuarios).`)
  }
}

main()
  .catch((e) => {
    console.error('Error al verificar:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
