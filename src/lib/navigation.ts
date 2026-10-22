import {
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  LayoutDashboard,
  type LucideIcon,
  PackageSearch,
  ArrowLeftRight,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  enabled: boolean
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navigation: NavGroup[] = [
  {
    title: 'Inicio',
    items: [
      { title: 'Panel principal', href: '/dashboard', icon: LayoutDashboard, enabled: true },
    ],
  },
  {
    title: 'Inventarios',
    items: [
      { title: 'Productos', href: '/inventarios/productos', icon: Boxes, enabled: false },
      { title: 'Materias primas', href: '/inventarios/materias-primas', icon: PackageSearch, enabled: false },
      { title: 'Movimientos', href: '/inventarios/movimientos', icon: ArrowLeftRight, enabled: false },
    ],
  },
  {
    title: 'Producción',
    items: [
      { title: 'Órdenes de producción', href: '/produccion/ordenes', icon: Factory, enabled: false },
      { title: 'Fórmulas', href: '/produccion/formulas', icon: FlaskConical, enabled: false },
    ],
  },
  {
    title: 'Compras',
    items: [
      { title: 'Proveedores', href: '/compras/proveedores', icon: Truck, enabled: false },
      { title: 'Órdenes de compra', href: '/compras/ordenes', icon: ClipboardList, enabled: false },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { title: 'Clientes', href: '/ventas/clientes', icon: Users, enabled: false },
      { title: 'Pedidos', href: '/ventas/pedidos', icon: ShoppingCart, enabled: false },
      { title: 'Facturación', href: '/ventas/facturacion', icon: Receipt, enabled: false },
    ],
  },
  {
    title: 'Contabilidad',
    items: [
      { title: 'Plan de cuentas', href: '/contabilidad/plan-de-cuentas', icon: BookOpen, enabled: false },
      { title: 'Comprobantes', href: '/contabilidad/comprobantes', icon: FileText, enabled: false },
    ],
  },
  {
    title: 'Nómina',
    items: [
      { title: 'Empleados', href: '/nomina/empleados', icon: UserRound, enabled: false },
      { title: 'Liquidaciones', href: '/nomina/liquidaciones', icon: Wallet, enabled: false },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { title: 'Informes', href: '/reportes', icon: BarChart3, enabled: false },
      { title: 'Exportaciones', href: '/reportes/exportaciones', icon: FileSpreadsheet, enabled: false },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { title: 'Empresa', href: '/configuracion/empresa', icon: Building2, enabled: false },
      { title: 'Usuarios y permisos', href: '/configuracion/usuarios', icon: ShieldCheck, enabled: false },
    ],
  },
]

export type Breadcrumb = { title: string; href?: string }

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  for (const group of navigation) {
    const item = group.items.find(
      (entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`),
    )
    if (item) {
      return [{ title: group.title }, { title: item.title, href: item.href }]
    }
  }
  return [{ title: 'Inicio' }]
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
