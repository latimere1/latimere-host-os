// components/TopNav.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

const LOGOS = [
  '/images/FFF%20latimere%20hosting%20WHITE.png',
  '/images/FFF%20latimere%20hosting%20BLACK.png',
]

export default function TopNav() {
  const router = useRouter()
  const [logoIdx, setLogoIdx] = React.useState(0)

  React.useEffect(() => {
    console.info('[TopNav] mounted', { path: router.asPath })
  }, [router.asPath])

  const items = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/#services' },
    { label: 'Operations', href: '/#operations' },
    { label: 'Gallery', href: '/#gallery' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Blog', href: '/blog' },
  ]

  return (
    // Match blog nav styling
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0B1220] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Latimere Home" className="flex items-center gap-3">
          <Image
            src={LOGOS[logoIdx]}
            alt="Latimere Hosting"
            width={170}
            height={28}
            priority
            className="h-7 w-auto"
            onLoadingComplete={() => console.info('[TopNavLogo] loaded', LOGOS[logoIdx])}
            onError={() => {
              const next = Math.min(logoIdx + 1, LOGOS.length - 1)
              console.warn('[TopNavLogo] failed, trying fallback', { failed: LOGOS[logoIdx], next: LOGOS[next] })
              setLogoIdx(next)
            }}
          />
        </Link>

        <nav className="hidden gap-6 md:flex">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`text-sm ${router.asPath === it.href ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              onClick={() => console.info('[TopNav] click', { to: it.href })}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#contact"
          className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400"
          onClick={() => console.info('[TopNav] Get a Quote')}
        >
          Get a Quote
        </Link>
      </div>
    </header>
  )
}
