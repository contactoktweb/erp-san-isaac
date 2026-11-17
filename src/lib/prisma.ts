import { PrismaClient } from '@prisma/client'

/**
 * Cliente Prisma singleton con inicialización lazy.
 *
 * En producción con DATA_SOURCE="mock", Prisma nunca se instancia.
 * El error solo se lanza si se intenta USAR el cliente, no al importarlo,
 * lo que permite que el build de Next.js complete sin fallar.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

// Proxy lazy: solo instancia PrismaClient cuando se accede a una propiedad real.
// En producción con DATA_SOURCE="mock" este proxy nunca se activa.
function createLazyPrisma(): PrismaClient {
  let instance: PrismaClient | null = null

  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (process.env.DATA_SOURCE !== 'prisma' && process.env.NODE_ENV === 'production') {
        throw new Error(
          '[Prisma] No se permite conexión a base de datos en producción con DATA_SOURCE="mock". ' +
          'Configura DATA_SOURCE="prisma" para habilitar la BD real.'
        )
      }
      if (!instance) {
        instance = globalForPrisma.prisma ?? createPrismaClient()
        if (process.env.NODE_ENV !== 'production') {
          globalForPrisma.prisma = instance
        }
      }
      return (instance as unknown as Record<string | symbol, unknown>)[prop]
    },
  })
}

export const prisma = createLazyPrisma()
