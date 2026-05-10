import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import type { GetStaticProps } from 'next'
import dynamic from 'next/dynamic'

import TopNav from '../components/TopNav'
import SiteFooter from '../components/SiteFooter'
import { getAllPosts, type BlogPost } from '../lib/blog'

const ENABLE_COMMUNITY = process.env.NEXT_PUBLIC_ENABLE_COMMUNITY === '1'
const CommunityCTA = ENABLE_COMMUNITY
  ? dynamic(() => import('../components/community/CTA'), {
      ssr: false,
      loading: () => (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-gray-300">
          Loading…
        </div>
      ),
    })
  : null

type LandingProps = {
  latestPosts: BlogPost[]
}

type LeadMode = 'pilot' | 'partner' | 'enterprise'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export const getStaticProps: GetStaticProps<LandingProps> = async () => {
  try {
    const posts = getAllPosts().slice(0, 3)
    return { props: { latestPosts: posts } }
  } catch (err) {
    console.error('getStaticProps failed to load blog posts:', err)
    return { props: { latestPosts: [] } }
  }
}

export default function LatimereSignalLanding({ latestPosts }: LandingProps) {
  const router = useRouter()
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const canonicalHref = appUrlEnv ? `${appUrlEnv}/` : '/'

  React.useEffect(() => {
    console.info('[LatimereSignalLanding] mounted', {
      path: router.asPath,
      env: process.env.NODE_ENV,
      communityEnabled: ENABLE_COMMUNITY,
      blogCount: latestPosts?.length ?? 0,
    })
  }, [router.asPath, latestPosts?.length])

  React.useEffect(() => {
    try {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section-id]'))
      const seen = new Set<string>()
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const id = (entry.target as HTMLElement).dataset.sectionId
            if (entry.isIntersecting && id && !seen.has(id)) {
              seen.add(id)
              console.info(`[Section] visible: #${id}`)
            }
          })
        },
        { rootMargin: '0px 0px -30% 0px', threshold: 0.25 }
      )
      els.forEach((el) => io.observe(el))
      return () => io.disconnect()
    } catch (err) {
      console.warn('[Observer] init failed', err)
    }
  }, [])

  const prefetchOnce = React.useRef({ community: false })

  const prefetchCommunity = React.useCallback(() => {
    if (!ENABLE_COMMUNITY || prefetchOnce.current.community) return
    router.prefetch('/community').catch(() => {})
    prefetchOnce.current.community = true
    console.info('[Prefetch] /community')
  }, [router])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Latimere Signal',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: appUrlEnv || 'https://latimere.com',
        image: '/og.png',
        description:
          'Latimere Signal turns transformation program evidence into executive-ready weekly reports with program health, source traceability, and human approval.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description:
            'Pilot and enterprise pricing available based on program scope, reporting areas, integrations, and governance requirements.',
        },
      },
      {
        '@type': 'Organization',
        name: 'Latimere',
        url: appUrlEnv || 'https://latimere.com',
        logo: '/og.png',
      },
    ],
  }

  return (
    <>
      <Head>
        <title>Latimere Signal | Weekly Transformation Reports Executives Can Trust</title>
        <meta
          name="description"
          content="Latimere Signal creates evidence-backed weekly transformation reports from transcripts, RAID inputs, decisions, and project-system data — with program health, what changed this week, source traceability, and human approval."
        />
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content="index,follow" />
        <meta
          property="og:title"
          content="Latimere Signal | Weekly Transformation Reports Executives Can Trust"
        />
        <meta
          property="og:description"
          content="Evidence-backed transformation reporting with program health, what changed this week, source traceability, approval workflows, and executive-ready outputs."
        />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={canonicalHref} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico?v=3" />
        <link
          rel="icon"
          type="image/x-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV-32PX.ico?v=3"
        />
        <link
          rel="icon"
          type="image/x-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV-16PX.ico?v=3"
          sizes="16x16"
        />
        <link
          rel="apple-touch-icon"
          href="/images/FFF-latimere-hosting-ICON-FAV%2032PX.png?v=3"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-950"
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-[#05070f] text-white selection:bg-cyan-400/30">
        <TopNav />

        <main id="main">
          <HeroSection />
          <CredibilityStrip />
          <ProblemSection />
          <MidPageCtaSection />
          <PlatformPreviewSection />
          <ExecutiveArtifactSection />
          <WorkflowSection />
          <EvidenceSection />
          <UseCasesSection />
          <PilotSection />
          <SecuritySection />
          <PricingSection />
          {ENABLE_COMMUNITY && CommunityCTA && (
            <CommunitySection
              CommunityCTA={CommunityCTA}
              prefetchCommunity={prefetchCommunity}
            />
          )}
          <FaqSection />
          <ContactSection />
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

function HeroSection() {
  return (
    <section data-section-id="hero" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(20,184,166,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0)_38%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#05070f] to-transparent"
      />

<div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-16">        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100 shadow-sm shadow-cyan-950/20">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Latimere Signal · Evidence-backed transformation reporting
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Weekly transformation reports executives can trust.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              Latimere Signal turns transcripts, RAID inputs, decisions, and
              project-system data into evidence-backed executive reports — with
              clear program health, what changed this week, and human approval
              before publishing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryLink href="#contact" label="Request a pilot" event="hero_request_pilot" />
              <SecondaryLink href="#platform" label="See the platform" event="hero_see_platform" />
              <SecondaryLink href="#artifact" label="View report output" event="hero_view_artifact" />
            </div>

            <div className="mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {heroProofPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <SignalConsoleMockup />
        </div>
      </div>
    </section>
  )
}

function SignalConsoleMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 -z-10 rounded-[2.2rem] bg-cyan-400/10 blur-2xl" />
      <div className="overflow-hidden rounded-[1.8rem] border border-white/12 bg-[#080c16]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
              Program Health
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Northstar Plant Modernization
            </div>
          </div>
          <div className="rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100">
            Yellow · Watch
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-4">
          {healthSignals.map((signal) => (
            <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">
                {signal.label}
              </div>
              <div className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${signal.className}`}>
                {signal.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">What changed this week</h3>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-300">
                4 signals found
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {changeRows.map((row) => (
                <div key={row.what} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-sm font-medium text-white">{row.what}</div>
                    <div className="text-sm text-gray-300 sm:max-w-[68%]">{row.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="text-sm font-semibold text-cyan-100">Why Schedule is Yellow</div>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-gray-300">
              <li>• Equipment delivery is three days behind the baseline date.</li>
              <li>• Site access decision remains open and has an owner assigned.</li>
              <li>• Recovery plan is drafted but not approved.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1">
                Source: Supplier Standup
              </span>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1">
                Source: ADO #4102
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white">
              Review sources
            </button>
            <button className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-gray-950">
              Publish report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CredibilityStrip() {
  return (
    <section data-section-id="credibility" className="border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-5 sm:grid-cols-4 sm:px-6 lg:grid-cols-6 lg:px-8">
        {credibilityItems.map((item) => (
          <div key={item.label} className="px-3 py-3 text-center">
            <div className="text-sm font-semibold text-white">{item.value}</div>
            <div className="mt-1 text-xs text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section data-section-id="problem" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            eyebrow="The real problem"
            title="Executives do not need more status. They need trust."
            body="Most program reporting fails because the report is disconnected from the evidence. Updates are rewritten, risks are softened, decisions are scattered, and leaders are left asking why the program is Green, Yellow, or Red."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {problemCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MidPageCtaSection() {
  return (
    <section data-section-id="mid-cta" className="border-b border-white/10 bg-cyan-300/[0.045]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Pilot fit conversation
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Find out if Signal fits your reporting cycle.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
            Best fit: complex programs with multiple reporting areas, executive visibility needs, and enough reporting pain to measure improvement.
          </p>
        </div>
        <PrimaryLink href="#contact" label="Request a 20-minute fit call" event="mid_cta_fit_call" />
      </div>
    </section>
  )
}

function PlatformPreviewSection() {
  return (
    <section id="platform" data-section-id="platform" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Latimere Signal
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Evidence-backed reporting for complex transformation programs.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Signal is built around a simple operating model: ingest evidence,
            generate a defensible draft, explain program health, route for review,
            and publish a clean executive artifact.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {platformModules.map((module) => (
            <div
              key={module.title}
              className="rounded-[1.45rem] border border-white/10 bg-[#080c16] p-6 shadow-xl shadow-black/15"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {module.kicker}
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
                {module.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">{module.desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-300">
                {module.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ExecutiveArtifactSection() {
  return (
    <section id="artifact" data-section-id="artifact" className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <SectionIntro
          eyebrow="Executive artifact"
          title="The output should look like something leaders would actually read."
          body="The web app is the workflow. The report is the deliverable. Signal should produce a clean artifact that can be shared in a steering committee packet, attached to an email, or archived as the approved weekly record."
        />
        <WhiteReportPreview />
      </div>
    </section>
  )
}

function WhiteReportPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-white/8 blur-2xl" />
      <div className="rounded-[1.6rem] border border-white/10 bg-white p-6 text-gray-950 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between border-b border-gray-200 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Latimere Signal Report
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-gray-950">
              Northstar Plant Modernization
            </h3>
            <p className="mt-1 text-sm text-gray-500">Week of May 4 – May 11</p>
          </div>
          <div className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
            Overall: Yellow
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {reportHealth.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{item.label}</div>
              <div className={`mt-1 text-sm font-bold ${item.className}`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-950">What Changed This Week</h4>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
            {reportChanges.map((item, idx) => (
              <div key={item.what} className={`grid grid-cols-[0.34fr_0.66fr] gap-4 px-4 py-3 text-sm ${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                <div className="font-semibold text-gray-950">{item.what}</div>
                <div className="text-gray-600">{item.change}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-950">Why Schedule is Yellow</h4>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>• Equipment delivery is three days behind the baseline.</li>
            <li>• Recovery plan has not yet been approved.</li>
            <li>• Site access decision remains open with Facilities Readiness.</li>
          </ul>
          <div className="mt-3 rounded-xl bg-cyan-50 p-3 text-xs text-cyan-900">
            Evidence: Supplier Coordination Standup, ADO #4102, Decision Log #18
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkflowSection() {
  return (
    <section id="workflow" data-section-id="workflow" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionIntro
            eyebrow="Operating workflow"
            title="Built for recurring governance, not one-off summaries."
            body="The workflow keeps the report editable while it is being prepared and locked once approved or published. That preserves the artifact while still letting teams move into the next reporting period."
          />

          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-gray-950">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-gray-300">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function EvidenceSection() {
  return (
    <section id="evidence" data-section-id="evidence" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionIntro
              eyebrow="The differentiator"
              title="Every important claim should be traceable."
              body="The product should not ask executives to trust a black-box summary. It should show where the statement came from, who reviewed it, what changed, and why the health rating was assigned."
            />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {evidenceCards.map((card) => (
                <FeatureCard key={card.title} {...card} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-[#080c16] p-5 shadow-2xl shadow-black/25">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Source drawer
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">Why this bullet exists</h3>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  3 sources
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-sm font-semibold text-white">
                  Supplier delivery remains the primary schedule risk.
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">
                  <span className="rounded-full bg-cyan-300/10 px-2 py-1">Transcript</span>
                  <span className="rounded-full bg-cyan-300/10 px-2 py-1">ADO #4102</span>
                  <span className="rounded-full bg-cyan-300/10 px-2 py-1">Decision #18</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {sourceExamples.map((source) => (
                  <div key={source.title} className="rounded-xl border border-white/10 bg-[#05070f] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white">{source.title}</div>
                      <div className="text-xs text-gray-400">{source.type}</div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-300">“{source.quote}”</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function UseCasesSection() {
  return (
    <section data-section-id="use-cases" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionIntro
            eyebrow="Where it fits"
            title="Start where reporting pain is expensive."
            body="Latimere Signal is not for every project. It is for programs where status accuracy, decision latency, dependency visibility, and executive confidence matter."
          />
          <PrimaryLink href="#contact" label="Talk through a use case" event="use_cases_talk" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase) => (
            <div key={useCase.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {useCase.kicker}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{useCase.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">{useCase.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PilotSection() {
  return (
    <section id="pilot" data-section-id="pilot" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            eyebrow="Recommended first step"
            title="Start with one controlled program pilot."
            body="Validate the reporting workflow with one program, three to five reporting areas, defined success criteria, and weekly feedback before expanding to broader portfolio governance."
          />

          <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.055] p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {pilotItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-[#05070f]/70 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#contact" label="Request pilot details" event="pilot_request_details" />
              <SecondaryLink href="#pricing" label="View program pricing" event="pilot_pricing" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SecuritySection() {
  return (
    <section id="security" data-section-id="security" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <SectionIntro
            eyebrow="Enterprise readiness"
            title="Built honestly for controlled pilots. Expanding toward enterprise controls."
            body="Latimere Signal is positioned for controlled pilots today, with enterprise controls expanding as customer requirements mature. The product roadmap prioritizes access, data handling, audit trails, integrations, retention, and AI review workflows."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {securityCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" data-section-id="pricing" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Commercial model
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Price by program value, not stakeholder seats.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Stakeholders should not need paid seats just to read the report. The
            value is in the governed reporting workspace, evidence model,
            integrations, and executive operating rhythm.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {pricingCards.map((tier) => (
            <div
              key={tier.title}
              className={`rounded-[1.5rem] border p-6 ${
                tier.highlight
                  ? 'border-cyan-300/35 bg-cyan-300/[0.075] shadow-2xl shadow-cyan-950/25'
                  : 'border-white/10 bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{tier.title}</h3>
                {tier.highlight && (
                  <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-bold text-gray-950">
                    Recommended
                  </span>
                )}
              </div>
              <div className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {tier.price}
              </div>
              <p className="mt-3 text-sm leading-7 text-gray-300">{tier.desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-300">
                {tier.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CommunitySection({
  CommunityCTA,
  prefetchCommunity,
}: {
  CommunityCTA: React.ComponentType<any>
  prefetchCommunity: () => void
}) {
  return (
    <section data-section-id="community" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CommunityCTA
          title="Join the Latimere Community"
          body="Discuss reporting templates, PMO governance patterns, and transformation delivery lessons."
          buttonLabel="Visit Community"
          href="/community?utm_source=landing&utm_medium=banner&utm_campaign=community"
          eventLabel="landing_banner_community"
          variant="outline"
          onClick={() => console.info('[CTA] community → banner clicked')}
          onMouseEnter={prefetchCommunity}
        />
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="faq" data-section-id="faq" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            FAQ
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Direct answers for serious buyers.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {faqItems.map((item) => (
            <div key={item.q} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
              <h3 className="text-base font-semibold text-white">{item.q}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact" data-section-id="contact">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Start the conversation
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Request a pilot for one transformation program.
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Tell us the basics. A good first conversation is about fit: current reporting pain, program complexity, available evidence, and whether a controlled pilot would be measurable.
            </p>
            <div className="mt-6 space-y-3">
              {contactProof.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-[#05070f]/60 p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-gray-300">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <LeadForm />
        </div>
      </div>
    </section>
  )
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-gray-300">{body}</p>
    </div>
  )
}

function FeatureCard({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
        {kicker}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-300">{desc}</p>
    </div>
  )
}

function PrimaryLink({ href, label, event }: { href: string; label: string; event: string }) {
  return (
    <a
      href={href}
      onClick={() => console.info(`[CTA] ${event}`)}
      className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
    >
      {label}
    </a>
  )
}

function SecondaryLink({ href, label, event }: { href: string; label: string; event: string }) {
  return (
    <a
      href={href}
      onClick={() => console.info(`[CTA] ${event}`)}
      className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
    >
      {label}
    </a>
  )
}

function LeadForm() {
  const router = useRouter()
  const [mode, setMode] = React.useState<LeadMode>('pilot')
  const [status, setStatus] = React.useState<SubmitStatus>('idle')
  const [message, setMessage] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [programType, setProgramType] = React.useState('')
  const [tooling, setTooling] = React.useState('')
  const [reportingAreas, setReportingAreas] = React.useState('')
  const [cadence, setCadence] = React.useState('')
  const [currentProcess, setCurrentProcess] = React.useState('')
  const [priority, setPriority] = React.useState('')

  React.useEffect(() => {
    const queryMode = router.query?.mode
    const requested = Array.isArray(queryMode) ? queryMode[0] : queryMode
    if (requested === 'pilot' || requested === 'partner' || requested === 'enterprise') {
      setMode(requested)
      console.info('[LeadForm] mode from query', requested)
    }
  }, [router.query?.mode])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setMessage(null)

    if (!name || !email || !company) {
      setStatus('error')
      setMessage('Please provide your name, work email, and company.')
      return
    }

    const payload = {
      name,
      email,
      mode,
      topic:
        mode === 'partner'
          ? 'Latimere Signal Partner Conversation'
          : mode === 'enterprise'
            ? 'Latimere Signal Enterprise Conversation'
            : 'Latimere Signal Pilot Request',
      enterprise: {
        company,
        role,
        programType,
        tooling,
        reportingAreas,
        cadence,
        currentProcess,
        priority,
      },
      wallet: null,
      meta: {
        page: 'latimere-signal-landing',
        ts: Date.now(),
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      },
    }

    try {
      console.info('Submitting → /api/contact', { mode, topic: payload.topic })
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)

      if (res.ok) {
        console.info('Lead submitted', { response: data, mode })
        try {
          ;(window as any).latimereTrackLead?.(`latimere_signal_${mode}`)
        } catch {}
        setStatus('success')
        setMessage("Thanks — we'll review this and follow up with the right next step.")
        setName('')
        setEmail('')
        setCompany('')
        setRole('')
        setProgramType('')
        setTooling('')
        setReportingAreas('')
        setCadence('')
        setCurrentProcess('')
        setPriority('')
      } else {
        console.error('Lead failed', { status: res.status, data, mode })
        setStatus('error')
        setMessage(
          (data as any)?.dev?.message ||
            'We could not submit your request. Please try again shortly.'
        )
      }
    } catch (err) {
      console.error('Lead network error', err)
      setStatus('error')
      setMessage('We could not submit your request. Please try again shortly.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-label="Latimere Signal lead form">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#05070f]/70 p-1.5">
        {leadModes.map((leadMode) => (
          <button
            key={leadMode.value}
            type="button"
            onClick={() => setMode(leadMode.value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
              mode === leadMode.value
                ? 'bg-cyan-400 text-gray-950'
                : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
            }`}
            aria-pressed={mode === leadMode.value}
          >
            {leadMode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="lead-name" label="Name *" value={name} onChange={setName} placeholder="Jordan Taylor" />
        <Field id="lead-email" label="Work email *" value={email} onChange={setEmail} placeholder="you@company.com" type="email" inputMode="email" />
        <Field id="lead-company" label="Company *" value={company} onChange={setCompany} placeholder="Northstar Manufacturing" />
        <Field id="lead-role" label="Role" value={role} onChange={setRole} placeholder="PMO Director / Partner / Program Lead" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id="lead-priority"
          label="Primary pain"
          value={priority}
          onChange={setPriority}
          options={priorityOptions}
        />
        <SelectField
          id="lead-program-type"
          label="Program type"
          value={programType}
          onChange={setProgramType}
          options={programTypeOptions}
        />
        <SelectField
          id="lead-tooling"
          label="Primary tools"
          value={tooling}
          onChange={setTooling}
          options={toolingOptions}
        />
        <Field id="lead-cadence" label="Reporting cadence" value={cadence} onChange={setCadence} placeholder="Weekly / Biweekly / Monthly" />
        <Field id="lead-areas" label="Approx. reporting areas" value={reportingAreas} onChange={setReportingAreas} placeholder="6" inputMode="numeric" />
      </div>

      <div>
        <label htmlFor="lead-process" className="mb-1.5 block text-sm font-medium text-gray-100">
          Current reporting process
        </label>
        <textarea
          id="lead-process"
          value={currentProcess}
          onChange={(e) => setCurrentProcess(e.target.value)}
          placeholder="PowerPoint deck, Word doc, spreadsheets, Teams transcripts, RAID log, ADO/Jira, steering committee packet..."
          rows={4}
          className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
        />
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            status === 'error'
              ? 'border-red-400/30 bg-red-500/10 text-red-200'
              : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === 'submitting'}
          onClick={() => console.info('[CTA] contact_submit', { mode })}
          className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Sending…' : 'Submit request'}
        </button>
        <a
          href="mailto:taylor@latimere.com"
          className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
        >
          Email directly
        </a>
      </div>
    </form>
  )
}

function Field(props: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: string
}) {
  const { id, label, value, onChange, placeholder, type = 'text', inputMode } = props
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-100">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
      />
    </div>
  )
}

function SelectField(props: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const { id, label, value, onChange, options } = props
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-100">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const heroProofPoints = [
  {
    title: 'Evidence first',
    desc: 'Key claims are tied back to transcripts, work items, decisions, and stored source material.',
  },
  {
    title: 'Human approved',
    desc: 'AI drafts the report, but program leaders review, edit, approve, and publish.',
  },
  {
    title: 'Built for cadence',
    desc: 'Each reporting period creates a governed artifact and a clean path into the next cycle.',
  },
]

const healthSignals = [
  { label: 'Schedule', value: 'Yellow', className: 'bg-yellow-300/12 text-yellow-100 border border-yellow-300/20' },
  { label: 'Scope', value: 'Green', className: 'bg-emerald-300/12 text-emerald-100 border border-emerald-300/20' },
  { label: 'Risk', value: 'Yellow', className: 'bg-yellow-300/12 text-yellow-100 border border-yellow-300/20' },
  { label: 'Issues', value: 'Green', className: 'bg-emerald-300/12 text-emerald-100 border border-emerald-300/20' },
  { label: 'People', value: 'Green', className: 'bg-emerald-300/12 text-emerald-100 border border-emerald-300/20' },
  { label: 'Go-live', value: 'Yellow', className: 'bg-yellow-300/12 text-yellow-100 border border-yellow-300/20' },
]

const changeRows = [
  { what: 'Schedule', change: 'Equipment delivery moved from on track to three days behind baseline.' },
  { what: 'Readiness', change: 'Training completion increased from 68% to 82% across floor supervisors.' },
  { what: 'Open risks', change: 'One supplier risk closed; one site access dependency escalated.' },
  { what: 'Decision latency', change: 'Safety certification decision remains open after two review cycles.' },
]

const credibilityItems = [
  { value: 'Signal', label: 'What changed' },
  { value: 'Health', label: 'Green / Yellow / Red' },
  { value: 'Evidence', label: 'Source traceability' },
  { value: 'Review', label: 'Human approval' },
  { value: 'Publish', label: 'Locked artifacts' },
  { value: 'Scale', label: 'Reporting areas' },
]

const problemCards = [
  {
    kicker: 'Manual drag',
    title: 'Weekly reporting consumes leadership bandwidth.',
    desc: 'PMs chase updates, rewrite notes, reconcile spreadsheets, and package the same story repeatedly.',
  },
  {
    kicker: 'Low trust',
    title: 'Status without evidence becomes opinion.',
    desc: 'If a report says Yellow, leaders should be able to see why, what changed, and what evidence supports it.',
  },
  {
    kicker: 'Missed signals',
    title: 'Risks and decisions hide in transcripts.',
    desc: 'Important blockers often exist in meeting notes, chats, tickets, and RAID logs before they appear in executive reporting.',
  },
  {
    kicker: 'Inconsistent output',
    title: 'Every reporting area tells the story differently.',
    desc: 'Signal standardizes the operating rhythm without forcing every organization into the same vocabulary.',
  },
]

const platformModules = [
  {
    kicker: 'Module 01',
    title: 'Signal Reports',
    desc: 'Generate executive-ready reports from the evidence already produced by the program.',
    items: ['Executive summary', 'Key achievements', 'Risks, issues, dependencies', 'Decisions and leadership asks'],
  },
  {
    kicker: 'Module 02',
    title: 'Program Health',
    desc: 'Show Green, Yellow, or Red status with a clear explanation of why the rating exists.',
    items: ['Overall health', 'Schedule, scope, risk, issue, people', 'Trajectory indicators', 'Why-this-status evidence'],
  },
  {
    kicker: 'Module 03',
    title: 'Signal Evidence',
    desc: 'Tie claims back to the source material so teams can verify before they publish.',
    items: ['Transcript citations', 'ADO/Jira work items', 'Source drawer', 'DOCX evidence references'],
  },
]

const reportHealth = [
  { label: 'Schedule', value: 'Yellow', className: 'text-yellow-700' },
  { label: 'Scope', value: 'Green', className: 'text-emerald-700' },
  { label: 'Risk', value: 'Yellow', className: 'text-yellow-700' },
  { label: 'Issues', value: 'Green', className: 'text-emerald-700' },
  { label: 'People', value: 'Green', className: 'text-emerald-700' },
  { label: 'Go-live', value: 'Yellow', className: 'text-yellow-700' },
]

const reportChanges = [
  { what: 'Schedule', change: 'Equipment delivery moved from on track to three days behind baseline.' },
  { what: 'Readiness', change: 'Training completion increased from 68% to 82%.' },
  { what: 'Decision', change: 'Site access exception remains open with Facilities Readiness.' },
]

const workflowSteps = [
  {
    title: 'Create a program workspace',
    desc: 'Define the program, reporting areas, contributors, reporting cadence, and stakeholder distribution model.',
  },
  {
    title: 'Ingest evidence',
    desc: 'Upload transcripts and connect read-only project-system data so Signal can ground the draft in source material.',
  },
  {
    title: 'Generate a defensible draft',
    desc: 'Signal proposes the report narrative, program health, what changed this week, and key governance items.',
  },
  {
    title: 'Review and approve',
    desc: 'Reporting area owners and program leaders edit the content, inspect sources, and approve before publishing.',
  },
  {
    title: 'Publish and lock',
    desc: 'Published reports become governed artifacts, while future-period drafting keeps the weekly cycle moving.',
  },
]

const evidenceCards = [
  {
    kicker: 'Traceability',
    title: 'Source-backed bullets',
    desc: 'Claims can reference transcript excerpts, decision records, ADO/Jira items, and uploaded evidence.',
  },
  {
    kicker: 'Health rationale',
    title: 'Why this status?',
    desc: 'Program Health should show the reasons behind Green, Yellow, or Red so leaders know what to do next.',
  },
  {
    kicker: 'Change detection',
    title: 'What Changed This Week',
    desc: 'The report should highlight the deltas that matter instead of forcing executives to compare documents manually.',
  },
  {
    kicker: 'Governance',
    title: 'Review before publish',
    desc: 'AI-generated content is a draft. Human owners approve the version that stakeholders see.',
  },
]

const sourceExamples = [
  {
    title: 'Supplier Coordination Standup',
    type: 'Transcript',
    quote: 'The shipment is now expected Wednesday, which puts installation three days behind the original baseline.',
  },
  {
    title: 'ADO Item #4102',
    type: 'Work item',
    quote: 'Delivery dependency remains open. Recovery plan requires site access approval before Friday.',
  },
  {
    title: 'Decision Log #18',
    type: 'Decision',
    quote: 'Site access exception pending executive approval; current owner is Facilities Readiness.',
  },
]

const useCases = [
  {
    kicker: 'Transformation',
    title: 'Enterprise modernization',
    desc: 'For programs with multiple reporting areas, complex dependencies, and recurring executive readouts.',
  },
  {
    kicker: 'PMO',
    title: 'Portfolio governance',
    desc: 'For PMO leaders who need consistent weekly status, decision visibility, and action tracking.',
  },
  {
    kicker: 'Consulting',
    title: 'Delivery teams',
    desc: 'For firms that want a repeatable reporting method across client programs and delivery teams.',
  },
  {
    kicker: 'Operations',
    title: 'High-stakes initiatives',
    desc: 'For initiatives where missed risks, vague status, and slow decisions create real business exposure.',
  },
]

const pilotItems = [
  {
    title: 'Scope',
    desc: 'One program, three to five reporting areas, one reporting cadence, and a controlled stakeholder group.',
  },
  {
    title: 'Inputs',
    desc: 'Meeting transcripts, RAID inputs, decisions, project-system data, and current report examples.',
  },
  {
    title: 'Outputs',
    desc: 'Program Health, What Changed This Week, evidence-backed report, DOCX export, and shareable readout.',
  },
  {
    title: 'Success criteria',
    desc: 'Cleaner reporting cycle, improved source traceability, faster review, and better leadership action visibility.',
  },
]

const securityCards = [
  {
    kicker: 'Access',
    title: 'Role-based workflow',
    desc: 'Separate contributor, program leader, admin, and stakeholder access patterns.',
  },
  {
    kicker: 'Integrations',
    title: 'Read-only project data',
    desc: 'ADO/Jira integration should use least-privilege access and avoid unnecessary write permissions.',
  },
  {
    kicker: 'Audit',
    title: 'Report history',
    desc: 'Track generated, edited, submitted, approved, returned, and published states across each reporting period.',
  },
  {
    kicker: 'Publishing',
    title: 'Locked artifacts',
    desc: 'Published reports should not be silently overwritten. Revisions should create a new controlled draft.',
  },
  {
    kicker: 'AI handling',
    title: 'Human-approved output',
    desc: 'The product should treat AI output as a draft and require human review before stakeholder distribution.',
  },
  {
    kicker: 'Roadmap',
    title: 'Enterprise controls',
    desc: 'SSO, retention controls, advanced audit logging, and formal security reviews belong on the enterprise roadmap.',
  },
]

const pricingCards = [
  {
    title: 'Pilot',
    price: '$7.5K–$15K',
    desc: 'A focused validation period for one program and a limited set of reporting areas.',
    highlight: false,
    items: [
      'One program workspace',
      'Three to five reporting areas',
      'Transcript upload and evidence review',
      'Weekly reporting cycle',
      'Pilot success criteria',
    ],
  },
  {
    title: 'Program',
    price: '$50K–$150K/yr',
    desc: 'For active transformation programs that need recurring reporting governance.',
    highlight: true,
    items: [
      'Program Health',
      'What Changed This Week',
      'Approval and publish workflow',
      'DOCX and shareable outputs',
      'ADO/Jira integration options',
    ],
  },
  {
    title: 'Enterprise / Partner',
    price: 'Custom',
    desc: 'For multiple programs, consulting delivery teams, or portfolio-level governance.',
    highlight: false,
    items: [
      'Multiple programs or clients',
      'Configurable terminology and templates',
      'Advanced governance controls',
      'Implementation support',
      'Enterprise security roadmap alignment',
    ],
  },
]

const faqItems = [
  {
    q: 'Is Latimere Signal just meeting summarization?',
    a: 'No. Meeting summarization is a feature. Latimere Signal is designed around governed reporting: program health, evidence-backed claims, review, approval, publishing, and recurring reporting periods.',
  },
  {
    q: 'Why use “Reporting Areas” instead of “workstreams”?',
    a: 'Reporting Areas is broader. A customer can map it to workstreams, projects, departments, vendors, functional areas, or business units without making the product feel locked to one methodology.',
  },
  {
    q: 'How does Signal handle Green, Yellow, and Red status?',
    a: 'The target model is not just to assign a color. The target model is to explain why that health rating exists and tie the explanation to evidence.',
  },
  {
    q: 'Do stakeholders need accounts?',
    a: 'Not necessarily. Program contributors and reviewers need accounts. Executives can receive published artifacts, exports, or read-only links depending on the customer workflow.',
  },
  {
    q: 'How do you reduce hallucination risk?',
    a: 'The product should constrain generated content to available evidence, expose sources for review, and require human approval before publishing. It should not ask buyers to blindly trust AI output.',
  },
  {
    q: 'Is the product enterprise-security complete today?',
    a: 'No. It should be positioned honestly: the current product can support controlled pilots, while SSO, advanced audit logging, retention controls, and formal security requirements belong on the enterprise roadmap.',
  },
]

const contactProof = [
  {
    title: 'Best first fit',
    desc: 'Complex programs with multiple reporting areas and weekly executive visibility needs.',
  },
  {
    title: 'Best buyer',
    desc: 'PMO, transformation, consulting delivery, and program leadership teams.',
  },
  {
    title: 'Best pilot',
    desc: 'A scoped reporting cycle where the current process is painful enough to measure improvement.',
  },
]

const leadModes: { value: LeadMode; label: string }[] = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'partner', label: 'Partner' },
  { value: 'enterprise', label: 'Enterprise' },
]

const programTypeOptions = [
  { value: 'transformation', label: 'Transformation / PMO' },
  { value: 'erp', label: 'ERP / business systems' },
  { value: 'platform_delivery', label: 'Platform / technology delivery' },
  { value: 'operations', label: 'Operations / business initiative' },
  { value: 'consulting_delivery', label: 'Consulting delivery portfolio' },
  { value: 'other', label: 'Other' },
]

const toolingOptions = [
  { value: 'ado', label: 'Azure DevOps' },
  { value: 'jira', label: 'Jira' },
  { value: 'smartsheet', label: 'Smartsheet' },
  { value: 'oneplan', label: 'OnePlan' },
  { value: 'mixed', label: 'Mixed / other' },
  { value: 'manual', label: 'Mostly manual today' },
]

const priorityOptions = [
  { value: 'manual_reporting', label: 'Manual reporting effort' },
  { value: 'status_trust', label: 'Low trust in status' },
  { value: 'missed_risks', label: 'Missed risks / dependencies' },
  { value: 'decision_latency', label: 'Slow decisions' },
  { value: 'executive_visibility', label: 'Executive visibility' },
  { value: 'standardization', label: 'Standardization across teams' },
]
