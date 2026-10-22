import { signOut } from 'next-auth/react'

/**
 * Cierra la sesión activa del usuario a través de NextAuth e invalida la cookie de sesión,
 * redirigiendo al usuario a la página de login.
 */
export async function signOutUser(): Promise<void> {
  await signOut({ callbackUrl: '/login' })
}
