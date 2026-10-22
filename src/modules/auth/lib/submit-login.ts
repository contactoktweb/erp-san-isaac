import { signIn } from 'next-auth/react'
import type { LoginValues } from '../schemas/login-schema'

export type SubmitLoginResult = { ok: true } | { ok: false; error: string }

export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos'

/**
 * Autentica al usuario contra el backend mediante NextAuth (Credentials).
 * Normaliza el email a minúsculas y sin espacios antes de enviar.
 * Devuelve un mensaje genérico ante cualquier error o rechazo para no filtrar
 * si el correo existe o no en el sistema.
 */
export async function submitLogin(values: LoginValues): Promise<SubmitLoginResult> {
  try {
    const res = await signIn('credentials', {
      email: values.email.trim().toLowerCase(),
      password: values.password,
      redirect: false,
    })

    if (!res || !res.ok || res.error) {
      return { ok: false, error: INVALID_CREDENTIALS_MESSAGE }
    }

    return { ok: true }
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    return { ok: false, error: INVALID_CREDENTIALS_MESSAGE }
  }
}
