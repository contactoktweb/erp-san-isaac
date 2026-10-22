import Image from 'next/image'
import { siteConfig } from '@/lib/site-config'
import { cn } from '@/lib/utils'

type LogoProps = {
  size?: number
  className?: string
  priority?: boolean
  decorative?: boolean
}

export function Logo({ size = 40, className, priority = false, decorative = false }: LogoProps) {
  return (
    <Image
      src={siteConfig.logo || '/placeholder.svg'}
      alt={decorative ? '' : `Logo de ${siteConfig.companyName}`}
      width={size}
      height={size}
      priority={priority}
      className={cn('shrink-0 object-contain', className)}
    />
  )
}
