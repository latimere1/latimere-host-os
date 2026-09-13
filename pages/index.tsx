import React, { FormEvent, useState } from 'react'
import Head from 'next/head'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Latimere Advisory | Turn AI Into Business Value</title>
        <meta
          name="description"
          content="Latimere Advisory helps organizations identify, implement, and scale high-value AI opportunities—from strategy and prioritization through implementation, adoption, and measurable value realization."
        />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href="https://latimere.com/" />
        <meta property="og:title" content="Latimere Advisory | Turn AI Into Business Value" />
        <meta
          property="og:description"
          content="Independent AI advisory for leaders who want clear priorities, practical implementation, and measurable business outcomes."
        />
        <meta property="og:url" content="https://latimere.com/" />
        <meta property="og:image" content="https://latimere.com/og.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950"
      >
        Skip to content
      </a>

      <div className="min-h-screen bg-[#071018] text-white selection:bg-cyan-300/30">
        <Header />

        <main id="main">
          <Hero />
          <TrustStrip />
          <Challenge />
          <Services />
          <Assessment />
          <Approach />
          <WhyLatimere />
          <Future />
          <Faq />
          <Contact />
        </main>

        <Footer />
      </div>
    </>
  )
}

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071018]/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Latimere Advisory home">
          <BrandMark />
          <div>
            <div className="text-sm font-semibold tracking-[0.22em]">LATIMERE</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Advisory
            </div>
          </div>
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
          <a href="#services" className="text-sm text-slate-400 transition hover:text-white">
            Services
          </a>
          <a href="#approach" className="text-sm text-slate-400 transition hover:text-white">
            Approach
          </a>
          <a href="#why-latimere" className="text-sm text-slate-400 transition hover:text-white">
            Why Latimere
          </a>
          <a href="#faq" className="text-sm text-slate-400 transition hover:text-white">
            FAQ
          </a>
          <a
            href="#contact"
            className="rounded-full bg-cyan-200 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
          >
            Start a conversation
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white lg:hidden"
        >
          <span className="text-xl leading-none">{open ? '×' : '☰'}</span>
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#071018] px-4 py-4 lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col">
            <MobileLink href="#services" onClick={() => setOpen(false)}>Services</MobileLink>
            <MobileLink href="#approach" onClick={() => setOpen(false)}>Approach</MobileLink>
            <MobileLink href="#why-latimere" onClick={() => setOpen(false)}>Why Latimere</MobileLink>
            <MobileLink href="#faq" onClick={() => setOpen(false)}>FAQ</MobileLink>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-xl bg-cyan-200 px-4 py-3 text-center text-sm font-semibold text-slate-950"
            >
              Start a conversation
            </a>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(103,232,249,0.12),transparent_32%),radial-gradient(circle_at_10%_60%,rgba(14,116,144,0.12),transparent_30%)]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 lg:min-h-[760px] lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/5 px-3.5 py-2 text-xs font-medium text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
            AI strategy · implementation · value realization
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Turn AI into
            <span className="block text-cyan-200">business advantage.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Latimere Advisory helps leadership teams identify where AI can create real value,
            turn the strongest opportunities into working solutions, and build the capabilities
            to scale what works.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="#contact">Start a conversation</PrimaryLink>
            <SecondaryLink href="#assessment">Explore the AI assessment</SecondaryLink>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Independent advice. Practical implementation. Clear business outcomes.
          </p>
        </div>

        <ValuePanel />
      </div>
    </section>
  )
}

