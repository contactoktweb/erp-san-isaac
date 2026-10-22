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

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Faltan las variables de entorno requeridas SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD. Asegúrate de definirlas en tu archivo .env o .env.local.'
    )
  }

  console.log('Iniciando seed de la base de datos...')

  // 1. Upsert del Rol ADMIN
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      description: 'Administrador general con acceso total al sistema',
    },
    create: {
      name: 'ADMIN',
      description: 'Administrador general con acceso total al sistema',
    },
  })
  console.log(`Rol asegurado: ${adminRole.name} (ID: ${adminRole.id})`)

  // 2. Hash de la contraseña con bcryptjs
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds)

  // 3. Upsert del Usuario Administrador
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isActive: true,
      roleId: adminRole.id,
    },
    create: {
      name: 'Administrador San Isaac',
      email: adminEmail,
      passwordHash,
      isActive: true,
      roleId: adminRole.id,
    },
  })
  console.log(`Usuario administrador asegurado: ${adminUser.email} (ID: ${adminUser.id})`)
  console.log('Seed completado exitosamente.')
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
