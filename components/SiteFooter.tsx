// components/SiteFooter.tsx
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

const LOGOS = [
  // URL-encoded paths (your files have spaces)
  '/images/FFF%20latimere%20hosting%20WHITE.png',
  '/images/FFF%20latimere%20hosting%20BLACK.png',
]

export default function SiteFooter() {
  const [idx, setIdx] = React.useState(0)

  return (
    <footer className="border-t border-white/10 bg-gray-950 text-gray-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src={LOGOS[idx]}
            alt="Latimere Hosting"
            width={160}
            height={36}
            sizes="160px"
            className="h-7 w-auto opacity-90"
            onLoadingComplete={() => console.info('[FooterLogo] loaded', LOGOS[idx])}
            onError={() => {
              const next = Math.min(idx + 1, LOGOS.length - 1)
              console.warn('[FooterLogo] failed, trying fallback', { failed: LOGOS[idx], next: LOGOS[next] })
              setIdx(next)
            }}
          />
          <span>© {new Date().getFullYear()} Latimere. All rights reserved.</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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
