import React from 'react'
import Head from 'next/head'

type InquiryType = 'strategy' | 'assessment' | 'implementation' | 'executive'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://latimere.com'

const services = [
  {
    number: '01',
    title: 'AI Strategy & Executive Advisory',
    body: 'Turn uncertainty into a practical enterprise AI strategy. We help leadership teams define where AI matters, what to prioritize, how to govern it, and how to measure value.',
    outcome: 'Clear priorities, investment decisions, governance, and an executable roadmap.',
  },
  {
    number: '02',
    title: 'AI Opportunity & Value Assessment',
    body: 'We examine workflows across the business, identify high-value AI opportunities, and prioritize them by business impact, feasibility, risk, effort, and time-to-value.',
    outcome: 'A ranked portfolio of use cases with estimated value and recommended next steps.',
  },
  {
    number: '03',
    title: 'AI Implementation & Pilots',
    body: 'We move the strongest opportunities from concept into real workflows—coordinating business, data, technology, security, vendors, change, and implementation.',
    outcome: 'Working solutions tied to measurable business outcomes—not endless experimentation.',
  },
  {
    number: '04',
    title: 'AI Adoption & Value Realization',
    body: 'Technology creates value only when people use it. We help organizations redesign work, drive adoption, measure results, and continuously improve deployed AI capabilities.',
    outcome: 'Sustained adoption, measurable ROI, and a repeatable model for scaling AI.',
  },
]

const principles = [
  {
    title: 'Business value first',
    body: 'We start with the business problem and economics—not the technology trend.',
  },
  {
    title: 'Vendor independent',
    body: 'Our job is to recommend what is right for your organization, not to force a preferred platform.',
  },
  {
    title: 'Practical over theoretical',
    body: 'Strategy should lead to decisions, pilots, implementation, adoption, and measurable results.',
  },
  {
    title: 'Transparent by design',
    body: 'Clear assumptions, clear tradeoffs, clear ownership, and no black-box consulting theater.',
  },
]

const process = [
  {
    step: 'Discover',
    title: 'Understand the business',
    body: 'We learn your strategy, workflows, pain points, AI activity, data realities, technology landscape, governance constraints, and desired outcomes.',
  },
  {
    step: 'Prioritize',
    title: 'Find where AI can matter most',
    body: 'Opportunities are evaluated against business impact, feasibility, risk, cost, organizational readiness, and speed to value.',
  },
  {
    step: 'Build',
    title: 'Turn priorities into working solutions',
    body: 'We help design and implement the right operating model, workflows, technology, controls, and pilots.',
  },
  {
    step: 'Realize',
    title: 'Measure, adopt, and scale',
    body: 'We track outcomes, improve adoption, capture lessons, and scale what proves valuable.',
  },
]

const faq = [
  {
    question: 'What does Latimere Advisory actually do?',
    answer:
      'We help organizations decide where AI can create meaningful business value and then help turn those opportunities into real outcomes. Engagements can include strategy, use-case prioritization, value assessment, implementation planning, pilots, governance, adoption, and ongoing executive advisory.',
  },
  {
    question: 'Do we need to already have an AI strategy?',
    answer:
      'No. Some clients are starting from the beginning; others already have tools, pilots, or an AI program in place. We meet you where you are and focus on the decisions and outcomes that matter next.',
  },
  {
    question: 'Are you tied to a specific AI vendor or platform?',
    answer:
      'No. Latimere is vendor independent. We evaluate tools and approaches based on your business requirements, existing environment, risk profile, economics, and long-term needs.',
  },
  {
    question: 'Will you only give us a strategy deck?',
    answer:
      'No. We believe strategy should lead to action. Latimere can stay involved through prioritization, pilot design, implementation coordination, adoption, measurement, and scaling.',
  },
  {
    question: 'Who is the best fit for Latimere?',
    answer:
      'We are best suited for leadership teams that believe AI can materially improve their business but want a clearer path from experimentation to measurable results. We are especially useful where AI decisions cross business, technology, data, security, operating-model, and change-management boundaries.',
  },
  {
    question: 'What is the best way to start?',
    answer:
      'For many organizations, the strongest starting point is an AI Opportunity & Value Assessment. If your need is more specific, we can begin with a focused executive conversation and recommend the smallest useful next step.',
  },
  {
    question: 'Do you work with internal technology teams?',
    answer:
      'Yes. Our goal is to strengthen the client organization, not work around it. We collaborate with business leaders, IT, data, security, legal, HR, finance, transformation teams, and existing implementation partners.',
  },
  {
    question: 'What happens after I contact you?',
    answer:
      'We start with a short fit conversation. If there is a meaningful problem we can help solve, we will define the objective, scope, expected outcomes, working model, and commercial approach before any engagement begins.',
  },
]

