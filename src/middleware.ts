import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Matriz de visibilidad de rutas por rol.
 * Solo ADMIN tiene acceso total. Los demás roles solo ven lo que les corresponde.
 * Si una ruta no está en este mapa, es accesible para cualquier usuario autenticado.
 */
const ROLE_PROTECTED_ROUTES: Record<string, string[]> = {
  // Solo ADMIN
  '/dashboard/administracion':          ['ADMIN'],
  '/dashboard/compras':                 ['ADMIN'],
  '/dashboard/contabilidad':            ['ADMIN'],
  '/dashboard/nomina':                  ['ADMIN'],
  '/dashboard/libros-societarios':      ['ADMIN'],
  '/dashboard/reportes':                ['ADMIN'],
  '/dashboard/pos':                     ['ADMIN'],
  // ADMIN + VENTAS
  '/dashboard/documentos-electronicos': ['ADMIN', 'VENTAS'],
  // ADMIN + VENTAS + JEFE_PLANTA
  '/dashboard/inventarios':             ['ADMIN', 'VENTAS', 'JEFE_PLANTA'],
  // ADMIN + JEFE_PLANTA + ALISTAMIENTO
  '/dashboard/produccion':              ['ADMIN', 'JEFE_PLANTA', 'ALISTAMIENTO'],
  // Todos los roles autenticados
  '/dashboard/ventas':                  ['ADMIN', 'VENTAS', 'JEFE_PLANTA', 'ALISTAMIENTO'],
}

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

  // Verificar restricciones por rol para rutas protegidas
  const userRole = (token.role as string | undefined)?.trim().toUpperCase() ?? ''

  // ADMIN tiene acceso total — salta cualquier verificación de ruta
  if (userRole === 'ADMIN') {
    return NextResponse.next()
  }

  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      const hasAccess = allowedRoles.some((r) => r.toUpperCase() === userRole)
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
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
