export * from './site-config'

/**
 * Configuración centralizada de variables de entorno del sistema.
 */
export const envConfig = {
  dataSource: (process.env.DATA_SOURCE || 'mock').toLowerCase() as 'mock' | 'prisma',
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  seedAdmin: {
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
  },
} as const

/**
 * Formatea un valor numérico a moneda legal colombiana (COP) sin decimales.
 * Ejemplo: 1250000 -> "$ 1.250.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha ISO o Date a formato dd/MM/yyyy en hora de Colombia.
 * Ejemplo: "2026-03-15T08:00:00.000Z" -> "15/03/2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(d)
}

/**
 * Formatea cantidades con separador de miles colombiano.
 * Ejemplo: 15000 -> "15.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 2,
  }).format(value)
}