export default function LatimereAdvisoryLanding() {
  return (
    <>
      <Head>
        <title>Latimere Advisory | Turn AI Into Business Value</title>
        <meta
          name="description"
          content="Latimere Advisory helps organizations identify, implement, and scale high-value AI opportunities—from strategy and prioritization through implementation, adoption, and measurable value realization."
        />
        <link rel="canonical" href={`${appUrl}/`} />
        <meta name="robots" content="index,follow" />

        <meta property="og:title" content="Latimere Advisory | Turn AI Into Business Value" />
        <meta
          property="og:description"
          content="Independent AI advisory for leaders who want clear priorities, practical implementation, and measurable business outcomes."
        />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={`${appUrl}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico?v=4" />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#9ce8ff] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#071018]"
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-[#071018] text-white selection:bg-[#8ee7ff]/30">
        <SiteNav />

        <main id="main">
          <HeroSection />
          <TrustStrip />
          <ChallengeSection />
          <ServicesSection />
          <AssessmentSection />
          <ApproachSection />
          <WhyLatimereSection />
          <FutureSection />
          <FaqSection />
          <ContactSection />
        </main>

        <SiteFooter />
      </div>
    </>
  )
}

function SiteNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#071018]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="group inline-flex items-center gap-3"
          aria-label="Latimere Advisory home"
        >
          <BrandMark />
          <div className="leading-none">
            <div className="text-[15px] font-semibold tracking-[0.22em] text-white">LATIMERE</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.27em] text-slate-400">
              Advisory
            </div>
          </div>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          <NavLink href="#services">Services</NavLink>
          <NavLink href="#approach">Approach</NavLink>
          <NavLink href="#why-latimere">Why Latimere</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
          <a
            href="#contact"
            className="rounded-full bg-[#9ce8ff] px-5 py-2.5 text-sm font-semibold text-[#071018] transition hover:bg-white"
          >
            Start a conversation
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0.5 h-px w-5 bg-current transition ${
                open ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-px w-5 bg-current transition ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[13px] h-px w-5 bg-current transition ${
                open ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/[0.08] bg-[#071018] px-4 py-5 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {[
              ['Services', '#services'],
              ['Approach', '#approach'],
              ['Why Latimere', '#why-latimere'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-200 hover:bg-white/[0.05]"
              >
                {label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-[#9ce8ff] px-4 py-3 text-center text-sm font-semibold text-[#071018]"
            >
              Start a conversation
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function HeroSection() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_12%,rgba(142,231,255,0.13),transparent_31%),radial-gradient(circle_at_10%_55%,rgba(33,94,117,0.16),transparent_31%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.17] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <div className="mx-auto grid min-h-[760px] max-w-7xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9ce8ff]/20 bg-[#9ce8ff]/[0.06] px-3.5 py-2 text-xs font-medium tracking-wide text-[#c8f3ff]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9ce8ff]" />
            AI strategy · implementation · value realization
          </div>

          <h1 className="mt-7 max-w-4xl text-[3.2rem] font-medium leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.25rem]">
            Turn AI into
            <span className="block text-[#9ce8ff]">business advantage.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
            Latimere Advisory helps leadership teams identify where AI can create real value,
            turn the strongest opportunities into working solutions, and build the capabilities
            to scale what works.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="#contact">Start a conversation</PrimaryLink>
            <SecondaryLink href="#assessment">Explore the AI assessment</SecondaryLink>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-6 text-slate-500">
            Independent advice. Practical implementation. Clear business outcomes.
          </p>
        </div>

        <ValueMap />
      </div>
    </section>
  )
}

function ValueMap() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-[#5edcff]/[0.07] blur-3xl" />

      <div className="overflow-hidden rounded-[2rem] border border-white/[0.11] bg-[#0a151f]/95 shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#88e5ff]">
              Latimere AI Value Map
            </div>
            <div className="mt-1.5 text-sm font-medium text-white">
              From possibilities to priorities
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] text-slate-400">
            Executive view
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Opportunities identified" value="24" />
            <MetricCard label="Priority candidates" value="6" />
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-300">Opportunity portfolio</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Value × feasibility
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <OpportunityBar label="Customer service automation" score="High value" width="92%" />
              <OpportunityBar label="Knowledge & document intelligence" score="High value" width="84%" />
              <OpportunityBar label="Finance workflow automation" score="Strong" width="76%" />
              <OpportunityBar label="Sales research & preparation" score="Strong" width="68%" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['01', 'Discover'],
              ['02', 'Prioritize'],
              ['03', 'Execute'],
            ].map(([number, label]) => (
              <div
                key={number}
                className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3"
              >
                <div className="text-[10px] font-semibold tracking-[0.18em] text-[#88e5ff]">
                  {number}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
      <div className="text-2xl font-medium tracking-[-0.03em] text-white">{value}</div>
      <div className="mt-1 text-[11px] leading-5 text-slate-500">{label}</div>
    </div>
  )
}

function OpportunityBar({
  label,
  score,
  width,
}: {
  label: string
  score: string
  width: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate text-slate-300">{label}</span>
        <span className="shrink-0 text-slate-500">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3fb9de] to-[#9ce8ff]"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section className="border-y border-white/[0.08] bg-white/[0.018]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/[0.07] px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {[
          ['Independent', 'Vendor-neutral guidance'],
          ['Outcome-led', 'Value before technology'],
          ['End-to-end', 'Strategy through adoption'],
          ['Executive-ready', 'Clear decisions and accountability'],
        ].map(([title, body]) => (
          <div key={title} className="px-4 py-6 text-center sm:px-6">
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1.5 text-xs leading-5 text-slate-500">{body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ChallengeSection() {
  return (
    <section className="border-b border-white/[0.08]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="The challenge"
          title="The question is no longer whether AI matters."
          body="The harder question is where it can create meaningful value for your organization—and how to move from scattered experiments to durable business results."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            [
              'Too many possibilities',
              'Leaders see hundreds of potential use cases but lack a disciplined way to decide what is worth pursuing.',
            ],
            [
              'Experiments without outcomes',
              'Pilots often demonstrate technical capability without proving measurable operational or financial value.',
            ],
            [
              'Fragmented ownership',
              'AI spans business, technology, data, security, legal, workforce, and change—often without one integrated plan.',
            ],
            [
              'Pressure to move now',
              'Organizations need to learn quickly without creating unnecessary cost, risk, technical debt, or organizational confusion.',
            ],
          ].map(([title, body]) => (
            <InsightCard key={title} title={title} body={body} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ServicesSection() {
  return (
    <section id="services" className="border-b border-white/[0.08] bg-[#09131d]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionIntro
            eyebrow="How we help"
            title="From AI ambition to measurable value."
            body="Latimere works across the decisions that determine whether AI becomes another experiment—or a durable source of competitive advantage."
          />
          <p className="max-w-xl text-sm leading-7 text-slate-400 lg:justify-self-end">
            Engagements are shaped around the problem you need to solve. We can advise,
            assess, design, coordinate implementation, and help measure results without
            forcing a one-size-fits-all transformation program.
          </p>
        </div>

        <div className="mt-14 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {services.map((service) => (
            <article
              key={service.number}
              className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[90px_1fr_1fr] md:gap-8 md:py-10"
            >
              <div className="text-xs font-semibold tracking-[0.2em] text-[#83ddf8]">
                {service.number}
              </div>
              <div>
                <h3 className="text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
                  {service.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">{service.body}</p>
              </div>
              <div className="md:pl-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Typical outcome
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{service.outcome}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function AssessmentSection() {
  return (
    <section id="assessment" className="border-b border-white/[0.08]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="overflow-hidden rounded-[2rem] border border-[#8ee7ff]/15 bg-[linear-gradient(135deg,rgba(142,231,255,0.08),rgba(255,255,255,0.025)_45%,rgba(255,255,255,0.015))]">
          <div className="grid grid-cols-1 gap-10 p-6 sm:p-10 lg:grid-cols-[0.92fr_1.08fr] lg:p-14">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ee7ff]">
                A practical place to begin
              </div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                AI Opportunity & Value Assessment
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                A focused engagement designed to answer one executive question:
                <span className="font-medium text-white"> where should we use AI first?</span>
              </p>

              <div className="mt-8">
                <PrimaryLink href="#contact">Discuss an assessment</PrimaryLink>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Current-state review', 'Understand existing AI activity, priorities, constraints, and readiness.'],
                ['Workflow discovery', 'Identify time-intensive, repetitive, decision-heavy, and knowledge-intensive work.'],
                ['Use-case portfolio', 'Develop and structure the most relevant AI opportunities across the business.'],
                ['Value prioritization', 'Score opportunities by impact, feasibility, risk, effort, and time-to-value.'],
                ['Executive roadmap', 'Define sequencing, owners, decisions, pilots, enabling capabilities, and next steps.'],
                ['Value case', 'Clarify expected benefits, assumptions, measurement approach, and what success should mean.'],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.08] bg-[#071018]/55 p-5"
                >
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 border-t border-white/[0.08] sm:grid-cols-3">
            {[
              ['Built for leaders', 'Designed to support investment and prioritization decisions.'],
              ['Evidence over hype', 'Recommendations are tied to workflows, economics, constraints, and readiness.'],
              ['Actionable by design', 'The output ends with a practical path forward—not a generic AI vision.'],
            ].map(([title, body], index) => (
              <div
                key={title}
                className={`p-6 sm:p-7 ${
                  index > 0 ? 'border-t border-white/[0.08] sm:border-l sm:border-t-0' : ''
                }`}
              >
                <div className="text-sm font-semibold text-white">{title}</div>
                <p className="mt-2 text-xs leading-6 text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ApproachSection() {
  return (
    <section id="approach" className="border-b border-white/[0.08] bg-white/[0.012]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="Our approach"
          title="Simple enough to explain. Rigorous enough to scale."
          body="We use a disciplined progression from business understanding to prioritized opportunities, implementation, adoption, and measurable value."
        />

        <div className="relative mt-14 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-[30px] hidden h-px bg-gradient-to-r from-transparent via-[#8ee7ff]/30 to-transparent lg:block" />

          {process.map((item, index) => (
            <div
              key={item.step}
              className="relative rounded-[1.5rem] border border-white/[0.09] bg-[#09131d] p-6"
            >
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#8ee7ff]/25 bg-[#8ee7ff]/[0.07] text-xs font-semibold text-[#a9efff]">
                {index + 1}
              </div>
              <div className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8ee7ff]">
                {item.step}
              </div>
              <h3 className="mt-2 text-lg font-medium text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyLatimereSection() {
  return (
    <section id="why-latimere" className="border-b border-white/[0.08]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20 lg:px-8 lg:py-28">
        <div>
          <SectionIntro
            eyebrow="Why Latimere"
            title="Advice should be clear, independent, and built to create value."
            body="We are building Latimere around a simple belief: emerging technology should be translated into better business decisions—not complexity for its own sake."
          />

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-sm leading-7 text-slate-300">
              We will tell you when an opportunity is compelling, when more evidence is needed,
              and when AI is not the right answer. Trust matters more than forcing a project.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.7rem] border border-white/[0.09] bg-white/[0.09] sm:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle.title} className="bg-[#09131d] p-6 sm:p-7">
              <CheckIcon />
              <h3 className="mt-5 text-lg font-medium text-white">{principle.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{principle.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FutureSection() {
  return (
    <section className="border-b border-white/[0.08] bg-[#09131d]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ee7ff]">
              Built for what comes next
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-medium leading-tight tracking-[-0.045em] text-white sm:text-5xl">
              AI is the beginning of a much larger transformation.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
              Latimere is focused today on helping organizations create value from AI. As
              intelligent systems evolve—from copilots to agents, autonomous workflows, and
              eventually physical intelligence—we intend to help clients make sense of what
              matters and act with confidence.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500">
              Our commitment is durable even as the technology changes: understand the business,
              separate signal from hype, and turn emerging capability into real advantage.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/[0.09] bg-[#071018] p-6 sm:p-8">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              The horizon
            </div>
            <div className="mt-6 space-y-5">
              {[
                ['Now', 'AI strategy, enterprise adoption, implementation, and value realization'],
                ['Next', 'Agentic workflows, autonomous operations, and intelligent decision systems'],
                ['Future', 'Physical AI, robotics, and human-machine operating models'],
              ].map(([label, body], index) => (
                <div key={label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full border border-[#8ee7ff]/70 bg-[#8ee7ff]/20" />
                    {index < 2 && <div className="mt-2 h-full w-px bg-white/[0.08]" />}
                  </div>
                  <div className="pb-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8ee7ff]">
                      {label}
                    </div>
                    <p className="mt-1.5 text-sm leading-7 text-slate-300">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="faq" className="border-b border-white/[0.08]">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ee7ff]">
            Frequently asked questions
          </div>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] text-white sm:text-5xl">
            Clear answers before we ever talk.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
            We want potential clients to understand how we work, what we do, and what to expect.
          </p>
        </div>

        <div className="mt-12 divide-y divide-white/[0.08] border-y border-white/[0.08]">
          {faq.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-base font-medium text-white sm:text-lg">{question}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-slate-400 transition ${
            open ? 'rotate-45' : ''
          }`}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && <p className="max-w-3xl pb-7 pr-12 text-sm leading-7 text-slate-400">{answer}</p>}
    </div>
  )
}

