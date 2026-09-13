import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import TopNav from '../components/TopNav'
import SiteFooter from '../components/SiteFooter'

type LeadMode = 'research' | 'partner'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export default function LatimereVaultLanding() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://latimere.com'

  return (
    <>
      <Head>
        <title>Latimere Vault | Private AI Your Business Controls</title>
        <meta
          name="description"
          content="Latimere Vault is a private AI platform in development for organizations that need useful AI without sending sensitive company knowledge into public AI systems."
        />
        <link rel="canonical" href={`${appUrl}/`} />
        <meta name="robots" content="index,follow" />
        <meta property="og:title" content="Latimere Vault | Private AI Your Business Controls" />
        <meta
          property="og:description"
          content="Help shape a private enterprise AI platform built around customer-controlled data, deployment, access, and governance."
        />
        <meta property="og:image" content="/og.png" />
        <meta property="og:url" content={`${appUrl}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico?v=3" />
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
          <ProofStrip />
          <ProblemSection />
          <PlatformSection />
          <SignalSection />
          <PartnerSection />
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
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(34,211,238,0.20),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(20,184,166,0.12),transparent_28%)]"
      />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
            Private enterprise AI · Now recruiting design partners
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Use AI across your business without giving up control of your data.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
            Latimere Vault is a private AI platform in development for organizations
            that need secure access to company knowledge, grounded answers, and
            governed AI workflows—inside infrastructure they control.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryLink href="#contact" label="Apply to be a design partner" />
            <SecondaryLink href="#platform" label="See what we are building" />
          </div>

          <p className="mt-5 text-sm text-gray-400">
            Not ready for a pilot? Complete a 25-minute research interview and receive a $25 Starbucks gift card.
          </p>
        </div>

        <VaultMockup />
      </div>
    </section>
  )
}

function VaultMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
      <div className="overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#080c16]/95 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Latimere Vault
            </div>
            <div className="mt-1 text-sm font-semibold">Private knowledge workspace</div>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
            Customer controlled
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">Ask your business</div>
            <p className="mt-2 text-sm font-medium text-white">
              What are the most important risks affecting our August launch?
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
            <div className="text-sm font-semibold text-cyan-100">Grounded response</div>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Three active risks require leadership attention: production access,
              payroll validation, and training readiness.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-cyan-100">
              <span className="rounded-full bg-cyan-300/10 px-2 py-1">RAID log</span>
              <span className="rounded-full bg-cyan-300/10 px-2 py-1">Meeting notes</span>
              <span className="rounded-full bg-cyan-300/10 px-2 py-1">Project system</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-300">
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">Permissions</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">Citations</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">Audit trail</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProofStrip() {
  return (
    <section className="border-y border-white/10 bg-white/[0.025]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {[
          ['Private', 'Customer-controlled deployment'],
          ['Grounded', 'Answers tied to approved sources'],
          ['Governed', 'Permissions and auditability'],
          ['Practical', 'Built around real business workflows'],
        ].map(([title, body]) => (
          <div key={title} className="px-4 py-3 text-center">
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1 text-xs text-gray-400">{body}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <SectionIntro
          eyebrow="The problem"
          title="Businesses want AI. Their sensitive knowledge cannot become the price of admission."
          body="Public AI tools are useful, but many organizations still cannot safely connect them to internal documents, decisions, customer information, or regulated data."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ['Data exposure', 'Sensitive information may leave approved environments or be handled by systems the business does not control.'],
            ['Fragmented knowledge', 'Important answers remain scattered across documents, meetings, tickets, and business systems.'],
            ['Weak governance', 'Teams need clear permissions, source traceability, retention rules, and an audit trail.'],
            ['No practical starting point', 'Many AI initiatives begin with broad strategy instead of one useful, measurable workflow.'],
          ].map(([title, body]) => (
            <Card key={title} title={title} body={body} />
          ))}
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section id="platform" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">What we are building</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            A secure AI layer for your organization’s knowledge.
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-300">
            Vault is designed to connect approved business information to AI while keeping access, deployment, and governance under customer control.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            ['Connect', 'Bring together approved documents, meeting transcripts, project systems, and knowledge repositories.'],
            ['Understand', 'Ask questions and receive source-grounded answers instead of unsupported summaries.'],
            ['Govern', 'Apply permissions, model choices, audit history, and customer-defined deployment controls.'],
          ].map(([title, body], index) => (
            <div key={title} className="rounded-[1.4rem] border border-white/10 bg-[#080c16] p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">0{index + 1}</div>
              <h3 className="mt-3 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-300">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function SignalSection() {
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <SectionIntro
          eyebrow="First application"
          title="Latimere Signal turns company evidence into leadership-ready reporting."
          body="Signal is the first workflow built on the Vault vision: grounded executive reporting from transcripts, RAID inputs, decisions, and project-system data—with human review before publication."
        />

        <div className="rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/[0.055] p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ['What changed', 'Surface the developments leaders need to know this week.'],
              ['Why it matters', 'Explain program health, risk, and decision impact.'],
              ['Where it came from', 'Tie important claims back to source evidence.'],
              ['Who approved it', 'Keep humans in control of published output.'],
            ].map(([title, body]) => (
              <Card key={title} title={title} body={body} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PartnerSection() {
  return (
    <section id="pilot" className="border-b border-white/10 bg-white/[0.018]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <SectionIntro
          eyebrow="Design partner program"
          title="Help shape the product around a real private-AI use case."
          body="We are looking for a small number of organizations that have a clear business need, sensitive knowledge, and a team willing to test early workflows with us."
        />

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
          <h3 className="text-lg font-semibold">A strong design partner will:</h3>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-gray-300">
            {[
              'Bring one concrete AI use case worth solving.',
              'Provide business and technical stakeholders for regular feedback.',
              'Help define security, deployment, and workflow requirements.',
              'Test prototypes and evaluate a future paid pilot if the fit is strong.',
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <PrimaryLink href="#contact" label="Apply to be a design partner" />
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  const items = [
    ['Is Latimere Vault available today?', 'Vault is in development. We are currently validating requirements and recruiting design partners before expanding into paid pilots.'],
    ['Is this only for on-premises deployment?', 'No. The product direction includes customer-controlled on-premises, private-cloud, and hybrid deployment models based on partner requirements.'],
    ['What kinds of companies are the best fit?', 'Organizations with sensitive information, internal AI restrictions, fragmented knowledge, or a high-value workflow that public AI tools cannot safely support.'],
    ['What happens after I apply?', 'We will review your use case, schedule a short fit conversation, and determine whether a research interview, design partnership, or later pilot is the right next step.'],
  ]

  return (
    <section id="faq" className="border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">FAQ</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">What to know before reaching out.</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {items.map(([q, a]) => (
            <div key={q} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-300">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id="contact">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-[1.8rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/25 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">Take the next step</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Tell us where private AI could create value in your organization.
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              Choose a research interview or design-partner conversation. We will follow up with the most relevant next step.
            </p>
            <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4 text-sm leading-6 text-cyan-50">
              Research participants who complete a qualifying 25-minute interview will receive a $25 Starbucks gift card.
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
  const [mode, setMode] = React.useState<LeadMode>('partner')
  const [status, setStatus] = React.useState<SubmitStatus>('idle')
  const [message, setMessage] = React.useState<string | null>(null)
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [role, setRole] = React.useState('')
  const [companySize, setCompanySize] = React.useState('')
  const [useCase, setUseCase] = React.useState('')
  const [restriction, setRestriction] = React.useState('')

  React.useEffect(() => {
    const queryMode = Array.isArray(router.query.mode) ? router.query.mode[0] : router.query.mode
    if (queryMode === 'research' || queryMode === 'partner') setMode(queryMode)
  }, [router.query.mode])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)

    if (!name || !email || !company || !useCase) {
      setStatus('error')
      setMessage('Please provide your name, work email, company, and use case.')
      return
    }

    setStatus('submitting')

    const payload = {
      name,
      email,
      mode,
      topic:
        mode === 'research'
          ? 'Latimere Vault Research Interview'
          : 'Latimere Vault Design Partner Application',
      enterprise: {
        company,
        role,
        companySize,
        useCase,
        restriction,
      },
      wallet: null,
      meta: {
        page: 'latimere-vault-landing',
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
      setMessage('Thanks—we will review your information and follow up with the right next step.')
      setName('')
      setEmail('')
      setCompany('')
      setRole('')
      setCompanySize('')
      setUseCase('')
      setRestriction('')
    } catch (error) {
      console.error('Lead submission failed', error)
      setStatus('error')
      setMessage('We could not submit your request. Please try again or email taylor@latimere.com.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-label="Latimere Vault inquiry form">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#05070f]/70 p-1.5">
        {([
          ['partner', 'Design partner'],
          ['research', 'Research interview'],
        ] as [LeadMode, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === value
                ? 'bg-cyan-400 text-gray-950'
                : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name *" value={name} onChange={setName} placeholder="Jordan Taylor" />
        <Field label="Work email *" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
        <Field label="Company *" value={company} onChange={setCompany} placeholder="Northstar Manufacturing" />
        <Field label="Role" value={role} onChange={setRole} placeholder="CIO / CISO / VP IT" />
      </div>

      <SelectField
        label="Company size"
        value={companySize}
        onChange={setCompanySize}
        options={['Under 200 employees', '200–999 employees', '1,000–4,999 employees', '5,000+ employees']}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-100">Private AI use case *</label>
        <textarea
          value={useCase}
          onChange={(event) => setUseCase(event.target.value)}
          rows={4}
          placeholder="What business problem would you want private AI to solve?"
          className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-100">Current AI restriction or concern</label>
        <textarea
          value={restriction}
          onChange={(event) => setRestriction(event.target.value)}
          rows={3}
          placeholder="Sensitive data, public AI restrictions, compliance, deployment, permissions..."
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {status === 'submitting'
            ? 'Sending…'
            : mode === 'research'
              ? 'Request an interview'
              : 'Submit application'}
        </button>
        <a
          href="mailto:taylor@latimere.com"
          className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
        >
          Email directly
        </a>
      </div>
    </form>
  )
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-gray-300">{body}</p>
    </div>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-300">{body}</p>
    </div>
  )
}

function PrimaryLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-cyan-950/25 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
    >
      {label}
    </a>
  )
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
    >
      {label}
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
      <label className="mb-1.5 block text-sm font-medium text-gray-100">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
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
      <label className="mb-1.5 block text-sm font-medium text-gray-100">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-[#05070f] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}