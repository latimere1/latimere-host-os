// components/TopNav.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

const LOGO_SRC = '/images/latimere-logo.png'

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Platform', href: '/#platform' },
  { label: 'Pilot', href: '/#pilot' },
  { label: 'FAQ', href: '/#faq' },
]

export default function TopNav() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    console.info('[TopNav] mounted', {
      path: router.asPath,
      route: router.route,
      query: router.query,
      itemCount: NAV_ITEMS.length,
    })
  }, [router.asPath, router.route, router.query])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [router.asPath])

  const isActive = React.useCallback(
    (href: string) => {
      const path = router.asPath || '/'

      if (href === '/') {
        return path === '/' || path === ''
      }

      if (href.startsWith('/#')) {
        return path === href
      }

      return path === href || path.startsWith(`${href}/`)
    },
    [router.asPath]
  )

  const handleHashNav = React.useCallback(
    (href: string) => {
      if (!href.startsWith('/#')) return

      try {
        const [, hash] = href.split('#')
        if (!hash) return

        const current = router.asPath || '/'
        const onHome = current === '/' || current.startsWith('/#')

        if (onHome) {
          requestAnimationFrame(() => {
            const el = document.getElementById(hash)

            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              console.info('[TopNav] smooth scroll', { hash })
            } else {
              console.warn('[TopNav] section not found for hash', { hash })
            }
          })
        }
      } catch (err) {
        console.warn('[TopNav] handleHashNav failed', { href, err })
      }
    },
    [router.asPath]
  )

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#05070f]/90 text-white shadow-lg shadow-black/20 backdrop-blur-xl"
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Latimere Home"
          className="flex items-center"
          onClick={() => {
            console.info('[TopNav] logo click', { from: router.asPath })
            setMobileOpen(false)
          }}
        >
          <Image
            src={LOGO_SRC}
            alt="Latimere"
            width={180}
            height={40}
            priority
            unoptimized
            className="h-8 w-auto"
            onLoadingComplete={() =>
              console.info('[TopNavLogo] loaded', { src: LOGO_SRC })
            }
            onError={(err) =>
              console.warn('[TopNavLogo] failed to load', {
                src: LOGO_SRC,
                err,
              })
            }
          />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <nav className="flex items-center gap-6" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'text-sm font-medium transition',
                    active
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white',
                  ].join(' ')}
                  onClick={() => {
                    console.info('[TopNav] nav click', {
                      to: item.href,
                      from: router.asPath,
                    })
                    handleHashNav(item.href)
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <Link
            href="/#contact"
            className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
            onClick={() => {
              console.info('[TopNav] CTA → Request a Pilot', {
                from: router.asPath,
              })
              handleHashNav('/#contact')
            }}
          >
            Request a Pilot
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.055] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 md:hidden"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#05070f] px-4 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Mobile primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'rounded-xl px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-300 hover:bg-white/[0.06] hover:text-white',
                  ].join(' ')}
                  onClick={() => {
                    console.info('[TopNav] mobile nav click', {
                      to: item.href,
                      from: router.asPath,
                    })
                    handleHashNav(item.href)
                    setMobileOpen(false)
                  }}
                >
                  {item.label}
                </Link>
              )
            })}

            <Link
              href="/#contact"
              className="mt-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-center text-sm font-bold text-gray-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
              onClick={() => {
                console.info('[TopNav] mobile CTA → Request a Pilot', {
                  from: router.asPath,
                })
                handleHashNav('/#contact')
                setMobileOpen(false)
              }}
            >
              Request a Pilot
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}