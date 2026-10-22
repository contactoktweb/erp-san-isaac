import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico')
    .pipe(z.email('Ingresa un correo electrónico válido')),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña')
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type LoginValues = z.infer<typeof loginSchema>
