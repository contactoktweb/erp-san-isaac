import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// En Vercel o producción, si falta NEXTAUTH_URL, se infiere automáticamente desde VERCEL_URL
if (process.env.VERCEL_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
