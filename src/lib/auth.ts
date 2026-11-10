import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

// Credenciales de demostración activas cuando no hay BD disponible (producción)
const DEMO_USERS = [
  {
    id: 'demo-admin',
    name: 'Administrador San Isaac',
    email: 'admin@saisaac.com',
    passwordHash: '$2a$10$demo.hash.placeholder', // nunca coincide; login real via Prisma
    role: { name: 'ADMIN' },
    isActive: true,
  },
]

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(rawCredentials) {
        try {
          const parsed = credentialsSchema.safeParse(rawCredentials)
          if (!parsed.success) {
            return null
          }

          const normalizedEmail = parsed.data.email.trim().toLowerCase()

          // En producción usar autenticación mock (sin BD)
          if (process.env.NODE_ENV === 'production') {
            const { MOCK_ADMIN_EMAIL, MOCK_ADMIN_PASSWORD } = process.env
            if (
              MOCK_ADMIN_EMAIL &&
              MOCK_ADMIN_PASSWORD &&
              normalizedEmail === MOCK_ADMIN_EMAIL.toLowerCase() &&
              parsed.data.password === MOCK_ADMIN_PASSWORD
            ) {
              return { id: 'demo-admin', name: 'Administrador', email: normalizedEmail, role: 'ADMIN' }
            }
            return null
          }

          // En desarrollo: autenticación real contra Supabase/Prisma
          const { prisma } = await import('@/lib/prisma')

          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { role: true },
          })

          // Rechazar credenciales si el usuario no existe o está inactivo
          if (!user || !user.isActive) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          // Registrar evento de auditoría de inicio de sesión
          try {
            await prisma.auditLog.create({
              data: {
                action: 'LOGIN_SUCCESS',
                entity: 'Auth',
                entityId: user.id,
                userName: user.name,
                userId: user.id,
                details: `Inicio de sesión exitoso con rol ${user.role.name}`,
                ipAddress: '127.0.0.1 (Web Session)',
              },
            })
          } catch {}

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
          }
        } catch (error) {
          console.error('[NextAuth] Error durante la autenticación:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? ''
        session.user.role = (token.role as string) ?? ''
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
}
