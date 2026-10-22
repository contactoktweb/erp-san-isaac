import { getServerSession } from 'next-auth'
import { CandleRule } from '@/components/brand/candle-rule'
import { authOptions } from '@/lib/auth'
import { demoUser, siteConfig } from '@/lib/site-config'

export async function WelcomeHeader() {
  const session = await getServerSession(authOptions)

  const today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const fullName = session?.user?.name || demoUser.name
  const firstName = fullName.split(' ')[0]
  const greeting = firstName.toLowerCase().endsWith('a') ? 'Bienvenida' : 'Bienvenido'

  return (
    <header className="flex flex-col gap-4">
      <p className="eyebrow">{today}</p>
      <div className="flex items-end gap-4">
        <CandleRule className="mb-2.5 hidden sm:inline-flex" />
        <h1 className="text-3xl font-semibold sm:text-4xl">{`${greeting}, ${firstName}`}</h1>
      </div>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {`Este es el panel principal del ERP de ${siteConfig.companyName}. Los módulos se irán habilitando a medida que se construyan.`}
      </p>
    </header>
  )
}
