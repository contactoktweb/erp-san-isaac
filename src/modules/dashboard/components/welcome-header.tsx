import { CandleRule } from '@/components/brand/candle-rule'
import { demoUser, siteConfig } from '@/lib/site-config'

export function WelcomeHeader() {
  const today = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const firstName = demoUser.name.split(' ')[0]

  return (
    <header className="flex flex-col gap-4">
      <p className="eyebrow">{today}</p>
      <div className="flex items-end gap-4">
        <CandleRule className="mb-2.5 hidden sm:inline-flex" />
        <h1 className="text-3xl font-semibold sm:text-4xl">{`Bienvenida, ${firstName}`}</h1>
      </div>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {`Este es el panel principal del ERP de ${siteConfig.companyName}. Los módulos se irán habilitando a medida que se construyan.`}
      </p>
    </header>
  )
}
