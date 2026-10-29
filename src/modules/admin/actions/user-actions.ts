'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { recordAuditLog } from '@/lib/audit'
import type { MockUser } from '@/database/schemas'

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  role: z.enum(['ADMIN', 'VENTAS', 'JEFE_PLANTA', 'ALISTAMIENTO']),
  assignedBranch: z.string().min(2, 'La sede es obligatoria'),
  costCenter: z.string().min(2, 'El centro de costo es obligatorio'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export type ActionResult<T = unknown> = {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

/**
 * Server Action: Registrar un nuevo colaborador en la base de datos con rol RBAC
 */
export async function createUserAction(formData: FormData): Promise<ActionResult<MockUser>> {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: (formData.get('email') as string)?.trim().toLowerCase(),
      role: formData.get('role') as 'ADMIN' | 'VENTAS' | 'JEFE_PLANTA' | 'ALISTAMIENTO',
      assignedBranch: formData.get('assignedBranch') as string,
      costCenter: formData.get('costCenter') as string,
      password: formData.get('password') as string,
    }

    const parsed = createUserSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Datos de formulario inválidos',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const { name, email, role: roleName, assignedBranch, costCenter, password } = parsed.data

    // Verificar si el correo ya existe
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return {
        success: false,
        message: `El correo corporativo "${email}" ya se encuentra registrado`,
      }
    }

    // Buscar o asegurar el rol en la base de datos
    let role = await prisma.role.findUnique({ where: { name: roleName } })
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleName,
          description: `Rol corporativo ${roleName}`,
        },
      })
    }

    // Hash de la contraseña con bcrypt
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Crear el usuario en PostgreSQL / Supabase
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId: role.id,
        assignedBranch,
        costCenter,
        isActive: true,
      },
      include: { role: true },
    })

    // Registrar en auditoría
    await recordAuditLog({
      action: 'USER_CREATED',
      entity: 'User',
      entityId: newUser.id,
      details: `Nuevo colaborador creado: ${name} (${email}) con rol ${roleName} en ${assignedBranch}`,
      userName: 'Administrador San Isaac',
    })

    revalidatePath('/dashboard/administracion')

    return {
      success: true,
      message: `Colaborador "${name}" creado exitosamente con rol ${roleName}`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        assignedBranch: newUser.assignedBranch || 'Planta Principal Funza',
        costCenter: newUser.costCenter || 'CC-100 Producción',
        isActive: newUser.isActive,
        createdAt: newUser.createdAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('[createUserAction] Error:', error)
    return {
      success: false,
      message: 'Ocurrió un error al intentar crear el colaborador en la base de datos',
    }
  }
}

/**
 * Server Action: Alternar estado activo / inactivo de un colaborador
 */
export async function toggleUserStatusAction(userId: string, currentStatus: boolean): Promise<ActionResult> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus },
      include: { role: true },
    })

    await recordAuditLog({
      action: 'STATUS_TOGGLED',
      entity: 'User',
      entityId: updated.id,
      details: `Estado de ${updated.name} cambiado a: ${updated.isActive ? 'ACTIVO' : 'INACTIVO'}`,
      userName: 'Administrador San Isaac',
    })

    revalidatePath('/dashboard/administracion')

    return {
      success: true,
      message: `Estado de "${updated.name}" actualizado a ${updated.isActive ? 'Activo' : 'Inactivo'}`,
    }
  } catch (error) {
    console.error('[toggleUserStatusAction] Error:', error)
    return {
      success: false,
      message: 'No se pudo actualizar el estado del colaborador',
    }
  }
}

/**
 * Server Action: Restablecer contraseña de un colaborador
 */
export async function resetPasswordAction(userId: string, newPassword: string): Promise<ActionResult> {
  try {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      }
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    await recordAuditLog({
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: updated.id,
      details: `Restablecimiento administrativo de credenciales para ${updated.email}`,
      userName: 'Administrador San Isaac',
    })

    revalidatePath('/dashboard/administracion')

    return {
      success: true,
      message: `Contraseña restablecida exitosamente para ${updated.email}`,
    }
  } catch (error) {
    console.error('[resetPasswordAction] Error:', error)
    return {
      success: false,
      message: 'No se pudo restablecer la contraseña del colaborador',
    }
  }
}
