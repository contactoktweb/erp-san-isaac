import { Heart } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/50 px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p>
          © {currentYear} {siteConfig.companyName}. Todos los derechos reservados.
        </p>
        <a
          href="https://www.kytcode.lat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <span>Desarrollado por K&T</span>
          <Heart className="size-3.5 fill-black text-black" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}
