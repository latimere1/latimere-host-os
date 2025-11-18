// components/TopNav.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

/**
 * Prefer simple filenames in /public/images (no spaces) in the future,
 * but keep these exact paths for now to avoid breaking references.
 */
const LOGOS = [
  '/images/FFF%20latimere%20hosting%20WHITE.png',
  '/images/FFF%20latimere%20hosting%20BLACK.png',
]

type NavItem = { label: string; href: string }

export default function TopNav() {
  const router = useRouter()
  const [logoIdx, setLogoIdx] = React.useState(0)

  // Stable nav items
  const items = React.useMemo<NavItem[]>(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/#services' },
      { label: 'Operations', href: '/#operations' },
      { label: 'Gallery', href: '/#gallery' },
      { label: 'FAQ', href: '/#faq' },
      { label: 'Blog', href: '/blog' },
    ],
    []
  )

  React.useEffect(() => {
    console.info('[TopNav] mounted', {
      path: router.asPath,
      route: router.route,
      query: router.query,
    })
  }, [router.asPath, router.route, router.query])

  // Active matcher:
  // - exact match for "/" and hash sections
  // - prefix match for /blog and any sub-paths
  const isActive = React.useCallback(
    (href: string) => {
      const path = router.asPath || '/'
      if (href === '/') return path === '/' || path.startsWith('/#')
      if (href.startsWith('/#')) return path === href
      return path === href || path.startsWith(`${href}/`)
    },
    [router.asPath]
  )

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0B1220] text-white"
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo (unoptimized to avoid /_next/image route issues in prod) */}
        <Link href="/" aria-label="Latimere Home" className="flex items-center gap-3">
          <Image
            src={LOGOS[logoIdx]}
            alt="Latimere Hosting"
            width={170}
            height={28}
            priority
            unoptimized
            className="h-7 w-auto"
            onLoadingComplete={() =>
              console.info('[TopNavLogo] loaded', { src: LOGOS[logoIdx], idx: logoIdx })
            }
            onError={(e) => {
              const next = Math.min(logoIdx + 1, LOGOS.length - 1)
              console.warn('[TopNavLogo] error → trying fallback', {
                error: (e as any)?.message,
                failed: LOGOS[logoIdx],
                next: LOGOS[next],
              })
              setLogoIdx(next)
            }}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-6 md:flex" aria-label="Primary">
          {items.map((it) => {
            const active = isActive(it.href)
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={`text-sm ${active ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                onClick={() => console.info('[TopNav] nav click', { to: it.href })}
              >
                {it.label}
              </Link>
            )
          })}
        </nav>

        {/* CTA */}
        <Link
          href="/#contact"
          className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
          onClick={() => console.info('[TopNav] CTA → Get a Quote', { from: router.asPath })}
        >
          Get a Quote
        </Link>
      </div>
    </header>
  )
}
