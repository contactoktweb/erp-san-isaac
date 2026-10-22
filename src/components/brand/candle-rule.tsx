import { cn } from '@/lib/utils'

const CANDLE_HEIGHTS = [10, 13, 16, 13, 10] as const

/** Five small bars that echo the five-candle candelabrum of the logo. */
export function CandleRule({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('inline-flex items-end gap-[3px]', className)}>
      {CANDLE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="w-[3px] rounded-full bg-brand-gold"
          style={{ height }}
        />
      ))}
    </span>
  )
}