function ValuePanel() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a151f] shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Latimere AI Value Map
            </div>
            <div className="mt-1.5 text-sm font-medium">From possibilities to priorities</div>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-400">
            Executive view
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            <Metric value="24" label="Opportunities identified" />
            <Metric value="6" label="Priority candidates" />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-slate-300">Opportunity portfolio</span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                Value × feasibility
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <Progress label="Customer service automation" note="High value" width="92%" />
              <Progress label="Knowledge & document intelligence" note="High value" width="84%" />
              <Progress label="Finance workflow automation" note="Strong" width="76%" />
              <Progress label="Sales research & preparation" note="Strong" width="68%" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStep number="01" label="Discover" />
            <MiniStep number="02" label="Prioritize" />
            <MiniStep number="03" label="Execute" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section className="border-b border-white/10 bg-white/[0.015]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        <TrustItem title="Independent" body="Vendor-neutral guidance" />
        <TrustItem title="Outcome-led" body="Value before technology" />
        <TrustItem title="End-to-end" body="Strategy through adoption" />
        <TrustItem title="Executive-ready" body="Clear decisions and accountability" />
      </div>
    </section>
  )
}

function Challenge() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="The challenge"
          title="The question is no longer whether AI matters."
          body="The harder question is where it can create meaningful value for your organization—and how to move from scattered experiments to durable business results."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card
            title="Too many possibilities"
            body="Leaders see hundreds of potential use cases but lack a disciplined way to decide what is worth pursuing."
          />
          <Card
            title="Experiments without outcomes"
            body="Pilots often demonstrate technical capability without proving measurable operational or financial value."
          />
          <Card
            title="Fragmented ownership"
            body="AI spans business, technology, data, security, legal, workforce, and change—often without one integrated plan."
          />
          <Card
            title="Pressure to move now"
            body="Organizations need to learn quickly without creating unnecessary cost, risk, technical debt, or organizational confusion."
          />
        </div>
      </div>
    </section>
  )
}

function Services() {
  return (
    <section id="services" className="border-b border-white/10 bg-[#09131d]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="How we help"
          title="From AI ambition to measurable value."
          body="Latimere works across the decisions that determine whether AI becomes another experiment—or a durable source of competitive advantage."
        />

        <div className="mt-14 divide-y divide-white/10 border-y border-white/10">
          <ServiceRow
            number="01"
            title="AI Strategy & Executive Advisory"
            body="Turn uncertainty into a practical enterprise AI strategy. We help leadership teams define where AI matters, what to prioritize, how to govern it, and how to measure value."
            outcome="Clear priorities, investment decisions, governance, and an executable roadmap."
          />
          <ServiceRow
            number="02"
            title="AI Opportunity & Value Assessment"
            body="We examine workflows across the business, identify high-value AI opportunities, and prioritize them by business impact, feasibility, risk, effort, and time-to-value."
            outcome="A ranked portfolio of use cases with estimated value and recommended next steps."
          />
          <ServiceRow
            number="03"
            title="AI Implementation & Pilots"
            body="We move the strongest opportunities from concept into real workflows—coordinating business, data, technology, security, vendors, change, and implementation."
            outcome="Working solutions tied to measurable business outcomes—not endless experimentation."
          />
          <ServiceRow
            number="04"
            title="AI Adoption & Value Realization"
            body="Technology creates value only when people use it. We help organizations redesign work, drive adoption, measure results, and continuously improve deployed AI capabilities."
            outcome="Sustained adoption, measurable ROI, and a repeatable model for scaling AI."
          />
        </div>
      </div>
    </section>
  )
}

