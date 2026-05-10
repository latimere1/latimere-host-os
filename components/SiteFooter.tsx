// components/SiteFooter.tsx
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

const LOGO_SRC = '/images/latimere-logo.png'

export default function SiteFooter() {
  const year = React.useMemo(() => new Date().getFullYear(), [])

  React.useEffect(() => {
    console.info('[Footer] mounted', {
      logo: LOGO_SRC,
    })
  }, [])

  const handleLoad = React.useCallback(() => {
    console.info('[FooterLogo] loaded', { src: LOGO_SRC })
  }, [])

  const handleError = React.useCallback((e: unknown) => {
    console.error('[FooterLogo] failed to load', {
      failed: LOGO_SRC,
      error: (e as any)?.message,
    })
  }, [])

  return (
    <footer
      className="border-t border-white/10 bg-gray-950 text-gray-300"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Latimere Home" className="flex items-center">
            <Image
              src={LOGO_SRC}
              alt="Latimere"
              width={170}
              height={28}
              unoptimized
              priority={false}
              className="h-7 w-auto"
              onLoadingComplete={handleLoad}
              onError={handleError}
            />
          </Link>

          <span className="text-sm">
            © {year} Latimere. All rights reserved.
          </span>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          aria-label="Footer"
        >
          <Link href="/#platform" className="text-gray-400 transition hover:text-white">
            Platform
          </Link>
          <Link href="/#pilot" className="text-gray-400 transition hover:text-white">
            Pilot
          </Link>
          <Link href="/#pricing" className="text-gray-400 transition hover:text-white">
            Pricing
          </Link>
          <Link href="/#faq" className="text-gray-400 transition hover:text-white">
            FAQ
          </Link>
          <Link href="/#contact" className="text-gray-400 transition hover:text-white">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  )
}