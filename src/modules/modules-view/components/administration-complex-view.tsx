'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  HardDrive,
  Hash,
  History,
  KeyRound,
  Percent,
  Power,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { AuditLogEntry, MockUser, RoleEntry } from '@/database/schemas'
import { formatDate, formatNumber } from '@/lib/config'
import { FISCAL_PARAMETERS } from '@/lib/fiscal-parameters'
import {
  GRANULAR_PERMISSIONS,
  hasPermission,
  ROLE_DISPLAY_NAMES,
} from '@/lib/permissions'
import {
  createUserAction,
  resetPasswordAction,
  toggleUserStatusAction,
} from '@/modules/admin/actions/user-actions'
import { ConsecutivesTab } from './administration/consecutives-tab'
import {
  INITIAL_TAX_RULES,
  TaxMatrixTab,
  type TaxAuditPayload,
  type TaxRule,
} from './administration/tax-matrix-tab'

interface Props {
  users: MockUser[]
  auditLogs?: AuditLogEntry[]
  roles?: RoleEntry[]
}

export function AdministrationComplexView({ users, auditLogs = [], roles = [] }: Props) {
  const [activeTab, setActiveTab] = useState<
    'users' | 'rbac' | 'audit' | 'thirdParties' | 'taxes' | 'consecutives' | 'backups'
  >('users')

  // Estado local para actualización reactiva inmediata
  const [localUsers, setLocalUsers] = useState<MockUser[]>(users)
  const [localAuditLogs, setLocalAuditLogs] = useState<AuditLogEntry[]>(auditLogs)
  const [taxUvtValue, setTaxUvtValue] = useState<number>(FISCAL_PARAMETERS.uvtCOP)
  const [taxRules, setTaxRules] = useState<TaxRule[]>(INITIAL_TAX_RULES)

  function handleTaxAuditEvent(event: TaxAuditPayload) {
    setLocalAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: event.action,
        entity: 'TaxParameter',
        entityId: event.entityId,
        details: event.details,
        ipAddress: '127.0.0.1 (Local)',
        userId: 'usr-admin',
        userName: 'Administrador San Isaac',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  // Filtros de búsqueda
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [auditSearchQuery, setAuditSearchQuery] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('ALL')

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<MockUser | null>(null)
  const [resetNewPassword, setResetNewPassword] = useState('')

  // Estado de carga y mensajes
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Handlers para acciones de usuario
  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedbackMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await createUserAction(formData)

    setIsSubmitting(false)
    if (result.success && result.data) {
      setLocalUsers((prev) => [result.data!, ...prev])
      setLocalAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: 'USER_CREATED',
          entity: 'User',
          entityId: result.data!.id,
          details: `Nuevo colaborador creado: ${result.data!.name} (${result.data!.email}) con rol ${result.data!.role}`,
          ipAddress: '127.0.0.1 (Local)',
          userId: 'usr-admin',
          userName: 'Administrador San Isaac',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setFeedbackMessage({ type: 'success', text: result.message })
      setIsCreateModalOpen(false)
    } else {
      setFeedbackMessage({ type: 'error', text: result.message || 'Error al crear el colaborador' })
    }
  }

  async function handleToggleStatus(user: MockUser) {
    const newStatus = !user.isActive
    setFeedbackMessage(null)

    // Actualización optimista
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
    )

    const result = await toggleUserStatusAction(user.id, user.isActive)
    if (result.success) {
      setLocalAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: 'STATUS_TOGGLED',
          entity: 'User',
          entityId: user.id,
          details: `Estado de ${user.name} cambiado a: ${newStatus ? 'ACTIVO' : 'INACTIVO'}`,
          ipAddress: '127.0.0.1 (Local)',
          userId: 'usr-admin',
          userName: 'Administrador San Isaac',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setFeedbackMessage({ type: 'success', text: result.message })
    } else {
      // Revertir en caso de error
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
      )
      setFeedbackMessage({ type: 'error', text: result.message })
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserForReset || !resetNewPassword) return

    setIsSubmitting(true)
    const result = await resetPasswordAction(selectedUserForReset.id, resetNewPassword)
    setIsSubmitting(false)

    if (result.success) {
      setLocalAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: 'PASSWORD_RESET',
          entity: 'User',
          entityId: selectedUserForReset.id,
          details: `Restablecimiento de clave para ${selectedUserForReset.email}`,
          ipAddress: '127.0.0.1 (Local)',
          userId: 'usr-admin',
          userName: 'Administrador San Isaac',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])
      setFeedbackMessage({ type: 'success', text: result.message })
      setIsResetModalOpen(false)
      setSelectedUserForReset(null)
      setResetNewPassword('')
    } else {
      setFeedbackMessage({ type: 'error', text: result.message })
    }
  }

  // Filtrado de usuarios
  const filteredUsers = localUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.assignedBranch.toLowerCase().includes(q)
    )
  })

  // Filtrado de bitácora de auditoría
  const filteredAuditLogs = localAuditLogs.filter((log) => {
    const q = auditSearchQuery.toLowerCase()
    const matchesQuery =
      (log.details || '').toLowerCase().includes(q) ||
      (log.userName || '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q)

    const matchesAction = auditActionFilter === 'ALL' || log.action === auditActionFilter
    return matchesQuery && matchesAction
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 bg-background">
      {/* Alerta de notificación si existe feedback */}
      {feedbackMessage && (
        <div
          role="status"
          className={`flex items-center justify-between rounded-lg p-3 text-xs font-medium border ${
            feedbackMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-muted-foreground hover:text-foreground p-0.5"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Selector de sub-vistas del Módulo de Administración */}
      <nav aria-label="Secciones de administración" className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className="text-xs gap-1.5"
        >
          <Users className="size-3.5" />
          Colaboradores ({localUsers.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'rbac' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rbac')}
          className="text-xs gap-1.5"
        >
          <Shield className="size-3.5" />
          Roles y Permisos RBAC (4 Roles)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'audit' ? 'default' : 'outline'}
          onClick={() => setActiveTab('audit')}
          className="text-xs gap-1.5"
        >
          <History className="size-3.5" />
          Bitácora de Auditoría ({localAuditLogs.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'thirdParties' ? 'default' : 'outline'}
          onClick={() => setActiveTab('thirdParties')}
          className="text-xs gap-1.5"
        >
          <Building2 className="size-3.5" />
          Terceros y Validación Exógena (RUT)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'taxes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('taxes')}
          className="text-xs gap-1.5"
        >
          <Percent className="size-3.5" />
          Matriz de Impuestos y Retenciones
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'consecutives' ? 'default' : 'outline'}
          onClick={() => setActiveTab('consecutives')}
          className="text-xs gap-1.5"
        >
          <Hash className="size-3.5" />
          Consecutivos y Vigencia DIAN
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'backups' ? 'default' : 'outline'}
          onClick={() => setActiveTab('backups')}
          className="text-xs gap-1.5"
        >
          <HardDrive className="size-3.5" />
          Copias de Seguridad (Google Drive)
        </Button>
      </nav>

      {/* PESTAÑA 1: USUARIOS Y COLABORADORES CON CRUD OPERATIVO */}
      {activeTab === 'users' && (
        <section aria-label="Gestión de colaboradores" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, correo, rol o sede..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs gap-1.5 self-start sm:self-auto bg-primary text-primary-foreground font-semibold"
            >
              <UserPlus className="size-3.5" />
              Nuevo Colaborador
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Colaborador</th>
                  <th scope="col" className="px-4 py-3">Rol Oficial RBAC</th>
                  <th scope="col" className="px-4 py-3">Correo corporativo</th>
                  <th scope="col" className="px-4 py-3">Sede</th>
                  <th scope="col" className="px-4 py-3">Centro de costos</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">F. Creación</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No se encontraron colaboradores que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const normalizedRole = u.role.toUpperCase()
                    const roleBadge = ROLE_DISPLAY_NAMES[normalizedRole]

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {u.name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={roleBadge?.badgeVariant || 'outline'}
                            className="text-[0.6875rem] font-semibold"
                          >
                            {roleBadge?.label || u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.assignedBranch}</td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.costCenter}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.isActive ? 'success' : 'muted'} className="text-[0.6875rem]">
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(u)}
                              title={u.isActive ? 'Desactivar acceso al sistema' : 'Activar acceso'}
                              className={`h-7 px-2 text-xs gap-1 ${
                                u.isActive
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-500/10'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10'
                              }`}
                            >
                              <Power className="size-3.5" />
                              <span className="hidden sm:inline">{u.isActive ? 'Desactivar' : 'Activar'}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUserForReset(u)
                                setIsResetModalOpen(true)
                              }}
                              title="Restablecer clave temporal"
                              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            >
                              <KeyRound className="size-3.5" />
                              <span className="hidden sm:inline">Clave</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PESTAÑA 2: MATRIZ DE 4 ROLES Y PERMISOS GRANULARES (RBAC) */}
      {activeTab === 'rbac' && (
        <section aria-label="Matriz de roles y permisos RBAC" className="flex flex-col gap-6">
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-50/50 p-4 text-xs text-indigo-950 dark:bg-indigo-950/20 dark:text-indigo-200">
            <strong>Matriz Oficial de Roles Vinculantes (Documento Técnico - Numeral 4):</strong>
            <p className="mt-1 leading-relaxed">
              El sistema garantiza la segregación estricta de responsabilidades entre 4 perfiles canónicos. Las operaciones críticas (reprogramación con justificación obligatoria, anulación con devolución a stock y facturación electrónica) están gobernadas por validaciones de servidor con auditoría automática.
            </p>
          </div>

          {/* Tarjetas resumen de los 4 roles oficiales */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">1. Administrador</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Control total sobre pedidos (ERP y Tienda Web), reprogramación, cancelaciones, auditoría, despacho y facturación.
              </p>
              <div className="mt-3 text-[0.6875rem] font-semibold text-primary">
                100% de capacidades asignadas
              </div>
            </Card>

            <Card className="p-4 border-sky-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="size-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-foreground">2. Ventas / Comercial</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Creación de pedidos manuales, gestión web, reprogramación con motivo obligatorio y facturación electrónica.
              </p>
              <div className="mt-3 text-[0.6875rem] font-semibold text-sky-600 dark:text-sky-400">
                Gestión comercial & Factura DIAN
              </div>
            </Card>

            <Card className="p-4 border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="size-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-foreground">3. Jefe de Planta</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tablero multipedido con semáforos, alistamiento simultáneo, creación/edición de cajas e impresión de rótulos.
              </p>
              <div className="mt-3 text-[0.6875rem] font-semibold text-amber-600 dark:text-amber-400">
                Coordinación de planta & Packing
              </div>
            </Card>

            <Card className="p-4 border-slate-500/30">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="size-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-foreground">4. Alistamiento</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Visualizar pedidos en planta, armar cajas mixtas, registrar unidades por lote PEPS y corregir conteos.
              </p>
              <div className="mt-3 text-[0.6875rem] font-semibold text-slate-600 dark:text-slate-400">
                Empaque físico & Lotes PEPS
              </div>
            </Card>
          </div>

          {/* Tabla de Matriz de Permisos */}
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Módulo</th>
                  <th scope="col" className="px-4 py-3">Permiso Granular</th>
                  <th scope="col" className="px-4 py-3">Código Técnico</th>
                  <th scope="col" className="px-4 py-3 text-center">ADMIN</th>
                  <th scope="col" className="px-4 py-3 text-center">VENTAS</th>
                  <th scope="col" className="px-4 py-3 text-center">JEFE_PLANTA</th>
                  <th scope="col" className="px-4 py-3 text-center">ALISTAMIENTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {GRANULAR_PERMISSIONS.map((perm) => (
                  <tr key={perm.code} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      {perm.module}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-foreground">{perm.name}</div>
                      <div className="text-[0.6875rem] text-muted-foreground">{perm.description}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {perm.code}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hasPermission('VENTAS', perm.code) ? (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hasPermission('JEFE_PLANTA', perm.code) ? (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {hasPermission('ALISTAMIENTO', perm.code) ? (
                        <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          ✓
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PESTAÑA 3: BITÁCORA DE AUDITORÍA (AUDIT LOG INMUTABLE) */}
      {activeTab === 'audit' && (
        <section aria-label="Bitácora de auditoría" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar en auditoría por detalle, usuario o IP..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="USER_CREATED">Creación de usuarios</option>
                <option value="STATUS_TOGGLED">Cambio de estado</option>
                <option value="PASSWORD_RESET">Restablecimiento clave</option>
                <option value="ROLE_ASSIGNED">Asignación de roles</option>
                <option value="TAX_RULE_CREATED">Creación concepto tributario</option>
                <option value="TAX_RULE_UPDATED">Edición concepto tributario</option>
                <option value="TAX_RULE_TOGGLED">Estado concepto tributario</option>
                <option value="UVT_UPDATED">Actualización UVT</option>
                <option value="BACKUP_SYNC">Respaldos en la nube</option>
                <option value="SYSTEM_INITIALIZATION">Inicialización del sistema</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha y Hora</th>
                  <th scope="col" className="px-4 py-3">Responsable</th>
                  <th scope="col" className="px-4 py-3">Acción Registrada</th>
                  <th scope="col" className="px-4 py-3">Entidad</th>
                  <th scope="col" className="px-4 py-3">Detalle Operacional</th>
                  <th scope="col" className="px-4 py-3 text-right">Dirección IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No se registran eventos de auditoría que coincidan con el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                        {log.userName || 'Sistema'}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <AuditActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                        {log.entity}
                      </td>
                      <td className="px-4 py-2.5 text-foreground leading-relaxed">
                        {log.details || 'Sin observaciones adicionales'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[0.6875rem] text-muted-foreground whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* PESTAÑA 4: TERCEROS, CLIENTES, PROVEEDORES Y VALIDACIÓN EXÓGENA */}
      {activeTab === 'thirdParties' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-sky-500/20 bg-sky-50/50 p-3 text-xs text-sky-950 dark:bg-sky-950/20 dark:text-sky-200">
            <strong>Reglas SI / ENTONCES parametrizadas (Numerales 3, 16 y 20):</strong> Clasificación tributaria RUT determina retenciones a practicar o aplicar en ventas/compras. El interruptor <em>Obligado a Facturar = NO</em> genera automáticamente Documento Soporte a no obligados.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Identificación / Tipo</th>
                  <th scope="col" className="px-3 py-2.5">Razón Social / Nombre</th>
                  <th scope="col" className="px-3 py-2.5">Municipio (ICA)</th>
                  <th scope="col" className="px-3 py-2.5">Clasificación RUT</th>
                  <th scope="col" className="px-3 py-2.5">Switches Tributarios (Casillas RUT)</th>
                  <th scope="col" className="px-3 py-2.5">Plazo / Cupo Crédito</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Semáforo Exógena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {THIRD_PARTIES_DEMO.map((tp) => (
                  <tr key={tp.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <div className="font-mono font-semibold text-foreground">
                        {tp.documentNumber}
                        {tp.verificationDigit ? `-${tp.verificationDigit}` : ''}
                      </div>
                      <div className="text-[0.6875rem] text-muted-foreground">{tp.personType}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">{tp.nameOrBusinessName}</div>
                      {tp.tradeName && <div className="text-[0.6875rem] text-muted-foreground">{tp.tradeName}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[0.6875rem]">
                        {tp.municipality}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={tp.taxClassification.includes('Gran') ? 'warning' : 'outline'}
                        className="text-[0.6875rem]"
                      >
                        {tp.taxClassification}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[0.625rem] font-medium ${
                            tp.isIvaResponsible ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground line-through'
                          }`}
                        >
                          IVA (48)
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[0.625rem] font-medium ${
                            tp.isWithholdingAgent ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          Rete (07)
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[0.625rem] font-medium ${
                            tp.isSelfWithholding ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          Autorret.
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[0.625rem] font-medium ${
                            tp.isInvoiceObligated ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold'
                          }`}
                        >
                          {tp.isInvoiceObligated ? 'Facturador (52)' : 'No Obligado -> Doc. Soporte'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-foreground">{tp.creditDays} días</div>
                      <div className="text-[0.6875rem] text-muted-foreground font-mono">
                        Cupo: ${formatNumber(tp.creditLimitCOP)} COP
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {tp.isExogenaComplete ? (
                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> Ficha Exógena OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="size-3.5" /> Ficha Incompleta Exógena
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: MATRIZ DE IMPUESTOS Y RETENCIONES */}
      {activeTab === 'taxes' && (
        <TaxMatrixTab
          uvtValue={taxUvtValue}
          onUvtChange={setTaxUvtValue}
          taxRules={taxRules}
          onTaxRulesChange={setTaxRules}
          onAuditEvent={handleTaxAuditEvent}
        />
      )}

      {/* PESTAÑA 6: CONSECUTIVOS Y VIGENCIA DIAN */}
      {activeTab === 'consecutives' && <ConsecutivesTab />}

      {/* PESTAÑA 7: COPIAS DE SEGURIDAD Y GOOGLE DRIVE */}
      {activeTab === 'backups' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-900/70 dark:text-emerald-300/70">
                  Estado Copia Automática
                </div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  🟢 Respaldo Nocturno Exitoso
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Última Ejecución</div>
                <div className="text-sm font-bold text-foreground">Hoy 23:59:05 (UTC-5)</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HardDrive className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Destino Externo Configurado</div>
                <div className="text-sm font-bold text-foreground truncate">centro_operacional@vvcsanisaac.com</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Registro de Trazabilidad de Respaldos (Numeral 24)</h3>
                <p className="text-xs text-muted-foreground">Cron job diario 23:59:05 (UTC-5) · Nomenclatura: AÑO-MES-DIA_BACKUP-ERP_DETALLE.sql.gz · Destino: centro_operacional@vvcsanisaac.com</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="text-xs gap-1.5">
                <RefreshCw className="size-3.5" /> Forzar Backup Ahora
              </Button>
            </div>

            <div className="mt-3 divide-y divide-border/40 text-xs">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-mono font-semibold">2026-10-27_BACKUP-ERP_COMPLETO.sql.gz</span>
                  <Badge variant="muted" className="text-[0.625rem]">42.8 MB</Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Supabase &rarr; Google Drive</span>
                  <span className="font-mono">2026-10-27 23:59:05</span>
                  <Badge variant="success" className="text-[0.625rem]">Exitoso</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-mono font-semibold">2026-10-26_BACKUP-ERP_COMPLETO.sql.gz</span>
                  <Badge variant="muted" className="text-[0.625rem]">41.5 MB</Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Supabase &rarr; Google Drive</span>
                  <span className="font-mono">2026-10-26 23:59:05</span>
                  <Badge variant="success" className="text-[0.625rem]">Exitoso</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR NUEVO COLABORADOR */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-user"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <h3 id="modal-title-user" className="text-base font-bold text-foreground">
                  Registrar Nuevo Colaborador
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-name" className="font-semibold text-foreground">
                    Nombre Completo *
                  </label>
                  <Input
                    id="user-name"
                    name="name"
                    required
                    placeholder="Ej. Andrés Camilo Torres"
                    className="text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-email" className="font-semibold text-foreground">
                    Correo Corporativo *
                  </label>
                  <Input
                    id="user-email"
                    name="email"
                    type="email"
                    required
                    placeholder="andres.torres@vvcsanisaac.com"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-role" className="font-semibold text-foreground">
                    Rol Oficial RBAC *
                  </label>
                  <select
                    id="user-role"
                    name="role"
                    required
                    defaultValue="VENTAS"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ADMIN">ADMIN - Administrador / Gerencia</option>
                    <option value="VENTAS">VENTAS - Ventas / Comercial</option>
                    <option value="JEFE_PLANTA">JEFE_PLANTA - Jefe de Producción</option>
                    <option value="ALISTAMIENTO">ALISTAMIENTO - Encargado Planta</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-branch" className="font-semibold text-foreground">
                    Sede Asignada *
                  </label>
                  <select
                    id="user-branch"
                    name="assignedBranch"
                    required
                    defaultValue="Planta Principal Guaduas"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Planta Principal Guaduas">Planta Principal Guaduas</option>
                    <option value="Sede Administrativa Bogotá">Sede Administrativa Bogotá</option>
                    <option value="Bodega Central Guaduas">Bodega Central Guaduas</option>
                    <option value="Punto de Venta POS-01 Guaduas">Punto de Venta POS-01 Guaduas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-cost-center" className="font-semibold text-foreground">
                    Centro de Costos *
                  </label>
                  <select
                    id="user-cost-center"
                    name="costCenter"
                    required
                    defaultValue="CC-100 Producción"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs text-foreground focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="CC-100 Producción">CC-100 Producción</option>
                    <option value="CC-200 Administración">CC-200 Administración</option>
                    <option value="CC-300 Logística">CC-300 Logística y Despachos</option>
                    <option value="CC-400 Ventas">CC-400 Ventas y Comercial</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="user-password" className="font-semibold text-foreground">
                    Contraseña Inicial *
                  </label>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="font-semibold"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Colaborador'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESTABLECER CONTRASEÑA */}
      {isResetModalOpen && selectedUserForReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title-reset"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-primary" />
                <h3 id="modal-title-reset" className="text-base font-bold text-foreground">
                  Restablecer Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false)
                  setSelectedUserForReset(null)
                  setResetNewPassword('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-xs">
              <div className="rounded-md bg-muted/40 p-3">
                <div className="font-semibold text-foreground">{selectedUserForReset.name}</div>
                <div className="font-mono text-muted-foreground">{selectedUserForReset.email}</div>
                <div className="text-[0.6875rem] text-muted-foreground mt-1">
                  Rol: <strong>{selectedUserForReset.role}</strong> | Sede: {selectedUserForReset.assignedBranch}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-pass" className="font-semibold text-foreground">
                  Nueva Contraseña Temporal *
                </label>
                <Input
                  id="new-pass"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Ingrese nueva contraseña (mínimo 8 caracteres)"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsResetModalOpen(false)
                    setSelectedUserForReset(null)
                    setResetNewPassword('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || resetNewPassword.length < 8}
                  className="font-semibold"
                >
                  {isSubmitting ? 'Actualizando...' : 'Restablecer Clave'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditActionBadge({ action }: { action: string }) {
  switch (action) {
    case 'USER_CREATED':
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[0.625rem]">
          Creación Usuario
        </Badge>
      )
    case 'STATUS_TOGGLED':
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[0.625rem]">
          Cambio Estado
        </Badge>
      )
    case 'PASSWORD_RESET':
      return (
        <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[0.625rem]">
          Clave Restablecida
        </Badge>
      )
    case 'ROLE_ASSIGNED':
      return (
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-[0.625rem]">
          Permiso Asignado
        </Badge>
      )
    case 'TAX_RULE_CREATED':
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[0.625rem]">
          Concepto Tributario
        </Badge>
      )
    case 'TAX_RULE_UPDATED':
      return (
        <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[0.625rem]">
          Tributo Editado
        </Badge>
      )
    case 'TAX_RULE_TOGGLED':
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[0.625rem]">
          Estado Tributo
        </Badge>
      )
    case 'UVT_UPDATED':
      return (
        <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[0.625rem]">
          UVT Simulada
        </Badge>
      )
    case 'BACKUP_SYNC':
      return (
        <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-[0.625rem]">
          Respaldo Drive
        </Badge>
      )
    case 'SYSTEM_INITIALIZATION':
      return (
        <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300 text-[0.625rem]">
          Inicialización
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-[0.625rem]">
          {action}
        </Badge>
      )
  }
}

const THIRD_PARTIES_DEMO = [
  {
    id: 'tp-001',
    personType: 'Jurídica (NIT)',
    documentNumber: '860002145',
    verificationDigit: '2',
    nameOrBusinessName: 'Distribuidora Religiosa El Cirio Sagrado SAS',
    tradeName: 'El Cirio Sagrado',
    municipality: 'Bogotá D.C.',
    taxClassification: 'Ordinario (05)',
    isIvaResponsible: true,
    isWithholdingAgent: false,
    isSelfWithholding: false,
    isInvoiceObligated: true,
    creditDays: 30,
    creditLimitCOP: 15000000,
    isExogenaComplete: true,
  },
  {
    id: 'tp-002',
    personType: 'Jurídica (NIT)',
    documentNumber: '899999068',
    verificationDigit: '1',
    nameOrBusinessName: 'Ecopetrol Refinería Barrancabermeja',
    tradeName: 'Ecopetrol SAS',
    municipality: 'Guaduas',
    taxClassification: 'Gran Contribuyente (13)',
    isIvaResponsible: true,
    isWithholdingAgent: true,
    isSelfWithholding: true,
    isInvoiceObligated: true,
    creditDays: 45,
    creditLimitCOP: 80000000,
    isExogenaComplete: true,
  },
  {
    id: 'tp-003',
    personType: 'Natural (CC)',
    documentNumber: '79845210',
    verificationDigit: undefined,
    nameOrBusinessName: 'José Antonio Salamanca Gómez',
    tradeName: 'Artesanías y Cirios Salamanca',
    municipality: 'Chía',
    taxClassification: 'Simple RST (47)',
    isIvaResponsible: false,
    isWithholdingAgent: false,
    isSelfWithholding: false,
    isInvoiceObligated: false, // Dispara Documento Soporte a no obligados
    creditDays: 0,
    creditLimitCOP: 0,
    isExogenaComplete: false, // Ficha Incompleta para Exógena
  },
]
