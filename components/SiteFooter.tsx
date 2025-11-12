// components/SiteFooter.tsx
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const LOGOS = [
  '/images/FFF%20latimere%20hosting%20WHITE.png',
  '/images/FFF%20latimere%20hosting%20BLACK.png',
]

export default function SiteFooter() {
  const [logoIdx, setLogoIdx] = React.useState(0)

  return (
    <footer className="border-t border-white/10 bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-300 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src={LOGOS[logoIdx]}
              alt="Latimere Hosting"
              width={126}
              height={30}
              sizes="126px"
              className="h-6 w-auto opacity-90"
              onLoadingComplete={() => console.info('[FooterLogo] loaded', LOGOS[logoIdx])}
              onError={(e) => {
                const next = Math.min(logoIdx + 1, LOGOS.length - 1)
                console.warn('[FooterLogo] failed; trying fallback', { failed: LOGOS[logoIdx], next: LOGOS[next] })
                setLogoIdx(next)
              }}
            />
            <span>© {new Date().getFullYear()} Latimere. All rights reserved.</span>
          </div>

          <nav className="flex gap-4">
            <a href="/#services" className="hover:text-white">Services</a>
            <a href="/#operations" className="hover:text-white">Operations</a>
            <a href="/#gallery" className="hover:text-white">Gallery</a>
            <a href="/#faq" className="hover:text-white">FAQ</a>
            <Link href="/blog" className="hover:text-white">Blog</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
