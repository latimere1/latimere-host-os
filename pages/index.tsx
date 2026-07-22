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

type LeadMode = 'research' | 'partner' | 'pilot'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export const getStaticProps: GetStaticProps<LandingProps> = async () => {
  try {
    return { props: { latestPosts: getAllPosts().slice(0, 3) } }
  } catch (err) {
    console.error('getStaticProps failed to load blog posts:', err)
    return { props: { latestPosts: [] } }
  }
}

export default function LatimereVaultLanding({ latestPosts }: LandingProps) {
  const router = useRouter()
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const canonicalHref = appUrlEnv ? `${appUrlEnv}/` : '/'

  React.useEffect(() => {
    console.info('[LatimereVaultLanding] mounted', {
      path: router.asPath,
      env: process.env.NODE_ENV,
      communityEnabled: ENABLE_COMMUNITY,
      blogCount: latestPosts?.length ?? 0,
    })
  }, [router.asPath, latestPosts?.length])

  React.useEffect(() => {
    try {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>('[data-section-id]')
      )
      const seen = new Set<string>()
      const observer = new IntersectionObserver(
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
      elements.forEach((element) => observer.observe(element))
      return () => observer.disconnect()
    } catch (err) {
      console.warn('[Observer] init failed', err)
    }
  }, [])

  const prefetchOnce = React.useRef({ community: false })
  const prefetchCommunity = React.useCallback(() => {
    if (!ENABLE_COMMUNITY || prefetchOnce.current.community) return
    router.prefetch('/community').catch(() => {})
    prefetchOnce.current.community = true
  }, [router])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Latimere Vault',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Customer-controlled infrastructure',
        url: appUrlEnv || 'https://latimere.com',
        image: '/og.png',
        description:
          'Latimere Vault is being developed as a private enterprise AI platform for organizations that want useful AI while retaining control of sensitive data, deployment, models, permissions, and governance.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description:
            'Research participation and design partner conversations are available. Pilot pricing will be based on deployment requirements and use-case scope.',
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
        <title>Latimere Vault | Private AI Your Organization Controls</title>
        <meta
          name="description"
          content="Latimere Vault is being developed as a private enterprise AI platform that helps organizations use AI across approved company knowledge while retaining control of deployment, data, models, permissions, and governance."
        />
        <link rel="canonical" href={canonicalHref} />
        <meta name="robots" content="index,follow" />
        <meta
          property="og:title"
          content="Latimere Vault | Private AI Your Organization Controls"
        />
        <meta
          property="og:description"
          content="Help shape a customer-controlled AI platform built for sensitive company knowledge, secure deployment, source-grounded answers, and governed business workflows."
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
          <TrustStrip />
          <ProblemSection />
          <ResearchCtaSection />
          <VaultVisionSection />
          <ControlPlaneSection />
          <DeploymentSection />
          <SignalSection />
          <DesignPartnerSection />
          <WhoWeNeedSection />
          <RoadmapSection />
          <CommercialSection />
          <HonestySection />
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
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(20,184,166,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0)_38%)]"
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Latimere Vault · Private enterprise AI in development
            </div>

            <h1 className="max-w-5xl text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Bring AI to your organization without giving up control of your data.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 sm:text-lg">
              Latimere Vault is being developed as a private enterprise AI platform
              that runs within infrastructure your organization controls—helping
              teams securely use approved company knowledge, grounded answers, and
              governed AI workflows.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PrimaryLink
                href="#contact"
                label="Join the design partner program"
                event="hero_design_partner"
              />
              <SecondaryLink
                href="#contact"
                label="Book a private AI research session"
                event="hero_research_session"
              />
              <SecondaryLink
                href="#vision"
                label="Explore the vision"
                event="hero_explore_vision"
              />
            </div>

            <p className="mt-5 max-w-2xl text-xs leading-6 text-gray-400">
              We are currently conducting customer research and selecting early
              design partners. Participation does not require purchasing a product.
            </p>
          </div>

          <VaultConsoleMockup />
        </div>
      </div>
    </section>
  )
}

function VaultConsoleMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
      <div className="absolute -inset-6 -z-10 rounded-[2.2rem] bg-cyan-400/10 blur-2xl" />
      <div className="overflow-hidden rounded-[1.8rem] border border-white/12 bg-[#080c16]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
              Latimere Vault
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              Private company intelligence
            </div>
          </div>
          <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Customer controlled
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-4 sm:grid-cols-4">
          {vaultStatus.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-400">
                {item.label}
              </div>
              <div className="mt-2 text-xs font-semibold text-cyan-100">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Ask approved company knowledge
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-white">
              What decisions were made about the Phoenix launch, and which risks are still open?
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-cyan-100">Grounded response</div>
              <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-100">
                5 approved sources
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              The launch date remains unchanged. Security review is complete, but
              vendor migration and regional readiness remain open dependencies.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">
              <span className="rounded-full border border-cyan-300/20 px-2 py-1">SharePoint</span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-1">Jira</span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-1">Meeting notes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-xs font-medium text-gray-300">
              Permission checked
            </div>
            <div className="rounded-xl bg-cyan-400 px-3 py-3 text-center text-xs font-bold text-gray-950">
              View cited sources
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section data-section-id="trust" className="border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
        {trustItems.map((item) => (
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
            eyebrow="The enterprise AI gap"
            title="Organizations want the value of AI without losing control."
            body="Public AI tools can be useful, but many organizations still face unresolved questions about sensitive data, access, retention, cost, auditability, model choice, and where company intelligence is processed."
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

function ResearchCtaSection() {
  return (
    <section data-section-id="research-cta" className="border-b border-white/10 bg-cyan-300/[0.045]">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Private AI research program
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Help define what a trustworthy private AI platform must do.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-300">
            We are interviewing IT, security, infrastructure, AI governance, and
            business leaders for 25–30 minutes. Qualified participants receive a
            $25 Starbucks gift card as a thank-you for their time.
          </p>
        </div>
        <PrimaryLink href="#contact" label="Request a research session" event="research_cta" />
      </div>
    </section>
  )
}

function VaultVisionSection() {
  return (
    <section id="vision" data-section-id="vision" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            The product vision
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            A private intelligence layer for the organization.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Vault is envisioned as the secure foundation for AI applications that
            use approved company knowledge while respecting infrastructure choices,
            user permissions, source traceability, and human governance.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {platformLayers.map((layer) => (
            <div key={layer.title} className="rounded-[1.45rem] border border-white/10 bg-[#080c16] p-6 shadow-xl shadow-black/15">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {layer.kicker}
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">{layer.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">{layer.desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-300">
                {layer.items.map((item) => (
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

function ControlPlaneSection() {
  return (
    <section data-section-id="control-plane" className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <SectionIntro
          eyebrow="Designed around control"
          title="The customer should decide where AI runs and what it may access."
          body="The product direction centers on giving administrators practical control over deployment, approved knowledge, identity, permissions, models, logs, and business workflows—not merely providing another chat interface."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {controlCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DeploymentSection() {
  return (
    <section data-section-id="deployment" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionIntro
            eyebrow="Deployment direction"
            title="Private AI should fit the customer—not force one architecture."
            body="Customer research will determine the initial deployment path. The long-term direction is to support controlled environments while clearly distinguishing current, prototype, planned, and future capabilities."
          />
          <PrimaryLink href="#contact" label="Share your requirements" event="deployment_requirements" />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {deploymentModels.map((model) => (
            <div key={model.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{model.kicker}</div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">{model.status}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{model.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">{model.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SignalSection() {
  return (
    <section data-section-id="signal" className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            First application layer
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Latimere Signal becomes the first workflow powered by Vault.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Signal applies private company intelligence to executive reporting,
            program health, risks, decisions, and organizational memory. The goal is
            to demonstrate that Vault can power useful business outcomes—not just AI chat.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {signalBenefits.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
        <SignalPreview />
      </div>
    </section>
  )
}

function SignalPreview() {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-[#080c16] p-5 shadow-2xl shadow-black/25">
      <div className="flex items-start justify-between border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Latimere Signal</div>
          <h3 className="mt-2 text-lg font-semibold text-white">Evidence-backed leadership brief</h3>
        </div>
        <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-100">Watch</span>
      </div>
      <div className="mt-5 space-y-3">
        {signalRows.map((row) => (
          <div key={row.title} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-sm font-semibold text-white">{row.title}</div>
            <p className="mt-1 text-sm leading-6 text-gray-300">{row.desc}</p>
            <div className="mt-2 text-xs text-cyan-200">{row.source}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DesignPartnerSection() {
  return (
    <section id="partners" data-section-id="partners" className="border-b border-white/10 bg-cyan-300/[0.035]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            eyebrow="Design partner program"
            title="Help shape the first deployable version of Latimere Vault."
            body="We are selecting a small number of organizations with a real private-AI challenge, an identifiable pilot use case, and leaders willing to help define product, security, deployment, and success requirements."
          />
          <div className="rounded-[1.5rem] border border-cyan-300/15 bg-[#05070f]/70 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {partnerItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-sm leading-6 text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink href="#contact" label="Apply as a design partner" event="partner_apply" />
              <SecondaryLink href="#roadmap" label="See the validation roadmap" event="partner_roadmap" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhoWeNeedSection() {
  return (
    <section data-section-id="who-we-need" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Who we want to hear from</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">The people responsible for making AI useful and governable.</h2>
          <p className="mt-4 text-base leading-8 text-gray-300">The strongest conversations involve leaders who understand both the opportunity and the organizational constraints surrounding enterprise AI adoption.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {targetRoles.map((role) => (
            <div key={role.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{role.kicker}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{role.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RoadmapSection() {
  return (
    <section id="roadmap" data-section-id="roadmap" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionIntro
            eyebrow="Validation before scale"
            title="We are building with customers, not behind closed doors."
            body="The immediate objective is to validate demand, identify the first repeatable use case, recruit design partners, and then build a controlled prototype against defined requirements."
          />
          <div className="space-y-4">
            {roadmapSteps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-gray-950">{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white">{step.title}</h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-300">{step.status}</span>
                  </div>
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

function CommercialSection() {
  return (
    <section data-section-id="commercial" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Early engagement paths</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Start with research. Progress to partnership. Pilot only when the fit is real.</h2>
          <p className="mt-4 text-base leading-8 text-gray-300">These stages are intentionally separated so organizations can contribute without being pushed into a premature sales process.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {engagementCards.map((tier) => (
            <div key={tier.title} className={`rounded-[1.5rem] border p-6 ${tier.highlight ? 'border-cyan-300/35 bg-cyan-300/[0.075] shadow-2xl shadow-cyan-950/25' : 'border-white/10 bg-white/[0.04]'}`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{tier.title}</h3>
                {tier.highlight && <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-bold text-gray-950">Selective</span>}
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-white">{tier.price}</div>
              <p className="mt-3 text-sm leading-7 text-gray-300">{tier.desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-300">
                {tier.items.map((item) => (
                  <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" /><span>{item}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HonestySection() {
  return (
    <section data-section-id="honesty" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:px-8">
        <SectionIntro
          eyebrow="Honest product development"
          title="A credible private-AI company must be precise about what exists."
          body="Latimere Vault is in customer discovery and early product definition. We will not describe planned controls, certifications, integrations, or deployment modes as production-ready before they have been built and independently evaluated."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {honestyCards.map((card) => <FeatureCard key={card.title} {...card} />)}
        </div>
      </div>
    </section>
  )
}

function CommunitySection({ CommunityCTA, prefetchCommunity }: { CommunityCTA: React.ComponentType<any>; prefetchCommunity: () => void }) {
  return (
    <section data-section-id="community" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CommunityCTA
          title="Join the Latimere Community"
          body="Discuss private AI, enterprise governance, knowledge systems, and practical AI adoption."
          buttonLabel="Visit Community"
          href="/community?utm_source=landing&utm_medium=banner&utm_campaign=vault-community"
          eventLabel="vault_landing_community"
          variant="outline"
          onClick={() => console.info('[CTA] vault community clicked')}
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
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">FAQ</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Direct answers about the current stage.</h2>
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
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Start the conversation</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Tell us how your organization is approaching private AI.</h2>
            <p className="mt-4 text-sm leading-7 text-gray-300">Choose a research conversation, design partner application, or future pilot discussion. We will use your responses to determine fit and the most appropriate next step.</p>
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

function LeadForm() {
  const router = useRouter()
  const [mode, setMode] = React.useState<LeadMode>('research')
  const [status, setStatus] = React.useState<SubmitStatus>('idle')
  const [message, setMessage] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [companySize, setCompanySize] = React.useState('')
  const [industry, setIndustry] = React.useState('')
  const [deploymentPreference, setDeploymentPreference] = React.useState('')
  const [aiStatus, setAiStatus] = React.useState('')
  const [primaryConcern, setPrimaryConcern] = React.useState('')
  const [useCase, setUseCase] = React.useState('')
  const [restrictions, setRestrictions] = React.useState('')
  const [timeline, setTimeline] = React.useState('')

  React.useEffect(() => {
    const queryMode = router.query?.mode
    const requested = Array.isArray(queryMode) ? queryMode[0] : queryMode
    if (requested === 'research' || requested === 'partner' || requested === 'pilot') {
      setMode(requested)
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

    const topic = mode === 'partner'
      ? 'Latimere Vault Design Partner Application'
      : mode === 'pilot'
        ? 'Latimere Vault Future Pilot Conversation'
        : 'Latimere Vault Private AI Research Session'

    const payload = {
      name,
      email,
      mode,
      topic,
      enterprise: {
        company,
        role,
        companySize,
        industry,
        deploymentPreference,
        aiStatus,
        primaryConcern,
        useCase,
        restrictions,
        timeline,
      },
      wallet: null,
      meta: {
        page: 'latimere-vault-landing',
        ts: Date.now(),
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      },
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await safeJson(res)

      if (res.ok) {
        try {
          ;(window as any).latimereTrackLead?.(`latimere_vault_${mode}`)
        } catch {}
        setStatus('success')
        setMessage("Thanks — we'll review your information and follow up with the most appropriate next step.")
        setName('')
        setEmail('')
        setCompany('')
        setRole('')
        setCompanySize('')
        setIndustry('')
        setDeploymentPreference('')
        setAiStatus('')
        setPrimaryConcern('')
        setUseCase('')
        setRestrictions('')
        setTimeline('')
      } else {
        setStatus('error')
        setMessage((data as any)?.dev?.message || 'We could not submit your request. Please try again shortly.')
      }
    } catch (err) {
      console.error('Lead network error', err)
      setStatus('error')
      setMessage('We could not submit your request. Please try again shortly.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-label="Latimere Vault interest form">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#05070f]/70 p-1.5">
        {leadModes.map((leadMode) => (
          <button
            key={leadMode.value}
            type="button"
            onClick={() => setMode(leadMode.value)}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${mode === leadMode.value ? 'bg-cyan-400 text-gray-950' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'}`}
            aria-pressed={mode === leadMode.value}
          >
            {leadMode.label}
          </button>
        ))}
      </div>

      {mode === 'research' && (
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs leading-5 text-cyan-100">
          Qualified participants who complete a scheduled 25–30 minute research session will receive a $25 Starbucks gift card as a thank-you.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="lead-name" label="Name *" value={name} onChange={setName} placeholder="Jordan Taylor" />
        <Field id="lead-email" label="Work email *" value={email} onChange={setEmail} placeholder="you@company.com" type="email" inputMode="email" />
        <Field id="lead-company" label="Company *" value={company} onChange={setCompany} placeholder="Northstar Manufacturing" />
        <Field id="lead-role" label="Role" value={role} onChange={setRole} placeholder="CIO / CISO / IT Director" />
        <SelectField id="lead-size" label="Company size" value={companySize} onChange={setCompanySize} options={companySizeOptions} />
        <SelectField id="lead-industry" label="Industry" value={industry} onChange={setIndustry} options={industryOptions} />
        <SelectField id="lead-ai-status" label="Current AI stage" value={aiStatus} onChange={setAiStatus} options={aiStatusOptions} />
        <SelectField id="lead-deployment" label="Preferred deployment" value={deploymentPreference} onChange={setDeploymentPreference} options={deploymentOptions} />
        <SelectField id="lead-concern" label="Primary concern" value={primaryConcern} onChange={setPrimaryConcern} options={concernOptions} />
        <SelectField id="lead-timeline" label="Evaluation timeline" value={timeline} onChange={setTimeline} options={timelineOptions} />
      </div>

      <div>
        <label htmlFor="lead-use-case" className="mb-1.5 block text-sm font-medium text-gray-100">Highest-value AI use case</label>
        <textarea id="lead-use-case" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Secure knowledge search, internal support assistant, executive reporting, contract analysis, engineering knowledge, employee self-service..." rows={3} className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60" />
      </div>

      <div>
        <label htmlFor="lead-restrictions" className="mb-1.5 block text-sm font-medium text-gray-100">Current restrictions or requirements</label>
        <textarea id="lead-restrictions" value={restrictions} onChange={(e) => setRestrictions(e.target.value)} placeholder="Sensitive data restrictions, security review, identity requirements, audit expectations, approved infrastructure, cloud limitations..." rows={3} className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60" />
      </div>

      {message && (
        <div className={`rounded-xl border px-3 py-2 text-sm ${status === 'error' ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`} role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={status === 'submitting'} className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80 disabled:opacity-60">
          {status === 'submitting' ? 'Sending…' : mode === 'research' ? 'Request research session' : mode === 'partner' ? 'Apply as design partner' : 'Discuss a future pilot'}
        </button>
        <a href="mailto:taylor@latimere.com" className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60">Email directly</a>
      </div>
    </form>
  )
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-gray-300">{body}</p>
    </div>
  )
}

function FeatureCard({ kicker, title, desc }: { kicker: string; title: string; desc: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{kicker}</div>
      <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-300">{desc}</p>
    </div>
  )
}

function PrimaryLink({ href, label, event }: { href: string; label: string; event: string }) {
  return <a href={href} onClick={() => console.info(`[CTA] ${event}`)} className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80">{label}</a>
}

function SecondaryLink({ href, label, event }: { href: string; label: string; event: string }) {
  return <a href={href} onClick={() => console.info(`[CTA] ${event}`)} className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60">{label}</a>
}

function Field(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; inputMode?: string }) {
  const { id, label, value, onChange, placeholder, type = 'text', inputMode } = props
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-100">{label}</label>
      <input id={id} type={type} inputMode={inputMode as any} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60" />
    </div>
  )
}

function SelectField(props: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const { id, label, value, onChange, options } = props
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-100">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60">
        <option value="">Select</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  )
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return null }
}

const vaultStatus = [
  { label: 'Deployment', value: 'Private' },
  { label: 'Knowledge', value: 'Approved' },
  { label: 'Access', value: 'Permissioned' },
  { label: 'Answers', value: 'Cited' },
]

const trustItems = [
  { value: 'Control', label: 'Customer infrastructure' },
  { value: 'Privacy', label: 'Sensitive knowledge' },
  { value: 'Identity', label: 'Permission-aware access' },
  { value: 'Evidence', label: 'Source-grounded answers' },
  { value: 'Choice', label: 'Model flexibility' },
  { value: 'Governance', label: 'Human oversight' },
]

const problemCards = [
  { kicker: 'Data control', title: 'Sensitive knowledge may not belong in public AI tools.', desc: 'Organizations need practical ways to use AI without casually moving confidential information outside approved environments.' },
  { kicker: 'Shadow AI', title: 'Employees adopt tools faster than governance can respond.', desc: 'Blocking every tool may reduce productivity, but unmanaged usage creates security, privacy, and policy exposure.' },
  { kicker: 'Fragmentation', title: 'Company intelligence is scattered across systems and teams.', desc: 'Documents, tickets, meetings, policies, and decisions are difficult to search together while respecting existing access.' },
  { kicker: 'Economics', title: 'AI cost and dependency can be difficult to predict.', desc: 'Organizations want more choice over models, infrastructure, usage, and the long-term economics of enterprise AI.' },
]

const platformLayers = [
  { kicker: 'Layer 01', title: 'Private AI foundation', desc: 'A repeatable way to deploy and operate approved AI models within customer-controlled infrastructure.', items: ['Model deployment and configuration', 'Administrative controls', 'Usage visibility', 'Upgrade and lifecycle management'] },
  { kicker: 'Layer 02', title: 'Company knowledge', desc: 'A permission-aware intelligence layer that connects AI to approved organizational information.', items: ['Document ingestion', 'Enterprise connectors over time', 'Source citations', 'Identity and access alignment'] },
  { kicker: 'Layer 03', title: 'Business applications', desc: 'Focused workflows that turn private intelligence into measurable operational outcomes.', items: ['Latimere Signal', 'Knowledge assistants', 'Department workflows', 'Future agent-enabled processes'] },
]

const controlCards = [
  { kicker: 'Infrastructure', title: 'Where AI runs', desc: 'Support customer decisions about on-premises, private-cloud, hybrid, and eventually specialized isolated environments.' },
  { kicker: 'Knowledge', title: 'What AI may use', desc: 'Limit retrieval to approved sources and align access with organizational identity and permissions.' },
  { kicker: 'Models', title: 'Which intelligence is deployed', desc: 'Remain model-aware and flexible rather than locking the customer to one public API or model family.' },
  { kicker: 'Governance', title: 'How output is reviewed', desc: 'Use auditability, citations, administrative policy, and human approval where business risk requires it.' },
]

const deploymentModels = [
  { kicker: 'Model 01', title: 'Customer on-premises', status: 'Design objective', desc: 'Deploy within infrastructure physically or operationally controlled by the customer.' },
  { kicker: 'Model 02', title: 'Customer private cloud', status: 'Design objective', desc: 'Operate within a dedicated cloud environment governed by the customer’s identity, networking, and security controls.' },
  { kicker: 'Model 03', title: 'Hybrid deployment', status: 'Future direction', desc: 'Let organizations choose which models, data, and workloads remain private and which approved services may be used externally.' },
]

const signalBenefits = [
  { kicker: 'Reporting', title: 'Executive-ready outputs', desc: 'Turn approved evidence into leadership summaries, health views, decisions, risks, and action-oriented reporting.' },
  { kicker: 'Institutional memory', title: 'Searchable program history', desc: 'Preserve what was discussed, decided, assigned, and changed across the life of a program.' },
  { kicker: 'Trust', title: 'Evidence before assertion', desc: 'Show the sources behind important claims and require human review before publishing.' },
  { kicker: 'Private deployment', title: 'A stronger governance story', desc: 'Apply Signal to sensitive program information through the same customer-controlled foundation as Vault.' },
]

const signalRows = [
  { title: 'What changed', desc: 'Vendor migration moved from planned to at risk after the readiness review.', source: 'Sources: readiness meeting, Jira dependency, decision log' },
  { title: 'Leadership decision', desc: 'Approve regional sequencing by Friday to protect the launch window.', source: 'Sources: steering committee notes, open decision #24' },
  { title: 'Program memory', desc: 'The current approach was selected after the May architecture review.', source: 'Sources: architecture review, approved design record' },
]

const partnerItems = [
  { title: 'Real use case', desc: 'Identify a specific business problem where private AI could create measurable value.' },
  { title: 'Business and technical contacts', desc: 'Include people who understand the desired outcome and the deployment or security requirements.' },
  { title: 'Structured participation', desc: 'Join recurring feedback sessions and help define acceptance criteria for a prototype or pilot.' },
  { title: 'Preferred pilot path', desc: 'Receive early access, founder-led support, and preferred commercial terms if the fit is validated.' },
]

const targetRoles = [
  { kicker: 'Technology', title: 'CIOs, CTOs, and IT leaders', desc: 'Leaders responsible for enterprise platforms, AI strategy, infrastructure, and technology adoption.' },
  { kicker: 'Security', title: 'CISOs and security leaders', desc: 'Leaders defining acceptable data handling, identity, audit, risk, and third-party requirements.' },
  { kicker: 'Architecture', title: 'Infrastructure and enterprise architects', desc: 'Practitioners evaluating models, GPUs, private cloud, networking, integrations, and operating models.' },
  { kicker: 'Business', title: 'AI, knowledge, and operations leaders', desc: 'Owners of high-value workflows who can define where secure AI should produce a measurable result.' },
]

const roadmapSteps = [
  { title: 'Customer discovery', status: 'Current', desc: 'Interview qualified leaders to understand restrictions, use cases, buying processes, deployment preferences, and security requirements.' },
  { title: 'Design partner selection', status: 'Next', desc: 'Select organizations with urgent problems, credible sponsorship, technical fit, and willingness to participate.' },
  { title: 'Controlled prototype', status: 'Planned', desc: 'Build a narrow private knowledge assistant around one validated use case and explicit acceptance criteria.' },
  { title: 'Security and architecture review', status: 'Planned', desc: 'Use qualified external specialists to review threat models, dependencies, deployment, recovery, and controls.' },
  { title: 'Paid pilot', status: 'Goal', desc: 'Deploy with one customer, prove a defined business outcome, document the implementation, and make the process repeatable.' },
]

const engagementCards = [
  { title: 'Research session', price: '$25 thank-you', desc: 'A 25–30 minute conversation about your organization’s AI goals, constraints, and requirements.', highlight: false, items: ['No product purchase required', 'For qualified business participants', 'Structured research questions', 'Gift card after completed session'] },
  { title: 'Design partner', price: 'Collaborative', desc: 'A selective relationship for organizations willing to shape the product and define a credible pilot.', highlight: true, items: ['Recurring product sessions', 'Early prototype access', 'Roadmap input', 'Preferred pilot terms'] },
  { title: 'Future pilot', price: 'Scope based', desc: 'A controlled paid engagement after use case, architecture, requirements, and success measures are validated.', highlight: false, items: ['Defined deployment scope', 'Approved data sources', 'Acceptance criteria', 'Implementation and support plan'] },
]

const honestyCards = [
  { kicker: 'Current', title: 'Research and product definition', desc: 'Customer interviews, requirements gathering, use-case selection, and design partner recruitment.' },
  { kicker: 'Prototype', title: 'Demonstrated but not production certified', desc: 'Capabilities that can be shown in a controlled environment but have not completed enterprise validation.' },
  { kicker: 'Planned', title: 'Prioritized roadmap capability', desc: 'Functionality selected for development based on validated customer requirements.' },
  { kicker: 'Future', title: 'Long-term product direction', desc: 'Capabilities under consideration that should not yet be treated as a commitment or current feature.' },
]

const faqItems = [
  { q: 'Is Latimere Vault available for production deployment today?', a: 'No. Vault is currently in customer discovery and early product definition. We are recruiting research participants and potential design partners before finalizing the first deployable version.' },
  { q: 'What do you mean by private AI?', a: 'We mean AI designed around customer control of deployment, approved data, identity, permissions, model choices, and governance. The exact architecture may be on-premises, private cloud, or hybrid depending on validated requirements.' },
  { q: 'Is this only an on-premises hardware appliance?', a: 'No. We are not beginning with proprietary hardware. The initial direction is a software-led platform deployable on appropriate customer or partner infrastructure.' },
  { q: 'Will Latimere train its own foundation model?', a: 'Not initially. The plan is to use suitable existing models and differentiate through secure deployment, knowledge access, administration, governance, workflow applications, and customer experience.' },
  { q: 'How does Latimere Signal fit?', a: 'Signal is the first proposed business application on top of Vault. It applies private organizational intelligence to reporting, risks, decisions, leadership updates, and institutional memory.' },
  { q: 'What is expected from a design partner?', a: 'A real use case, business and technical participation, periodic feedback, help defining acceptance criteria, and willingness to evaluate a controlled prototype or pilot.' },
  { q: 'Does the research gift card guarantee participation?', a: 'No. The $25 Starbucks gift card is intended for qualified participants who schedule and complete the research session. Eligibility and scheduling are confirmed before the interview.' },
  { q: 'Are security certifications already in place?', a: 'No. We will not claim certifications or formal enterprise controls before they exist. External security review and evidence-based validation are part of the path toward a sellable pilot.' },
]

const contactProof = [
  { title: 'Best research participant', desc: 'A leader involved in AI strategy, security, infrastructure, governance, knowledge, or operational adoption.' },
  { title: 'Best design partner', desc: 'An organization with a specific private-AI problem, internal sponsorship, and a realistic path to a pilot.' },
  { title: 'Best first use case', desc: 'A narrow workflow with approved data, measurable value, and requirements that can be validated safely.' },
]

const leadModes: { value: LeadMode; label: string }[] = [
  { value: 'research', label: 'Research' },
  { value: 'partner', label: 'Design partner' },
  { value: 'pilot', label: 'Future pilot' },
]

const companySizeOptions = [
  { value: '1_199', label: '1–199 employees' },
  { value: '200_999', label: '200–999 employees' },
  { value: '1000_4999', label: '1,000–4,999 employees' },
  { value: '5000_plus', label: '5,000+ employees' },
]

const industryOptions = [
  { value: 'professional_services', label: 'Professional services / legal' },
  { value: 'healthcare', label: 'Healthcare / health administration' },
  { value: 'financial_services', label: 'Financial services / insurance' },
  { value: 'manufacturing', label: 'Manufacturing / engineering' },
  { value: 'government_contractor', label: 'Government contractor / defense-adjacent' },
  { value: 'technology', label: 'Technology / software' },
  { value: 'other', label: 'Other' },
]

const aiStatusOptions = [
  { value: 'exploring', label: 'Exploring options' },
  { value: 'limited_public_tools', label: 'Limited public AI use' },
  { value: 'formal_pilot', label: 'Running formal AI pilots' },
  { value: 'private_ai_evaluation', label: 'Evaluating private AI' },
  { value: 'production', label: 'AI in production' },
]

const deploymentOptions = [
  { value: 'on_prem', label: 'On-premises' },
  { value: 'private_cloud', label: 'Private cloud' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'undecided', label: 'Undecided / need guidance' },
]

const concernOptions = [
  { value: 'data_privacy', label: 'Data privacy / confidentiality' },
  { value: 'security', label: 'Security and access control' },
  { value: 'compliance', label: 'Compliance / auditability' },
  { value: 'cost', label: 'Cost and usage predictability' },
  { value: 'vendor_dependency', label: 'Vendor dependency / model choice' },
  { value: 'knowledge_access', label: 'Access to fragmented knowledge' },
]

const timelineOptions = [
  { value: '0_3_months', label: 'Within 3 months' },
  { value: '3_6_months', label: '3–6 months' },
  { value: '6_12_months', label: '6–12 months' },
  { value: 'research_only', label: 'Researching / no set timeline' },
]