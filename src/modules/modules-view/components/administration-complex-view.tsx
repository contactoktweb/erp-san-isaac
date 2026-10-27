import { useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  HardDrive,
  Hash,
  Percent,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { MockUser } from '@/database/schemas'
import { formatDate, formatNumber } from '@/lib/config'

interface Props {
  users: MockUser[]
}

export function AdministrationComplexView({ users }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'thirdParties' | 'taxes' | 'consecutives' | 'backups'>('users')

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de sub-vistas del Módulo de Administración */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className="text-xs gap-1.5"
        >
          <Users className="size-3.5" />
          Colaboradores ({users.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === 'thirdParties' ? 'default' : 'outline'}
          onClick={() => setActiveTab('thirdParties')}
          className="text-xs gap-1.5"
        >
          <Building2 className="size-3.5" />
          Terceros y Validación Exógena (Ficha RUT)
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
      </div>

      {/* PESTAÑA 1: USUARIOS Y COLABORADORES */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Colaborador</th>
                <th scope="col" className="px-4 py-3">Cargo</th>
                <th scope="col" className="px-4 py-3">Correo corporativo</th>
                <th scope="col" className="px-4 py-3">Sede</th>
                <th scope="col" className="px-4 py-3">Centro de costos</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">F. Creación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold text-foreground">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.assignedBranch}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{u.costCenter}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'muted'} className="text-[0.6875rem]">
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 2: TERCEROS, CLIENTES, PROVEEDORES Y VALIDACIÓN EXÓGENA */}
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

      {/* PESTAÑA 3: MATRIZ DE IMPUESTOS Y RETENCIONES */}
      {activeTab === 'taxes' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/50 p-3 text-xs text-amber-950 dark:bg-amber-950/20 dark:text-amber-200">
            <strong>Regla Condicional de Base Mínima (Numerales 3 y 9):</strong> SI Subtotal &ge; Base Mínima &rarr; Aplicar % parametrizado; SI NO &rarr; Liquidación $0. Imputa automáticamente a la cuenta contable Débito o Crédito correspondiente.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Código / Concepto</th>
                  <th scope="col" className="px-3 py-2.5">Tipo de Tributo</th>
                  <th scope="col" className="px-3 py-2.5">Municipio</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Base Mínima ($)</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Tarifa (%)</th>
                  <th scope="col" className="px-3 py-2.5">Cuenta PUC Débito</th>
                  <th scope="col" className="px-3 py-2.5">Cuenta PUC Crédito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {TAX_PARAMS_DEMO.map((tax) => (
                  <tr key={tax.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      <div>{tax.concept}</div>
                      <div className="font-mono text-[0.6875rem] text-muted-foreground">{tax.code}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className="text-[0.6875rem]">
                        {tax.taxType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{tax.municipality}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">
                      ${formatNumber(tax.baseMinCOP)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-foreground">
                      {tax.ratePercent}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {tax.debitPucAccount}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                      {tax.creditPucAccount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: CONSECUTIVOS Y VIGENCIA DIAN */}
      {activeTab === 'consecutives' && (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-rose-500/20 bg-rose-50/50 p-3 text-xs text-rose-950 dark:bg-rose-950/20 dark:text-rose-200">
            <strong>Semáforo de Vigencia y Folios (Numerales 3, 12, 17 y 20):</strong> Alerta visual 🔴 si restan 15 días o menos para el vencimiento de la resolución DIAN, o resta menos del 10% de los folios autorizados.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/60 uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Tipo de Documento</th>
                  <th scope="col" className="px-3 py-2.5">Prefijo</th>
                  <th scope="col" className="px-3 py-2.5">Rango Autorizado</th>
                  <th scope="col" className="px-3 py-2.5">Actual / Último</th>
                  <th scope="col" className="px-3 py-2.5">% Uso Folios</th>
                  <th scope="col" className="px-3 py-2.5">Resolución DIAN</th>
                  <th scope="col" className="px-3 py-2.5">Vencimiento</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Alerta Vigencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {CONSECUTIVES_DEMO.map((c) => {
                  const isExpiring = c.remainingDays <= 15 || c.usedPercentage >= 90
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-semibold text-foreground">{c.documentType}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">{c.prefix}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">
                        {c.rangeFrom} al {c.rangeTo}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                        {c.prefix}-{c.currentNumber}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold tabular-nums text-foreground">{c.usedPercentage}%</span>
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${c.usedPercentage >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${c.usedPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[0.6875rem] text-muted-foreground">
                        {c.dianResolution}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDate(c.expirationDate)} ({c.remainingDays} días)
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isExpiring ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="size-3.5" /> Resolución próxima a vencer / agotar folios
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" /> Vigente y suficiente
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: COPIAS DE SEGURIDAD Y GOOGLE DRIVE */}
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
                <div className="text-sm font-bold text-foreground">Hoy 02:00:15 AM (UTC-5)</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HardDrive className="size-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Destino Externo Configurado</div>
                <div className="text-sm font-bold text-foreground truncate">Google Drive: gerencia@velassanisaac.com</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Registro de Trazabilidad de Respaldos (Numeral 24)</h4>
                <p className="text-xs text-muted-foreground">Ejecución nocturna diaria: Supabase Postgres dump comprimido + upload a Google Drive</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <RefreshCw className="size-3.5" /> Forzar Backup Ahora
              </Button>
            </div>

            <div className="mt-3 divide-y divide-border/40 text-xs">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-mono font-semibold">backup_san_isaac_20261027_0200.sql.gz</span>
                  <Badge variant="muted" className="text-[0.625rem]">42.8 MB</Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Supabase &rarr; Google Drive</span>
                  <span className="font-mono">2026-10-27 02:00:15</span>
                  <Badge variant="success" className="text-[0.625rem]">Exitoso</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-mono font-semibold">backup_san_isaac_20261026_0200.sql.gz</span>
                  <Badge variant="muted" className="text-[0.625rem]">41.5 MB</Badge>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>Supabase &rarr; Google Drive</span>
                  <span className="font-mono">2026-10-26 02:00:12</span>
                  <Badge variant="success" className="text-[0.625rem]">Exitoso</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
    municipality: 'Funza',
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

const TAX_PARAMS_DEMO = [
  {
    id: 'tax-001',
    code: 'IVA-19-VNT',
    concept: 'IVA General en Ventas de Velas y Velones',
    taxType: 'IVA',
    municipality: 'Nacional',
    baseMinCOP: 0,
    ratePercent: 19,
    debitPucAccount: '135515 (Anticipo)',
    creditPucAccount: '240801 (IVA Generado)',
  },
  {
    id: 'tax-002',
    code: 'RET-COM-2.5',
    concept: 'Retención en la Fuente por Compras Generales (Declarante)',
    taxType: 'Retefuente',
    municipality: 'Nacional',
    baseMinCOP: 1245000,
    ratePercent: 2.5,
    debitPucAccount: '236540 (Retención Compras)',
    creditPucAccount: '135515 (Retención a favor)',
  },
  {
    id: 'tax-003',
    code: 'ICA-FUNZA-7',
    concept: 'Impuesto de Industria y Comercio Actividad Fabril Velas',
    taxType: 'ReteICA',
    municipality: 'Funza',
    baseMinCOP: 1050000,
    ratePercent: 0.7,
    debitPucAccount: '236801 (ReteICA por pagar)',
    creditPucAccount: '135518 (ReteICA a favor)',
  },
  {
    id: 'tax-004',
    code: 'AUT-RENTA-0.8',
    concept: 'Autorretención Especial en Renta (Decreto 1625)',
    taxType: 'Autorretención Renta',
    municipality: 'Nacional',
    baseMinCOP: 0,
    ratePercent: 0.8,
    debitPucAccount: '135595 (Autorretención a favor)',
    creditPucAccount: '236575 (Autorretención por pagar)',
  },
]

const CONSECUTIVES_DEMO = [
  {
    id: 'con-001',
    documentType: 'Factura Electrónica de Venta',
    prefix: 'FEV',
    rangeFrom: 1,
    rangeTo: 5000,
    currentNumber: 4820,
    dianResolution: 'Res. 187640002158 del 2025-11-15',
    expirationDate: '2026-11-15T00:00:00.000Z',
    remainingDays: 19,
    usedPercentage: 96, // > 90% folios -> Alerta
  },
  {
    id: 'con-002',
    documentType: 'Documento Soporte a No Obligados',
    prefix: 'DS',
    rangeFrom: 1,
    rangeTo: 2000,
    currentNumber: 310,
    dianResolution: 'Res. 187640009941 del 2026-01-20',
    expirationDate: '2027-01-20T00:00:00.000Z',
    remainingDays: 85,
    usedPercentage: 15,
  },
  {
    id: 'con-003',
    documentType: 'Documento Equivalente POS (Tiendas)',
    prefix: 'POS',
    rangeFrom: 1,
    rangeTo: 10000,
    currentNumber: 1450,
    dianResolution: 'Res. 187640003310 del 2026-02-10',
    expirationDate: '2026-11-05T00:00:00.000Z',
    remainingDays: 9, // <= 15 días -> Alerta
    usedPercentage: 14,
  },
]
