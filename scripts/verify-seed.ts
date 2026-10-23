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
  console.log('--- VERIFICACIÓN DE REGISTROS EN LA BASE DE DATOS ---')

  const totalRoles = await prisma.role.count()
  const totalUsers = await prisma.user.count()

  console.log(`\nTotal de Roles registrados: ${totalRoles}`)
  const roles = await prisma.role.findMany()
  roles.forEach((role) => {
    console.log(`  -> Rol: "${role.name}" | ID: ${role.id}`)
  })

  console.log(`\nTotal de Usuarios registrados: ${totalUsers}`)
  const users = await prisma.user.findMany({ include: { role: true } })
  users.forEach((user) => {
    console.log(`  -> Usuario: "${user.email}" | Nombre: "${user.name}" | Rol: "${user.role.name}" | ID: ${user.id}`)
  })

  console.log('\n--- RESULTADO DE LA PRUEBA ---')
  if (totalRoles === 1 && totalUsers === 1) {
    console.log('✅ ÉXITO: Existe exactamente 1 Rol y 1 Usuario. No hay datos duplicados.')
  } else {
    console.log(`⚠️ ALERTA: Se encontraron ${totalRoles} roles y ${totalUsers} usuarios.`)
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
