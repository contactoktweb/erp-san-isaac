import { PrismaClient } from '@prisma/client'

/**
 * Cliente Prisma singleton.
 * Solo se instancia en desarrollo (NODE_ENV !== 'production').
 * En producción, todo el acceso a datos usa los repositorios Mock.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[Prisma] No se permite conexión a base de datos en producción. ' +
      'Usa los repositorios Mock o configura DATA_SOURCE correctamente.'
    )
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
