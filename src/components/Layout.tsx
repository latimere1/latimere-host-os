// src/components/Layout.tsx
import { ReactNode, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

type LayoutProps = {
  title?: string
  children: ReactNode
}

/** Small helper for active link styling */
function NavLink({
  href,
  label,
  isActive,
}: {
  href: string
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={[
        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
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

  // Very lightweight logging to help us trace navigation + titles
  useEffect(() => {
    if (title) console.log(`🧭 Layout mount → route: ${path}  |  title: ${title}`)
    else console.log(`🧭 Layout mount → route: ${path}`)
  }, [path, title])

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/properties', label: 'Properties' },
    { href: '/cleaners', label: 'Manage Cleaners' },
    { href: '/user-roles', label: 'User Roles' }, // gate by role in future if needed
  ]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Brand / Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-white font-semibold tracking-tight"
              >
                Latimere Host OS
              </Link>
              {title && (
                <span className="hidden sm:inline text-gray-400">/</span>
              )}
              {title && (
                <span className="hidden sm:inline text-gray-200">{title}</span>
              )}
            </div>

            {/* Primary nav */}
            <nav className="flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.href}
                  href={l.href}
                  label={l.label}
                  isActive={path === l.href || path.startsWith(`${l.href}/`)}
                />
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer (subtle) */}
      <footer className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>© {new Date().getFullYear()} Latimere</span>
          <span className="hidden sm:inline">
            Path: <code className="font-mono">{path}</code>
          </span>
        </div>
      </footer>
    </div>
  )
}
