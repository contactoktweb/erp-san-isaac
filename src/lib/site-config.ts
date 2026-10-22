export const siteConfig = {
  companyName: 'Velas, Velones y Cirios San Isaac SAS',
  shortName: 'San Isaac',
  tagline: 'La luz del Patriarca',
  productName: 'ERP San Isaac',
  logo: '/images/logo-san-isaac.webp',
} as const

export type DemoUser = {
  name: string
  role: string
  email: string
}

// TODO: reemplazar por el usuario de la sesión cuando exista autenticación real.
export const demoUser: DemoUser = {
  name: 'Laura Gómez',
  role: 'Administradora',
  email: 'laura.gomez@velassanisaac.com',
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