function Assessment() {
  return (
    <section id="assessment" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="overflow-hidden rounded-[2rem] border border-cyan-200/15 bg-cyan-200/[0.035]">
          <div className="grid grid-cols-1 gap-10 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                A practical place to begin
              </div>
              <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
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
              <AssessmentCard
                title="Current-state review"
                body="Understand existing AI activity, priorities, constraints, and readiness."
              />
              <AssessmentCard
                title="Workflow discovery"
                body="Identify time-intensive, repetitive, decision-heavy, and knowledge-intensive work."
              />
              <AssessmentCard
                title="Use-case portfolio"
                body="Develop and structure the most relevant AI opportunities across the business."
              />
              <AssessmentCard
                title="Value prioritization"
                body="Score opportunities by impact, feasibility, risk, effort, and time-to-value."
              />
              <AssessmentCard
                title="Executive roadmap"
                body="Define sequencing, owners, decisions, pilots, enabling capabilities, and next steps."
              />
              <AssessmentCard
                title="Value case"
                body="Clarify expected benefits, assumptions, measurement approach, and what success should mean."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Approach() {
  return (
    <section id="approach" className="border-b border-white/10 bg-white/[0.01]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          eyebrow="Our approach"
          title="Simple enough to explain. Rigorous enough to scale."
          body="We use a disciplined progression from business understanding to prioritized opportunities, implementation, adoption, and measurable value."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <ProcessCard
            number="1"
            eyebrow="Discover"
            title="Understand the business"
            body="We learn your strategy, workflows, pain points, AI activity, data realities, technology landscape, governance constraints, and desired outcomes."
          />
          <ProcessCard
            number="2"
            eyebrow="Prioritize"
            title="Find where AI can matter most"
            body="Opportunities are evaluated against business impact, feasibility, risk, cost, organizational readiness, and speed to value."
          />
          <ProcessCard
            number="3"
            eyebrow="Build"
            title="Turn priorities into working solutions"
            body="We help design and implement the right operating model, workflows, technology, controls, and pilots."
          />
          <ProcessCard
            number="4"
            eyebrow="Realize"
            title="Measure, adopt, and scale"
            body="We track outcomes, improve adoption, capture lessons, and scale what proves valuable."
          />
        </div>
      </div>
    </section>
  )
}

function WhyLatimere() {
  return (
    <section id="why-latimere" className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-28">
        <div>
          <SectionIntro
            eyebrow="Why Latimere"
            title="Advice should be clear, independent, and built to create value."
            body="We are building Latimere around a simple belief: emerging technology should be translated into better business decisions—not complexity for its own sake."
          />

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-sm leading-7 text-slate-300">
              We will tell you when an opportunity is compelling, when more evidence is needed,
              and when AI is not the right answer. Trust matters more than forcing a project.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/10 sm:grid-cols-2">
          <Principle
            title="Business value first"
            body="We start with the business problem and economics—not the technology trend."
          />
          <Principle
            title="Vendor independent"
            body="Our job is to recommend what is right for your organization, not to force a preferred platform."
          />
          <Principle
            title="Practical over theoretical"
            body="Strategy should lead to decisions, pilots, implementation, adoption, and measurable results."
          />
          <Principle
            title="Transparent by design"
            body="Clear assumptions, clear tradeoffs, clear ownership, and no black-box consulting theater."
          />
        </div>
      </div>
    </section>
  )
}

function Future() {
  return (
    <section className="border-b border-white/10 bg-[#09131d]">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Built for what comes next
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-5xl">
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

          <div className="rounded-[1.7rem] border border-white/10 bg-[#071018] p-7">
            <TimelineItem label="Now" body="AI strategy, enterprise adoption, implementation, and value realization" />
            <TimelineItem label="Next" body="Agentic workflows, autonomous operations, and intelligent decision systems" />
            <TimelineItem label="Future" body="Physical AI, robotics, and human-machine operating models" last />
          </div>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="faq" className="border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Frequently asked questions
          </div>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.04em] sm:text-5xl">
            Clear answers before we ever talk.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-400">
            We want potential clients to understand how we work, what we do, and what to expect.
          </p>
        </div>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          <FaqItem
            question="What does Latimere Advisory actually do?"
            answer="We help organizations decide where AI can create meaningful business value and then help turn those opportunities into real outcomes. Engagements can include strategy, use-case prioritization, value assessment, implementation planning, pilots, governance, adoption, and ongoing executive advisory."
          />
          <FaqItem
            question="Do we need to already have an AI strategy?"
            answer="No. Some clients are starting from the beginning; others already have tools, pilots, or an AI program in place. We meet you where you are and focus on the decisions and outcomes that matter next."
          />
          <FaqItem
            question="Are you tied to a specific AI vendor or platform?"
            answer="No. Latimere is vendor independent. We evaluate tools and approaches based on your business requirements, existing environment, risk profile, economics, and long-term needs."
          />
          <FaqItem
            question="Will you only give us a strategy deck?"
            answer="No. We believe strategy should lead to action. Latimere can stay involved through prioritization, pilot design, implementation coordination, adoption, measurement, and scaling."
          />
          <FaqItem
            question="Who is the best fit for Latimere?"
            answer="We are best suited for leadership teams that believe AI can materially improve their business but want a clearer path from experimentation to measurable results."
          />
          <FaqItem
            question="What is the best way to start?"
            answer="For many organizations, the strongest starting point is an AI Opportunity & Value Assessment. If your need is more specific, we can begin with a focused executive conversation and recommend the smallest useful next step."
          />
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 rounded-[2rem] border border-white/10 bg-[#09131d] p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              Start a conversation
            </div>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.045em] sm:text-5xl">
              Where could AI create the most value in your business?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
              Tell us what you are trying to accomplish. We will review the context and start
              with a focused conversation about whether Latimere can help.
            </p>

            <div className="mt-8 space-y-3 text-sm text-slate-400">
              <div className="flex gap-3"><Check />No pressure to buy a transformation program.</div>
              <div className="flex gap-3"><Check />No requirement to have your AI strategy figured out.</div>
              <div className="flex gap-3"><Check />No obligation to use a specific technology platform.</div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="text-xs text-slate-500">Prefer email?</div>
              <a
                href="mailto:taylor@latimere.com"
                className="mt-1 inline-block text-sm font-medium text-white underline decoration-white/20 underline-offset-4"
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
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [aiStage, setAiStage] = useState('')
  const [challenge, setChallenge] = useState('')

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!name || !email || !company || !challenge) {
      setStatus('error')
      setMessage('Please provide your name, work email, company, and what you would like help with.')
      return
    }

    setStatus('submitting')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mode: 'advisory',
          topic: 'Latimere Advisory Inquiry',
          enterprise: {
            company,
            role,
            companySize,
            useCase: challenge,
            restriction: aiStage,
          },
          meta: {
            page: 'latimere-advisory-home',
            ts: Date.now(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setStatus('success')
      setMessage('Thank you. We received your note and will follow up with the most useful next step.')
      setName('')
      setEmail('')
      setCompany('')
      setRole('')
      setCompanySize('')
      setAiStage('')
      setChallenge('')
    } catch (error) {
      console.error('Latimere Advisory inquiry failed', error)
      setStatus('error')
      setMessage('We could not submit your request. Please try again or email taylor@latimere.com.')
    }
  }

  return (
    <form
      onSubmit={submitForm}
      className="rounded-[1.6rem] border border-white/10 bg-[#071018] p-5 sm:p-7"
      aria-label="Latimere Advisory inquiry form"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Name *" value={name} setValue={setName} placeholder="Jordan Taylor" />
        <TextField label="Work email *" value={email} setValue={setEmail} placeholder="you@company.com" type="email" />
        <TextField label="Company *" value={company} setValue={setCompany} placeholder="Northstar Industries" />
        <TextField label="Role" value={role} setValue={setRole} placeholder="CEO / COO / CIO / VP" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Company size"
          value={companySize}
          setValue={setCompanySize}
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
          setValue={setAiStage}
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
        <label className="mb-2 block text-sm font-medium">What would you like to accomplish? *</label>
        <textarea
          rows={5}
          value={challenge}
          onChange={(event) => setChallenge(event.target.value)}
          placeholder="Tell us about the business problem, opportunity, or AI decision you are working through."
          className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-200/10"
        />
      </div>

      {message ? (
        <div
          role={status === 'error' ? 'alert' : 'status'}
          className={
            status === 'error'
              ? 'mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200'
              : 'mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'
          }
        >
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-5 w-full rounded-xl bg-cyan-200 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-white disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Request a conversation'}
      </button>

      <p className="mt-3 text-center text-[11px] leading-5 text-slate-600">
        We use the information you provide only to respond to your inquiry and evaluate fit.
      </p>
    </form>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050c12]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <div className="text-sm font-semibold tracking-[0.2em]">LATIMERE</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">Advisory</div>
              </div>
            </div>
            <p className="mt-5 max-w-lg text-xs leading-6 text-slate-500">
              Helping organizations turn artificial intelligence and emerging technology into measurable business advantage.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
            <a href="#services" className="hover:text-white">Services</a>
            <a href="#approach" className="hover:text-white">Approach</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="mailto:taylor@latimere.com" className="hover:text-white">Contact</a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-[11px] text-slate-600">
          © 2026 Latimere. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

function BrandMark() {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/5">
      <span className="h-3.5 w-3.5 rounded-full border border-cyan-200/70" />
    </span>
  )
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="rounded-lg px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
    >
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
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</div>
      <h2 className="mt-4 text-3xl font-medium leading-[1.08] tracking-[-0.045em] sm:text-5xl">{title}</h2>
      <p className="mt-5 text-base leading-8 text-slate-400">{body}</p>
    </div>
  )
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-full bg-cyan-200 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-white"
    >
      {children}
    </a>
  )
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-full border border-white/15 bg-white/[0.025] px-6 py-3.5 text-sm font-semibold transition hover:bg-white/[0.06]"
    >
      {children}
    </a>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-2xl font-medium">{value}</div>
      <div className="mt-1 text-[11px] leading-5 text-slate-500">{label}</div>
    </div>
  )
}

