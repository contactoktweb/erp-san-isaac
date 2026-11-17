import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

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

          // En producción: validar contra las credenciales de entorno (sin BD)
          // La BD real se habilitará cuando DATA_SOURCE="prisma" esté activo en producción
          if (process.env.DATA_SOURCE !== 'prisma') {
            const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
            const adminPassword = process.env.SEED_ADMIN_PASSWORD

            if (
              adminEmail &&
              adminPassword &&
              normalizedEmail === adminEmail &&
              parsed.data.password === adminPassword
            ) {
              return { id: 'prod-admin', name: 'Administrador', email: normalizedEmail, role: 'ADMIN' }
            }
            return null
          }

          // En desarrollo (DATA_SOURCE="prisma"): autenticación real contra Supabase/Prisma
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
