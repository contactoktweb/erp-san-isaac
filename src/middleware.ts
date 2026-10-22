import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Obtener el token de sesión JWT usando el secreto de NextAuth
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const isAuthPage = pathname.startsWith('/login')

  // Si el usuario ya está autenticado e intenta acceder a /login, redirigir a /dashboard
  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Si no hay sesión activa y la ruta es protegida, redirigir a /login
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - api/auth (rutas de autenticación de NextAuth)
     * - api/health (monitoreo y health check)
     * - _next/static, _next/image (archivos estáticos de Next.js)
     * - favicon.ico, imágenes públicas y archivos de assets
     */
    '/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
