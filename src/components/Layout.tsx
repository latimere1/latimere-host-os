// src/components/Layout.tsx
import { ReactNode } from 'react';
import Head          from 'next/head';
import Link          from 'next/link';
import { Settings }  from 'lucide-react';      // icon (or your alternative)
import { useAuthProfile } from '@/hooks/useAuthProfile';

interface LayoutProps {
  /** Page-specific <title>. If omitted defaults to “Latimere Host OS”. */
  title?: string;
  children: ReactNode;
}

export default function Layout({ title = 'Latimere Host OS', children }: LayoutProps) {
  const { role } = useAuthProfile();
  console.log('[Layout] render – role =', role);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Document <title> */}
      <Head>
        <title>{title}</title>
      </Head>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold">{title}</h1>

        {role === 'admin' && (
          <Link href="/admin/users" className="group relative">
            <Settings className="w-6 h-6 text-gray-500 group-hover:text-gray-800" />
            <span className="absolute -top-8 right-0 hidden group-hover:block
                             bg-gray-800 text-white text-xs px-2 py-1 rounded">
              Admin&nbsp;settings
            </span>
          </Link>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto p-6">{children}</main>
    </div>
  );
}