function Progress({
  label,
  note,
  width,
}: {
  label: string
  note: string
  width: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4 text-[11px]">
        <span className="truncate text-slate-300">{label}</span>
        <span className="shrink-0 text-slate-500">{note}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className="h-1.5 rounded-full bg-cyan-200" style={{ width }} />
      </div>
    </div>
  )
}

function MiniStep({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[10px] font-semibold tracking-[0.16em] text-cyan-200">{number}</div>
      <div className="mt-1 text-xs font-medium text-slate-200">{label}</div>
    </div>
  )
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-white/10 px-3 py-6 text-center md:border-r md:last:border-r-0">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1.5 text-xs text-slate-500">{body}</div>
    </div>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.025] p-6">
      <div className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
      <h3 className="mt-5 text-base font-medium">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  )
}

function ServiceRow({
  number,
  title,
  body,
  outcome,
}: {
  number: string
  title: string
  body: string
  outcome: string
}) {
  return (
    <article className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[80px_1fr_1fr] md:gap-8 md:py-10">
      <div className="text-xs font-semibold tracking-[0.2em] text-cyan-200">{number}</div>
      <div>
        <h3 className="text-xl font-medium sm:text-2xl">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Typical outcome
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-300">{outcome}</p>
      </div>
    </article>
  )
}

function AssessmentCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071018]/60 p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-400">{body}</p>
    </div>
  )
}

function ProcessCard({
  number,
  eyebrow,
  title,
  body,
}: {
  number: string
  eyebrow: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-[#09131d] p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/5 text-xs font-semibold text-cyan-100">
        {number}
      </div>
      <div className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-lg font-medium">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  )
}

function Principle({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[#09131d] p-7">
      <Check />
      <h3 className="mt-5 text-lg font-medium">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  )
}

function TimelineItem({
  label,
  body,
  last = false,
}: {
  label: string
  body: string
  last?: boolean
}) {
  return (
    <div className={last ? '' : 'mb-6 border-b border-white/10 pb-6'}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{label}</div>
      <p className="mt-2 text-sm leading-7 text-slate-300">{body}</p>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-base font-medium sm:text-lg">{question}</span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? <p className="max-w-3xl pb-7 pr-12 text-sm leading-7 text-slate-400">{answer}</p> : null}
    </div>
  )
}

function Check() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/5 text-[10px] text-cyan-100">
      ✓
    </span>
  )
}

function TextField({
  label,
  value,
  setValue,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  setValue: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-200/10"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  setValue,
  options,
}: {
  label: string
  value: string
  setValue: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#071018] px-3.5 py-3 text-sm text-white focus:border-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-200/10"
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