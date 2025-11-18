// src/components/Layout.tsx
import { ReactNode, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type LayoutProps = {
  title?: string
  children: ReactNode
}

/** Feature flags read once at module load (Next will inline public env vars) */
const FLAGS = {
  community: process.env.NEXT_PUBLIC_ENABLE_COMMUNITY === '1',
  blog: (process.env.NEXT_PUBLIC_BLOG_ENABLED ?? '1') !== '0',
  logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'debug') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
}

/** tiny logger utility (no external deps) */
const log = {
  debug: (...a: any[]) => FLAGS.logLevel === 'debug' && console.debug(...a),
  info: (...a: any[]) =>
    (FLAGS.logLevel === 'debug' || FLAGS.logLevel === 'info') &&
    console.info(...a),
  warn: (...a: any[]) => console.warn(...a),
  error: (...a: any[]) => console.error(...a),
}

/** Small helper for active link styling */
function NavLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string
  label: string
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-200 hover:text-white hover:bg-gray-700',
      ].join(' ')}
    >
      {label}
    </Link>
  )
}

export default function Layout({ title, children }: LayoutProps) {
  const router = useRouter()
  const path = router?.asPath ?? '/'

  // nav items that always show
  const baseLinks = useMemo(
    () => [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/properties', label: 'Properties' },
      { href: '/cleaners', label: 'Manage Cleaners' },
      { href: '/user-roles', label: 'User Roles' }, // future: role-gate
    ],
    []
  )

  // optional links, controlled by flags
  const extraLinks = useMemo(() => {
    const extra: { href: string; label: string; flagKey: keyof typeof FLAGS }[] =
      []
    if (FLAGS.community) extra.push({ href: '/community', label: 'Community', flagKey: 'community' })
    if (FLAGS.blog) extra.push({ href: '/blog', label: 'Blog', flagKey: 'blog' })
    return extra
  }, [])

  // trace route + flags on mount/route change
  useEffect(() => {
    if (title) log.info(`🧭 Layout → route: ${path} | title: ${title}`)
    else log.info(`🧭 Layout → route: ${path}`)

    log.debug('🔖 Flags', {
      community: FLAGS.community,
      blog: FLAGS.blog,
      logLevel: FLAGS.logLevel,
    })
  }, [path, title])

  // simple prefetchers (safe no-ops if route missing)
  function prefetch(href: string) {
    try {
      router?.prefetch?.(href)
      log.debug('[Prefetch]', href)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 bg-white text-gray-900 px-3 py-2 rounded-md shadow"
      >
        Skip to content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Brand / Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="text-white font-semibold tracking-tight truncate"
                onClick={() => log.info('[Nav] → /dashboard')}
              >
                Latimere Host OS
              </Link>
              {title && <span className="hidden sm:inline text-gray-400">/</span>}
              {title && (
                <span className="hidden sm:inline text-gray-200 truncate">{title}</span>
              )}
            </div>

            {/* Primary nav */}
            <nav className="flex items-center gap-1">
              {baseLinks.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  isActive={path === l.href || path.startsWith(`${l.href}/`)}
                  onClick={() => log.info('[Nav]', l.href)}
                />
              ))}

              {/* Divider between core + marketing links */}
              {(FLAGS.community || FLAGS.blog) && (
                <span className="mx-1 h-5 w-px bg-gray-700 hidden sm:inline-block" aria-hidden />
              )}

              {extraLinks.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  isActive={path === l.href || path.startsWith(`${l.href}/`)}
                  onClick={() => {
                    log.info('[Nav]', l.href, `(flag:${l.flagKey})`)
                    // helpful prefetch for snappier UX
                    prefetch(l.href)
                  }}
                />
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer (subtle) */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 text-xs text-gray-500">
        <div className="flex items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Latimere</span>
          <span className="hidden sm:inline">
            Path:{' '}
            <code className="font-mono">{path}</code>
          </span>
        </div>
      </footer>
    </div>
  )
}
