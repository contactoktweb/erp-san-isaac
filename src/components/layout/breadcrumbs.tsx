'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { getBreadcrumbs } from '@/lib/navigation'

export function Breadcrumbs() {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[0.9375rem]">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <Fragment key={`${crumb.title}-${index}`}>
              {index > 0 ? (
                <li aria-hidden="true" className="text-muted-foreground">
                  <ChevronRight className="size-4" />
                </li>
              ) : null}
              <li className={isLast ? 'min-w-0 truncate' : 'hidden shrink-0 sm:block'}>
                {isLast ? (
                  <span aria-current="page" className="font-semibold text-foreground">
                    {crumb.title}
                  </span>
                ) : crumb.href ? (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                    {crumb.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{crumb.title}</span>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
