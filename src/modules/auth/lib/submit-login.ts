import type { LoginValues } from '../schemas/login-schema'

export type SubmitLoginResult = { ok: true } | { ok: false; error: string }

export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos'

/**
 * TODO: conectar con la autenticación real (NextAuth + base de datos).
 * Reemplazar todo el cuerpo por la llamada real, por ejemplo:
 *   const res = await signIn('credentials', { ...values, redirect: false })
 *   return res?.ok ? { ok: true } : { ok: false, error: INVALID_CREDENTIALS_MESSAGE }
 * Mientras tanto, simula la latencia y acepta solo la credencial de demostración
 * para poder probar tanto el acceso como el mensaje de error.
 */
export async function submitLogin(values: LoginValues): Promise<SubmitLoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))

  const isDemoUser =
    values.email.toLowerCase() === 'admin@velassanisaac.com' && values.password === 'SanIsaac2026'

  return isDemoUser ? { ok: true } : { ok: false, error: INVALID_CREDENTIALS_MESSAGE }
}