function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(142,231,255,0.08),transparent_30%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 rounded-[2rem] border border-white/[0.1] bg-[#09131d] p-6 shadow-2xl shadow-black/20 sm:p-10 lg:grid-cols-[0.88fr_1.12fr] lg:p-14">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ee7ff]">
              Start a conversation
            </div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.045em] text-white sm:text-5xl">
              Where could AI create the most value in your business?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Tell us what you are trying to accomplish. We will review the context and start
              with a focused conversation about whether Latimere can help.
            </p>

            <div className="mt-8 space-y-4">
              {[
                'No pressure to buy a transformation program.',
                'No requirement to have your AI strategy figured out.',
                'No obligation to use a specific technology platform.',
              ].map((item) => (
                <div key={item} className="flex gap-3 text-sm leading-6 text-slate-400">
                  <CheckIcon small />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-white/[0.08] pt-6">
              <div className="text-xs text-slate-500">Prefer email?</div>
              <a
                href="mailto:taylor@latimere.com"
                className="mt-1 inline-block text-sm font-medium text-white underline decoration-white/25 underline-offset-4 transition hover:decoration-[#8ee7ff]"
              >
                taylor@latimere.com
              </a>
            </div>
          </div>

          <LeadForm />
        </div>
      </div>
    </section>
  )
}

function LeadForm() {
  const [inquiryType, setInquiryType] = React.useState<InquiryType>('assessment')
  const [status, setStatus] = React.useState<SubmitStatus>('idle')
  const [message, setMessage] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [companySize, setCompanySize] = React.useState('')
  const [challenge, setChallenge] = React.useState('')
  const [aiStage, setAiStage] = React.useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!name || !email || !company || !challenge) {
      setStatus('error')
      setMessage('Please provide your name, work email, company, and what you would like help with.')
      return
    }

    setStatus('submitting')

    const payload = {
      name,
      email,
      mode: inquiryType,
      topic: `Latimere Advisory — ${inquiryLabel(inquiryType)}`,
      enterprise: {
        company,
        role,
        companySize,
        useCase: challenge,
        restriction: aiStage,
      },
      advisory: {
        inquiryType,
        company,
        role,
        companySize,
        aiStage,
        challenge,
      },
      wallet: null,
      meta: {
        page: 'latimere-advisory-landing',
        ts: Date.now(),
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      },
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await safeJson(response)

      if (!response.ok) {
        throw new Error((data as any)?.dev?.message || 'Submission failed')
      }

      setStatus('success')
      setMessage(
        'Thank you. We received your note and will follow up with the most useful next step.'
      )
      setName('')
      setEmail('')
      setCompany('')
      setRole('')
      setCompanySize('')
      setChallenge('')
      setAiStage('')
    } catch (error) {
      console.error('Latimere Advisory lead submission failed', error)
      setStatus('error')
      setMessage('We could not submit your request. Please try again or email taylor@latimere.com.')
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.6rem] border border-white/[0.1] bg-[#071018] p-5 sm:p-7"
      aria-label="Latimere Advisory inquiry form"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-white">I would like help with</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['assessment', 'AI assessment'],
            ['strategy', 'AI strategy'],
            ['implementation', 'Implementation'],
            ['executive', 'Executive advisory'],
          ] as [InquiryType, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setInquiryType(value)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition sm:text-sm ${
                inquiryType === value
                  ? 'border-[#9ce8ff]/60 bg-[#9ce8ff] text-[#071018]'
                  : 'border-white/[0.09] bg-white/[0.025] text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name *" value={name} onChange={setName} placeholder="Jordan Taylor" />
        <Field
          label="Work email *"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          type="email"
        />
        <Field
          label="Company *"
          value={company}
          onChange={setCompany}
          placeholder="Northstar Industries"
        />
        <Field label="Role" value={role} onChange={setRole} placeholder="CEO / COO / CIO / VP" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Company size"
          value={companySize}
          onChange={setCompanySize}
          options={[
            'Under 100 employees',
            '100–499 employees',
            '500–999 employees',
            '1,000–4,999 employees',
            '5,000+ employees',
          ]}
        />
        <SelectField
          label="Where are you with AI today?"
          value={aiStage}
          onChange={setAiStage}
          options={[
            'Exploring where to begin',
            'Using individual AI tools',
            'Running pilots / proofs of concept',
            'Scaling AI across functions',
            'Established enterprise AI program',
          ]}
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-white">
          What would you like to accomplish? *
        </label>
        <textarea
          value={challenge}
          onChange={(event) => setChallenge(event.target.value)}
          rows={5}
          placeholder="Tell us about the business problem, opportunity, or AI decision you are working through."
          className="w-full rounded-xl border border-white/[0.11] bg-white/[0.02] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#9ce8ff]/50 focus:outline-none focus:ring-2 focus:ring-[#9ce8ff]/15"
        />
      </div>

      {message && (
        <div
          className={`mt-4 rounded-xl border px-3.5 py-3 text-sm ${
            status === 'error'
              ? 'border-red-400/25 bg-red-500/[0.08] text-red-200'
              : 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-200'
          }`}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#9ce8ff] px-5 py-3.5 text-sm font-bold text-[#071018] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Request a conversation'}
      </button>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
        We use the information you provide only to respond to your inquiry and evaluate fit.
      </p>
    </form>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050c12]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark small />
              <div>
                <div className="text-sm font-semibold tracking-[0.2em] text-white">LATIMERE</div>
                <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">
                  Advisory
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-lg text-xs leading-6 text-slate-500">
              Helping organizations turn artificial intelligence and emerging technology into
              measurable business advantage.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <a href="#services" className="hover:text-white">
              Services
            </a>
            <a href="#approach" className="hover:text-white">
              Approach
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <a href="mailto:taylor@latimere.com" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/[0.07] pt-6 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Latimere. All rights reserved.</span>
          <span>AI & emerging technology advisory</span>
        </div>
      </div>
    </footer>
  )
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative grid place-items-center rounded-full border border-[#9ce8ff]/30 bg-[#9ce8ff]/[0.06] ${
        small ? 'h-8 w-8' : 'h-9 w-9'
      }`}
      aria-hidden
    >
      <div className="absolute h-[38%] w-[38%] rounded-full border border-[#9ce8ff]/70" />
      <div className="absolute h-px w-[58%] rotate-45 bg-[#9ce8ff]/70" />
      <div className="absolute h-px w-[58%] -rotate-45 bg-[#9ce8ff]/70" />
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-medium text-slate-400 transition hover:text-white">
      {children}
    </a>
  )
}

function SectionIntro({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ee7ff]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-medium leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-slate-400">{body}</p>
    </div>
  )
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/[0.09] bg-white/[0.025] p-6">
      <div className="h-1.5 w-1.5 rounded-full bg-[#8ee7ff]" />
      <h3 className="mt-5 text-base font-medium text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  )
}

function CheckIcon({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[#8ee7ff]/25 bg-[#8ee7ff]/[0.06] text-[#a9efff] ${
        small ? 'mt-0.5 h-5 w-5 text-[10px]' : 'h-8 w-8 text-xs'
      }`}
      aria-hidden
    >
      ✓
    </span>
  )
}

function PrimaryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full bg-[#9ce8ff] px-6 py-3.5 text-sm font-bold text-[#071018] shadow-[0_10px_35px_rgba(94,220,255,0.10)] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#9ce8ff]/70 focus:ring-offset-2 focus:ring-offset-[#071018]"
    >
      {children}
    </a>
  )
}

function SecondaryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-white/[0.13] bg-white/[0.025] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/25 focus:ring-offset-2 focus:ring-offset-[#071018]"
    >
      {children}
    </a>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/[0.11] bg-white/[0.02] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#9ce8ff]/50 focus:outline-none focus:ring-2 focus:ring-[#9ce8ff]/15"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-white">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/[0.11] bg-[#071018] px-3.5 py-3 text-sm text-white focus:border-[#9ce8ff]/50 focus:outline-none focus:ring-2 focus:ring-[#9ce8ff]/15"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function inquiryLabel(type: InquiryType) {
  switch (type) {
    case 'strategy':
      return 'AI Strategy'
    case 'implementation':
      return 'AI Implementation'
    case 'executive':
      return 'Executive Advisory'
    case 'assessment':
    default:
      return 'AI Opportunity & Value Assessment'
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
