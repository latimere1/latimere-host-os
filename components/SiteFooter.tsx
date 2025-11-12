// components/SiteFooter.tsx
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

/**
 * Keep these exact URL-encoded filenames to match assets in /public/images.
 * White first (preferred on dark footer), black as fallback.
 */
const LOGOS = [
  '/images/FFF%20latimere%20hosting%20WHITE.png',
  '/images/FFF%20latimere%20hosting%20BLACK.png',
]

export default function SiteFooter() {
  const [logoIdx, setLogoIdx] = React.useState(0)

  React.useEffect(() => {
    console.info('[Footer] mounted', {
      initialLogo: LOGOS[0],
      secondaryLogo: LOGOS[1],
    })
  }, [])

  const handleLoad = React.useCallback(() => {
    console.info('[FooterLogo] loaded', { src: LOGOS[logoIdx], idx: logoIdx })
  }, [logoIdx])

  const handleError = React.useCallback((e: unknown) => {
    const next = Math.min(logoIdx + 1, LOGOS.length - 1)
    if (next === logoIdx) {
      console.error('[FooterLogo] failed and no further fallbacks available', {
        failed: LOGOS[logoIdx],
        error: (e as any)?.message,
      })
      return
    }
    console.warn('[FooterLogo] error → trying fallback', {
      error: (e as any)?.message,
      failed: LOGOS[logoIdx],
      next: LOGOS[next],
    })
    setLogoIdx(next)
  }, [logoIdx])

  const year = React.useMemo(() => new Date().getFullYear(), [])

  return (
    <footer
      className="border-t border-white/10 bg-gray-950 text-gray-300"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        {/* Brand + copyright */}
        <div className="flex items-center gap-3">
          {/* Match header behavior: skip optimizer to avoid /_next/image 404s on encoded filenames */}
          <Link href="/" aria-label="Latimere Home" className="flex items-center">
            <Image
              src={LOGOS[logoIdx]}
              alt="Latimere Hosting"
              width={170}
              height={28}
              unoptimized
              priority={false}
              className="h-7 w-auto"
              onLoadingComplete={handleLoad}
              onError={handleError}
            />
          </Link>
          <span className="text-sm">© {year} Latimere. All rights reserved.</span>
        </div>

        {/* Footer nav (duplicates key anchors for convenience) */}
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <a href="/#services" className="hover:text-white">Services</a>
          <a href="/#operations" className="hover:text-white">Operations</a>
          <a href="/#gallery" className="hover:text-white">Gallery</a>
          <a href="/#faq" className="hover:text-white">FAQ</a>
          <Link href="/blog" className="hover:text-white">Blog</Link>
        </nav>
      </div>
    </footer>
  )
}
