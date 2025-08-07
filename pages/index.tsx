// pages/index.tsx

import Head from 'next/head'
import DemoRequestForm from '@/src/components/DemoRequestForm'
import HeroSection from '@/src/components/HeroSection'
import WhySection from '@/src/components/WhySection'
import SubscribeButton from '@/src/components/SubscribeButton'

export default function HomePage() {
  const featureItems = [
    { icon: '🏠', label: 'Create and manage properties and units' },
    { icon: '🧹', label: 'Schedule and track cleanings' },
    { icon: '✅', label: 'Mark cleanings as complete' },
    { icon: '📅', label: 'View upcoming cleanings in calendar view' },
    { icon: '📊', label: 'Track projected monthly revenue per unit' },
    { icon: '📂', label: 'View property details and dashboards' },
  ]

  return (
    <>
      <Head>
        <title>Latimere Host OS – Property Ops Simplified</title>
        <meta
          name="description"
          content="Manage properties, schedule cleanings, track revenue, and simplify your short-term rental operations."
        />
      </Head>

      <main className="min-h-screen bg-[#1E1E1E] text-white font-sans antialiased">
        {/* Top nav */}
        <header className="bg-cyan-400">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-black">Latimere</h1>
            <nav className="space-x-8 text-black font-medium">
              <a href="#features" className="hover:underline">Features</a>
              <a href="#why" className="hover:underline">Why Latimere</a>
              <a href="#demo" className="hover:underline">Request Demo</a>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Short-term rental property ops made easy.
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Create & manage properties, schedule & track cleanings, mark them complete,
              view upcoming cleanings in a calendar, and track projected revenue—all in one place.
            </p>
            <a
              href="#demo"
              className="inline-block bg-black text-white uppercase font-semibold px-8 py-4 rounded hover:opacity-90 transition"
            >
              Schedule My Free Demo
            </a>
          </div>
        </section>

        {/* What You Can Do Today */}
        <section id="features" className="bg-[#232323] py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h3 className="text-3xl font-bold text-center mb-10">
              What You Can Do Today
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {featureItems.map((item) => (
                <li key={item.label} className="flex items-start space-x-4">
                  <span className="text-3xl flex-shrink-0">{item.icon}</span>
                  <span className="text-lg text-gray-200">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why Latimere */}
        <section id="why" className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold mb-4">Why We’re Building Latimere</h3>
            <p className="text-lg text-gray-300">
              Managing short-term rentals shouldn’t require juggling spreadsheets and six different tools.
              Latimere Host OS centralizes your operations into one simple, scalable system—
              so you can focus on growing your portfolio, not wrangling software.
            </p>
          </div>
        </section>

        {/* Request Demo */}
        <section id="demo" className="bg-[#232323] py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h3 className="text-3xl font-bold mb-4">Request a Free Demo</h3>
            <p className="text-lg text-gray-300 mb-8">
              See how Latimere Host OS can simplify your short-term rental operations.
            </p>
            <DemoRequestForm />
            <div className="mt-8">
              <SubscribeButton />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#1A1A1A] py-8">
          <div className="max-w-6xl mx-auto px-6 text-center text-gray-400 space-y-2">
            <p>&copy; 2025 Latimere. All rights reserved.</p>
            <p className="text-sm">
              <a href="/privacy-policy" className="underline hover:text-white">
                Privacy Policy
              </a>{' '}
              |{' '}
              <a href="/terms-of-service" className="underline hover:text-white">
                Terms of Service
              </a>
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
