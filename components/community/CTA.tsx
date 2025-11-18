// components/community/CTA.tsx
import Link from 'next/link'
import { useMemo } from 'react'

type CTAProps = {
  /** Main heading */
  title: string
  /** Supporting copy (can be short sentence) */
  body?: string
  /** Button label */
  buttonLabel: string
  /** Destination href (absolute or relative) */
  href: string
  /** Optional UTM params merged onto href (preserved if already present) */
  utm?: Partial<{
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_content: string
  }>
  /** Analytics label for window.latimere.trackCTA */
  eventLabel?: string
  /** Visual style */
  variant?: 'primary' | 'accent' | 'outline'
  /** Add subtle border + shadow */
  elevated?: boolean
  /** Extra className passthrough */
  className?: string
}

/**
 * CTA
 * - Reusable promotional block with a single action.
 * - Appends UTM params safely; fires telemetry on click.
 * - Minimal props, Tailwind-only, no external deps.
 */
export default function CTA({
  title,
  body,
  buttonLabel,
  href,
  utm,
  eventLabel = 'cta_click_generic',
  variant = 'accent',
  elevated = true,
  className = '',
}: CTAProps) {
  const finalHref = useMemo(() => {
    try {
      // Handle relative and absolute URLs
      const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
      // Merge provided UTM params (do not clobber existing)
      if (utm) {
        Object.entries(utm).forEach(([k, v]) => {
          if (v && !url.searchParams.has(k)) url.searchParams.set(k, v)
        })
      }
      return url.pathname + url.search + url.hash
    } catch {
      // If URL parsing fails (e.g., during SSR with unusual base), fallback to original
      return href
    }
  }, [href, utm])

  const styles = variantStyles(variant, elevated)

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className="flex-1">
        <h3 className="font-semibold">{title}</h3>
        {body && <p className="text-sm mt-1">{body}</p>}
      </div>

      <Link
        href={finalHref}
        className={styles.button}
        onClick={() => {
          const payload = { href: finalHref, variant }
          ;(window as any)?.latimere?.trackCTA?.(eventLabel, payload)
          console.log('🟢 CTA clicked:', { eventLabel, ...payload })
        }}
      >
        {buttonLabel}
      </Link>
    </div>
  )
}

function variantStyles(variant: CTAProps['variant'], elevated: boolean) {
  const baseWrap =
    'w-full flex items-start justify-between gap-4 rounded-2xl bg-white text-slate-900 p-4'
  const raised = elevated ? ' shadow' : ''
  const baseBtn =
    'inline-block whitespace-nowrap rounded-xl px-3 py-2 text-sm transition'

  switch (variant) {
    case 'primary':
      return {
        wrapper: baseWrap + raised,
        button: `${baseBtn} bg-slate-900 text-white hover:opacity-90`,
      }
    case 'outline':
      return {
        wrapper: baseWrap + ' border border-slate-200' + (elevated ? ' shadow-sm' : ''),
        button: `${baseBtn} border border-slate-300 text-slate-900 hover:bg-slate-50`,
      }
    case 'accent':
    default:
      return {
        wrapper: baseWrap + raised,
        button: `${baseBtn} bg-cyan-400 text-slate-900 hover:shadow`,
      }
  }
}
