import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.productName,
    template: `%s · ${siteConfig.productName}`,
  },
  description: `Sistema de gestión empresarial de ${siteConfig.companyName}.`,
  applicationName: siteConfig.productName,
  robots: { index: false, follow: false },
  icons: { icon: siteConfig.logo, apple: siteConfig.logo },
}

export const viewport: Viewport = {
  themeColor: '#faf8f4',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO" className={inter.variable}>
      <body>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
