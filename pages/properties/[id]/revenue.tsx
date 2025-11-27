/* pages/properties/[id]/revenue.tsx */
/* eslint-disable no-console */
import { useRouter } from 'next/router'
import Head from 'next/head'
import { FormEvent, useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/api'

// -----------------------------------------------------------------------------
// Amplify client (API_KEY only for revenue graph)
// -----------------------------------------------------------------------------

const debugRevenueClient =
  typeof window !== 'undefined' &&
  (process.env.NEXT_PUBLIC_DEBUG_REVENUE === '1' ||
    process.env.NEXT_PUBLIC_DEBUG_REFERRALS === '1')

const client = generateClient({
  authMode: 'apiKey',
})

// -----------------------------------------------------------------------------
// GraphQL
// -----------------------------------------------------------------------------

const GET_PROPERTY_REVENUE = /* GraphQL */ `
  query GetPropertyRevenue($id: ID!, $snapLimit: Int, $snapNextToken: String) {
    getProperty(id: $id) {
      id
      owner
      name
      nickname
      city
      state
      country
      revenueProfile {
        id
        tier
        pricingCadence
        isActive
        baseNightlyRate
        targetOccupancyPct
        marketName
        internalLabel
        internalOwnerEmail
      }
      revenueSnapshots(
        limit: $snapLimit
        sortDirection: DESC
        nextToken: $snapNextToken
      ) {
        items {
          id
          periodStart
          periodEnd
          label
          grossRevenue
          occupancyPct
          adr
          nightsBooked
          nightsAvailable
          marketOccupancyPct
          marketAdr
          future30Revenue
          future60Revenue
          future90Revenue
          cleaningFeesCollected
          cancellationsCount
          cancellationRevenueLost
          revenueReportUrl
          dashboardUrl
          keyInsights
          pricingDecisionsSummary
          createdAt
        }
        nextToken
      }
    }
  }
`

const CREATE_REVENUE_PROFILE = /* GraphQL */ `
  mutation CreateRevenueProfile($input: CreateRevenueProfileInput!) {
    createRevenueProfile(input: $input) {
      id
      propertyId
      owner
      tier
      pricingCadence
      isActive
      baseNightlyRate
      targetOccupancyPct
      marketName
      internalLabel
      internalOwnerEmail
      createdAt
      updatedAt
    }
  }
`

const UPDATE_REVENUE_PROFILE = /* GraphQL */ `
  mutation UpdateRevenueProfile($input: UpdateRevenueProfileInput!) {
    updateRevenueProfile(input: $input) {
      id
      tier
      pricingCadence
      isActive
      baseNightlyRate
      targetOccupancyPct
      marketName
      internalLabel
      internalOwnerEmail
      updatedAt
    }
  }
`

const CREATE_REVENUE_SNAPSHOT = /* GraphQL */ `
  mutation CreateRevenueSnapshot($input: CreateRevenueSnapshotInput!) {
    createRevenueSnapshot(input: $input) {
      id
      periodStart
      periodEnd
      label
      grossRevenue
      occupancyPct
      adr
      nightsBooked
      nightsAvailable
      keyInsights
      pricingDecisionsSummary
      revenueReportUrl
      dashboardUrl
      createdAt
    }
  }
`

const UPDATE_REVENUE_SNAPSHOT = /* GraphQL */ `
  mutation UpdateRevenueSnapshot($input: UpdateRevenueSnapshotInput!) {
    updateRevenueSnapshot(input: $input) {
      id
      revenueReportUrl
      dashboardUrl
      updatedAt
    }
  }
`

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type RevenueTier = 'ESSENTIAL' | 'PRO' | 'ELITE'
type PricingCadence = 'WEEKLY' | 'DAILY'

type RevenueProfile = {
  id: string
  tier: RevenueTier
  pricingCadence: PricingCadence
  isActive: boolean
  baseNightlyRate?: number | null
  targetOccupancyPct?: number | null
  marketName?: string | null
  internalLabel?: string | null
  internalOwnerEmail?: string | null
}

type RevenueSnapshot = {
  id: string
  periodStart: string
  periodEnd: string
  label?: string | null
  grossRevenue?: number | null
  occupancyPct?: number | null
  adr?: number | null
  nightsBooked?: number | null
  nightsAvailable?: number | null
  marketOccupancyPct?: number | null
  marketAdr?: number | null
  future30Revenue?: number | null
  future60Revenue?: number | null
  future90Revenue?: number | null
  cleaningFeesCollected?: number | null
  cancellationsCount?: number | null
  cancellationRevenueLost?: number | null
  revenueReportUrl?: string | null
  dashboardUrl?: string | null
  keyInsights?: string | null
  pricingDecisionsSummary?: string | null
  createdAt?: string | null
}

type Property = {
  id: string
  owner: string
  name?: string | null
  nickname?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  revenueProfile?: RevenueProfile | null
  revenueSnapshots?: {
    items?: RevenueSnapshot[]
    nextToken?: string | null
  } | null
}

type GetPropertyRevenueResponse = {
  getProperty?: Property | null
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value.toFixed(0)}%`
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function tierDisplay(tier?: RevenueTier | null): string {
  if (!tier) return '—'
  switch (tier) {
    case 'ESSENTIAL':
      return 'Essential'
    case 'PRO':
      return 'Pro'
    case 'ELITE':
      return 'Elite'
    default:
      return tier
  }
}

function cadenceDisplay(cadence?: PricingCadence | null): string {
  if (!cadence) return '—'
  switch (cadence) {
    case 'WEEKLY':
      return 'Weekly'
    case 'DAILY':
      return 'Daily'
    default:
      return cadence
  }
}

const normalizeDateInput = (value: string): string => {
  if (!value) return value

  const trimmed = value.trim()

  // If already AWSDate format, keep it
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  // Handle MM/DD/YYYY or M/D/YYYY
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed)
  if (m) {
    const [, mm, dd, yyyy] = m
    const mm2 = mm.padStart(2, '0')
    const dd2 = dd.padStart(2, '0')
    return `${yyyy}-${mm2}-${dd2}`
  }

  return trimmed
}

const parseNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isNaN(n) ? null : n
}

const parseIntOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (!s) return null
  const n = parseInt(s, 10)
  return Number.isNaN(n) ? null : n
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function PropertyRevenuePage() {
  const router = useRouter()
  const { id } = router.query

  const [property, setProperty] = useState<Property | null>(null)
  const [snapshots, setSnapshots] = useState<RevenueSnapshot[]>([])
  const [snapshotsNextToken, setSnapshotsNextToken] = useState<string | null>(
    null
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Snapshot links editor
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(
    null
  )
  const [linkRevenueReportUrl, setLinkRevenueReportUrl] = useState<string>('')
  const [linkDashboardUrl, setLinkDashboardUrl] = useState<string>('')
  const [savingLinks, setSavingLinks] = useState<boolean>(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [linksSuccess, setLinksSuccess] = useState<string | null>(null)

  // New snapshot form
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [grossRevenue, setGrossRevenue] = useState<string>('')
  const [occupancyPct, setOccupancyPct] = useState<string>('')
  const [adr, setAdr] = useState<string>('')
  const [nightsBooked, setNightsBooked] = useState<string>('')
  const [nightsAvailable, setNightsAvailable] = useState<string>('')
  const [keyInsights, setKeyInsights] = useState<string>('')
  const [pricingSummary, setPricingSummary] = useState<string>('')

  // Email preview modal
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false)
  const [emailLoading, setEmailLoading] = useState<boolean>(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSubject, setEmailSubject] = useState<string>('')
  const [emailPreviewText, setEmailPreviewText] = useState<string>('')
  const [emailHtml, setEmailHtml] = useState<string>('')

  // RevenueProfile editor state
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileTier, setProfileTier] = useState<RevenueTier>('PRO')
  const [profileCadence, setProfileCadence] = useState<PricingCadence>('DAILY')
  const [profileIsActive, setProfileIsActive] = useState<boolean>(true)
  const [profileBaseRate, setProfileBaseRate] = useState<string>('')
  const [profileTargetOcc, setProfileTargetOcc] = useState<string>('')
  const [profileMarket, setProfileMarket] = useState<string>('')
  const [profileInternalLabel, setProfileInternalLabel] = useState<string>('')

  // ---------------------------------------------------------------------------
  // Load property + revenue
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!id || typeof id !== 'string') return

    let isMounted = true

    async function load() {
      console.log('[PropertyRevenue] Loading revenue for property id=', id)
      setLoading(true)
      setError(null)

      try {
        const response = await client.graphql({
          query: GET_PROPERTY_REVENUE,
          variables: {
            id,
            snapLimit: 12,
            snapNextToken: null,
          },
          authMode: 'apiKey',
        })

        const { data, errors } = response as {
          data?: GetPropertyRevenueResponse
          errors?: unknown
        }

        if (errors) {
          console.error(
            '[PropertyRevenue] GraphQL errors from getProperty:',
            errors
          )
          throw new Error('GraphQL error while loading property revenue')
        }

        const prop = data?.getProperty ?? null

        if (!isMounted) return

        if (!prop) {
          console.warn('[PropertyRevenue] Property not found for id', id)
          setError('Property not found.')
          setProperty(null)
          setSnapshots([])
          setSnapshotsNextToken(null)
          return
        }

        setProperty(prop)
        const items = prop.revenueSnapshots?.items ?? []
        setSnapshots(items)
        setSnapshotsNextToken(prop.revenueSnapshots?.nextToken ?? null)

        // Initialize RevenueProfile form from existing profile or defaults
        if (prop.revenueProfile) {
          const rp = prop.revenueProfile
          setProfileTier(rp.tier)
          setProfileCadence(rp.pricingCadence)
          setProfileIsActive(rp.isActive)
          setProfileBaseRate(
            rp.baseNightlyRate != null ? String(rp.baseNightlyRate) : ''
          )
          setProfileTargetOcc(
            rp.targetOccupancyPct != null
              ? String(rp.targetOccupancyPct)
              : ''
          )
          setProfileMarket(rp.marketName ?? '')
          setProfileInternalLabel(rp.internalLabel ?? '')
        } else {
          // Reasonable defaults for a new profile
          setProfileTier('PRO')
          setProfileCadence('DAILY')
          setProfileIsActive(true)
          setProfileBaseRate('')
          setProfileTargetOcc('70')
          setProfileMarket('')
          setProfileInternalLabel('')
        }

        console.log(
          '[PropertyRevenue] Loaded property, snapshots count =',
          items.length
        )
      } catch (err) {
        console.error('[PropertyRevenue] Error loading property revenue:', err)
        if (!isMounted) return
        setError('Failed to load revenue data. Check console logs for details.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [id])

  // ---------------------------------------------------------------------------
  // Save revenue profile
  // ---------------------------------------------------------------------------

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    if (!property) {
      setProfileError('Property not loaded.')
      return
    }

    setProfileSaving(true)
    console.log(
      '[PropertyRevenue] Saving RevenueProfile for property id=',
      property.id
    )

    try {
      const baseRateNum =
        profileBaseRate.trim() !== '' ? parseFloat(profileBaseRate) : null
      const targetOccNum =
        profileTargetOcc.trim() !== '' ? parseInt(profileTargetOcc, 10) : null

      if (profileBaseRate.trim() !== '' && Number.isNaN(baseRateNum as number)) {
        setProfileError('Base nightly rate must be a valid number.')
        setProfileSaving(false)
        return
      }
      if (
        profileTargetOcc.trim() !== '' &&
        Number.isNaN(targetOccNum as number)
      ) {
        setProfileError('Target occupancy must be a valid number.')
        setProfileSaving(false)
        return
      }

      const commonFields: Record<string, any> = {
        tier: profileTier,
        pricingCadence: profileCadence,
        isActive: profileIsActive,
        baseNightlyRate: baseRateNum,
        targetOccupancyPct: targetOccNum,
        marketName: profileMarket.trim() || null,
        internalLabel: profileInternalLabel.trim() || null,
      }

      let response
      if (property.revenueProfile) {
        // Update existing profile
        const input = {
          id: property.revenueProfile.id,
          ...commonFields,
        }

        if (debugRevenueClient) {
          console.log('[PropertyRevenue] UpdateRevenueProfile input:', input)
        }

        response = await client.graphql({
          query: UPDATE_REVENUE_PROFILE,
          variables: { input },
          authMode: 'apiKey',
        })
      } else {
        // Create new profile
        const ownerValue = property.owner || 'latimere-intake'
        const input = {
          propertyId: property.id,
          owner: ownerValue,
          ...commonFields,
        }

        if (debugRevenueClient) {
          console.log('[PropertyRevenue] CreateRevenueProfile input:', input)
        }

        response = await client.graphql({
          query: CREATE_REVENUE_PROFILE,
          variables: { input },
          authMode: 'apiKey',
        })
      }

      const { data, errors } = response as {
        data?: {
          createRevenueProfile?: RevenueProfile & { id: string }
          updateRevenueProfile?: RevenueProfile & { id: string }
        }
        errors?: unknown
      }

      if (errors) {
        console.error(
          '[PropertyRevenue] GraphQL errors from save RevenueProfile:',
          errors
        )
        throw new Error('GraphQL error while saving RevenueProfile')
      }

      const savedProfile =
        data?.updateRevenueProfile ?? data?.createRevenueProfile ?? null

      if (!savedProfile) {
        console.warn(
          '[PropertyRevenue] RevenueProfile mutation returned null:',
          data
        )
        setProfileError(
          'No RevenueProfile was returned from the server. Check logs.'
        )
        return
      }

      // Update local property state
      setProperty((prev) =>
        prev
          ? {
              ...prev,
              revenueProfile: {
                id: savedProfile.id,
                tier: savedProfile.tier,
                pricingCadence: savedProfile.pricingCadence,
                isActive: savedProfile.isActive,
                baseNightlyRate: savedProfile.baseNightlyRate,
                targetOccupancyPct: savedProfile.targetOccupancyPct,
                marketName: savedProfile.marketName,
                internalLabel: savedProfile.internalLabel,
                internalOwnerEmail: savedProfile.internalOwnerEmail ?? null,
              },
            }
          : prev
      )

      setProfileSuccess('Revenue profile saved successfully.')
      console.log('[PropertyRevenue] RevenueProfile saved:', savedProfile)
    } catch (err) {
      console.error('[PropertyRevenue] Error saving RevenueProfile:', err)
      setProfileError(
        'Failed to save revenue profile. Check console logs for details.'
      )
    } finally {
      setProfileSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Create snapshot
  // ---------------------------------------------------------------------------

  async function handleCreateSnapshot(e: FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!property) {
      setFormError('Property not loaded.')
      return
    }

    if (!periodStart || !periodEnd) {
      setFormError('Please provide both period start and end dates.')
      return
    }

    setSaving(true)
    console.log(
      '[PropertyRevenue] Creating new snapshot for property id=',
      property.id
    )

    try {
      const input: Record<string, any> = {
        propertyId: property.id,
        // owner is required in the schema; reuse Property.owner
        owner: property.owner || 'latimere',
        periodStart: normalizeDateInput(periodStart),
        periodEnd: normalizeDateInput(periodEnd),
      }

      if (label.trim()) input.label = label.trim()
      input.grossRevenue = parseNumberOrNull(grossRevenue)
      input.occupancyPct = parseNumberOrNull(occupancyPct)
      input.adr = parseNumberOrNull(adr)
      input.nightsBooked = parseIntOrNull(nightsBooked)
      input.nightsAvailable = parseIntOrNull(nightsAvailable)

      if (keyInsights.trim()) input.keyInsights = keyInsights.trim()
      if (pricingSummary.trim())
        input.pricingDecisionsSummary = pricingSummary.trim()

      if (debugRevenueClient) {
        console.log('[PropertyRevenue] Snapshot input:', input)
      }

      const response = await client.graphql({
        query: CREATE_REVENUE_SNAPSHOT,
        variables: { input },
        authMode: 'apiKey',
      })

      const { data, errors } = response as {
        data?: { createRevenueSnapshot?: RevenueSnapshot | null }
        errors?: unknown
      }

      if (errors) {
        console.error(
          '[PropertyRevenue] GraphQL errors from createRevenueSnapshot:',
          errors
        )
        throw new Error('GraphQL error while creating revenue snapshot')
      }

      const created = data?.createRevenueSnapshot ?? null

      console.log('[PropertyRevenue] Snapshot created:', created)

      if (created) {
        setSnapshots((prev) => [created, ...prev])
      }

      // Clear form
      setPeriodStart('')
      setPeriodEnd('')
      setLabel('')
      setGrossRevenue('')
      setOccupancyPct('')
      setAdr('')
      setNightsBooked('')
      setNightsAvailable('')
      setKeyInsights('')
      setPricingSummary('')
    } catch (err: any) {
      console.error(
        '[PropertyRevenue] Error creating snapshot (full error):',
        JSON.stringify(err, null, 2)
      )
      setFormError('Failed to save snapshot. Check console logs for details.')
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Snapshot links editor
  // ---------------------------------------------------------------------------

  function startEditLinks(snapshot: RevenueSnapshot) {
    setEditingSnapshotId(snapshot.id)
    setLinkRevenueReportUrl(snapshot.revenueReportUrl || '')
    setLinkDashboardUrl(snapshot.dashboardUrl || '')
    setLinksError(null)
    setLinksSuccess(null)
    console.log('[PropertyRevenue] Editing links for snapshot id=', snapshot.id)
  }

  async function handleSaveLinks(e: FormEvent) {
    e.preventDefault()
    setLinksError(null)
    setLinksSuccess(null)

    if (!editingSnapshotId) {
      setLinksError('No snapshot selected.')
      return
    }

    setSavingLinks(true)
    console.log(
      '[PropertyRevenue] Saving links for snapshot id=',
      editingSnapshotId
    )

    try {
      const input: Record<string, any> = {
        id: editingSnapshotId,
        revenueReportUrl: linkRevenueReportUrl.trim() || null,
        dashboardUrl: linkDashboardUrl.trim() || null,
      }

      if (debugRevenueClient) {
        console.log('[PropertyRevenue] UpdateRevenueSnapshot input:', input)
      }

      const response = await client.graphql({
        query: UPDATE_REVENUE_SNAPSHOT,
        variables: { input },
        authMode: 'apiKey',
      })

      const { data, errors } = response as {
        data?: { updateRevenueSnapshot?: Partial<RevenueSnapshot> | null }
        errors?: unknown
      }

      if (errors) {
        console.error(
          '[PropertyRevenue] GraphQL errors from updateRevenueSnapshot:',
          errors
        )
        throw new Error('GraphQL error while updating snapshot links')
      }

      const updated = data?.updateRevenueSnapshot ?? null

      console.log('[PropertyRevenue] Links updated for snapshot:', updated)

      if (updated) {
        setSnapshots((prev) =>
          prev.map((s) =>
            s.id === updated.id
              ? {
                  ...s,
                  revenueReportUrl:
                    updated.revenueReportUrl ?? s.revenueReportUrl ?? null,
                  dashboardUrl:
                    updated.dashboardUrl ?? s.dashboardUrl ?? null,
                }
              : s
          )
        )
      }

      setLinksSuccess('Links saved successfully.')
    } catch (err) {
      console.error('[PropertyRevenue] Error saving links:', err)
      setLinksError('Failed to save links. Check console logs for details.')
    } finally {
      setSavingLinks(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Email preview
  // ---------------------------------------------------------------------------

  async function handleGenerateEmail() {
    setEmailError(null)
    setEmailSubject('')
    setEmailPreviewText('')
    setEmailHtml('')

    const latest = snapshots[0]
    if (!latest) {
      setEmailError('No revenue snapshot available to generate email from.')
      setEmailModalOpen(true)
      return
    }

    setEmailLoading(true)
    setEmailModalOpen(true)
    console.log(
      '[PropertyRevenue] Generating email preview for snapshot id=',
      latest.id
    )

    try {
      const response = await fetch('/api/admin/revenue/email-preview', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ revenueSnapshotId: latest.id }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error(
          '[PropertyRevenue] Email preview HTTP error:',
          response.status,
          response.statusText,
          text
        )
        setEmailError(
          `Failed to generate email preview (HTTP ${response.status}). Check console logs for details.`
        )
        return
      }

      const json = (await response.json()) as {
        ok: boolean
        subject?: string
        previewText?: string
        html?: string
        error?: string
        details?: unknown
      }

      if (!json.ok) {
        console.error('[PropertyRevenue] Email preview error payload:', json)
        setEmailError(
          json.error ||
            'Email preview API returned an error. Check console logs for details.'
        )
        return
      }

      setEmailSubject(json.subject || '')
      setEmailPreviewText(json.previewText || '')
      setEmailHtml(json.html || '')
      console.log('[PropertyRevenue] Email preview generated successfully.')
    } catch (err) {
      console.error('[PropertyRevenue] Unexpected error generating email:', err)
      setEmailError('Unexpected error while generating email. See console logs.')
    } finally {
      setEmailLoading(false)
    }
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      console.log(`[PropertyRevenue] Copied ${label} to clipboard.`)
    } catch (err) {
      console.error(`[PropertyRevenue] Failed to copy ${label}:`, err)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const propertyTitle =
    property?.nickname ||
    property?.name ||
    (property ? `Property ${property.id}` : '')

  const latestSnapshot = snapshots[0]

  return (
    <>
      <Head>
        <title>
          {propertyTitle
            ? `${propertyTitle} — Revenue`
            : 'Property Revenue — Latimere'}
        </title>
      </Head>
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                Latimere Revenue Management
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-50">
                {propertyTitle || 'Property Revenue'}
              </h1>
              {property && (
                <p className="mt-1 text-sm text-slate-400">
                  {[property.city, property.state, property.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>

            {/* Generate email button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateEmail}
                disabled={loading || snapshots.length === 0}
                className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailLoading
                  ? 'Generating email...'
                  : 'Generate owner summary email'}
              </button>
            </div>
          </header>

          {loading && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
              Loading revenue data...
            </div>
          )}

          {error && !loading && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {!loading && property && (
            <>
              {/* Profile Summary + Editor */}
              <section className="mb-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Revenue Profile
                  </h2>
                  {property.revenueProfile ? (
                    <div className="mt-3 space-y-1 text-sm text-slate-300">
                      <div>
                        <span className="text-slate-400">Tier: </span>
                        <span>{tierDisplay(property.revenueProfile.tier)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Cadence: </span>
                        <span>
                          {cadenceDisplay(
                            property.revenueProfile.pricingCadence
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Status: </span>
                        {property.revenueProfile.isActive ? (
                          <span className="text-cyan-300">Active</span>
                        ) : (
                          <span className="text-slate-400">Inactive</span>
                        )}
                      </div>
                      {property.revenueProfile.baseNightlyRate != null && (
                        <div>
                          <span className="text-slate-400">Base rate: </span>
                          <span>
                            {formatCurrency(
                              property.revenueProfile.baseNightlyRate
                            )}
                          </span>
                        </div>
                      )}
                      {property.revenueProfile.targetOccupancyPct != null && (
                        <div>
                          <span className="text-slate-400">
                            Target occupancy:{' '}
                          </span>
                          <span>
                            {formatPercent(
                              property.revenueProfile.targetOccupancyPct
                            )}
                          </span>
                        </div>
                      )}
                      {property.revenueProfile.marketName && (
                        <div>
                          <span className="text-slate-400">Market: </span>
                          <span>{property.revenueProfile.marketName}</span>
                        </div>
                      )}
                      {property.revenueProfile.internalOwnerEmail && (
                        <div>
                          <span className="text-slate-400">Owner email: </span>
                          <span>
                            {property.revenueProfile.internalOwnerEmail}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      No revenue profile configured yet. Use the form on the
                      right to choose a plan (Essential / Pro / Elite) and base
                      strategy.
                    </p>
                  )}
                </div>

                {/* Profile Editor */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Configure plan & strategy
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Set the Latimere plan, pricing cadence, and key targets for
                    this property. This drives how much work you do each month
                    and how aggressively you optimize.
                  </p>

                  {profileError && (
                    <div className="mt-2 rounded-md border border-red-500/40 bg-red-950/40 p-2 text-[11px] text-red-200">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-950/40 p-2 text-[11px] text-emerald-200">
                      {profileSuccess}
                    </div>
                  )}

                  <form
                    onSubmit={handleSaveProfile}
                    className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  >
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Plan tier
                      </label>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        value={profileTier}
                        onChange={(e) =>
                          setProfileTier(e.target.value as RevenueTier)
                        }
                      >
                        <option value="ESSENTIAL">Essential</option>
                        <option value="PRO">Pro (default)</option>
                        <option value="ELITE">Elite</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Pricing cadence
                      </label>
                      <select
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        value={profileCadence}
                        onChange={(e) =>
                          setProfileCadence(e.target.value as PricingCadence)
                        }
                      >
                        <option value="WEEKLY">Weekly updates</option>
                        <option value="DAILY">Daily optimization</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 md:col-span-2">
                      <input
                        id="profile-active"
                        type="checkbox"
                        className="h-3 w-3 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                        checked={profileIsActive}
                        onChange={(e) => setProfileIsActive(e.target.checked)}
                      />
                      <label
                        htmlFor="profile-active"
                        className="text-[11px] text-slate-300"
                      >
                        Revenue management active for this property
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Base nightly rate
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        placeholder="e.g. 275"
                        value={profileBaseRate}
                        onChange={(e) => setProfileBaseRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300">
                        Target occupancy %
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        placeholder="e.g. 70"
                        value={profileTargetOcc}
                        onChange={(e) => setProfileTargetOcc(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300">
                        Market / segment
                      </label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        placeholder="e.g. Smoky Mountains – 2BR cabins"
                        value={profileMarket}
                        onChange={(e) => setProfileMarket(e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-300">
                        Internal label (optional)
                      </label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                        placeholder="e.g. Cabin 1 – Pro Tier"
                        value={profileInternalLabel}
                        onChange={(e) =>
                          setProfileInternalLabel(e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between md:col-span-2">
                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {profileSaving
                          ? 'Saving profile...'
                          : 'Save revenue profile'}
                      </button>
                      <p className="text-[11px] text-slate-500">
                        Tier & cadence drive how much work you commit to per
                        month.
                      </p>
                    </div>
                  </form>
                </div>
              </section>

              {/* New Snapshot Form */}
              <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  New Revenue Snapshot
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Paste in monthly metrics from PriceLabs / AirDNA / Airbnb
                  export. This powers the dashboard and the Latimere Revenue
                  Intelligence report.
                </p>

                {formError && (
                  <div className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
                    {formError}
                  </div>
                )}

                <form
                  onSubmit={handleCreateSnapshot}
                  className="mt-4 grid gap-4 md:grid-cols-2"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Period start (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Period end (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Label (optional, e.g. &quot;November 2025&quot;)
                      </label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="November 2025"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Gross revenue
                      </label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={grossRevenue}
                        onChange={(e) => setGrossRevenue(e.target.value)}
                        placeholder="e.g. 8200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300">
                          Occupancy %
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                          value={occupancyPct}
                          onChange={(e) => setOccupancyPct(e.target.value)}
                          placeholder="e.g. 72"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300">
                          ADR
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                          value={adr}
                          onChange={(e) => setAdr(e.target.value)}
                          placeholder="e.g. 260"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300">
                          Nights booked
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                          value={nightsBooked}
                          onChange={(e) => setNightsBooked(e.target.value)}
                          placeholder="e.g. 22"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300">
                          Nights available
                        </label>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                          value={nightsAvailable}
                          onChange={(e) => setNightsAvailable(e.target.value)}
                          placeholder="e.g. 30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Key insights (owner-facing narrative)
                      </label>
                      <textarea
                        className="mt-1 h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={keyInsights}
                        onChange={(e) => setKeyInsights(e.target.value)}
                        placeholder="e.g. Raised prices 10% for weekends, maintained occupancy. Strong demand from Atlanta & Nashville guests..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300">
                        Pricing decisions summary (internal / Latimere)
                      </label>
                      <textarea
                        className="mt-1 h-28 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-50 outline-none focus:border-cyan-400"
                        value={pricingSummary}
                        onChange={(e) => setPricingSummary(e.target.value)}
                        placeholder="e.g. Increased base price from 240 → 260, tightened minimum stay to 3 nights on weekends, added gap-night discounts..."
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {saving ? 'Saving snapshot...' : 'Save snapshot'}
                      </button>
                    </div>
                  </div>
                </form>
              </section>

              {/* Snapshot History + Links Editor */}
              <section className="mb-12 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Revenue History
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Each row represents a month or period. Use the inline editor
                  below to attach your Canva PDF report and Google Data Studio
                  dashboard links for that period.
                </p>

                {snapshots.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No snapshots yet. Each month, paste in the latest numbers
                    from your operational tools to keep the dashboard and
                    reports up to date.
                  </p>
                ) : (
                  <>
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-800 text-xs md:text-sm">
                        <thead>
                          <tr className="bg-slate-950">
                            <th className="px-3 py-2 text-left font-medium text-slate-300">
                              Period
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-300">
                              Revenue
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-300">
                              Occ %
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-300">
                              ADR
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-300">
                              Nights
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-300">
                              Summary & Links
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-slate-300">
                              Edit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {snapshots.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-950/60">
                              <td className="px-3 py-2 align-top">
                                <div className="font-medium text-slate-100">
                                  {s.label || 'Snapshot'}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {formatShortDate(s.periodStart)} –{' '}
                                  {formatShortDate(s.periodEnd)}
                                </div>
                              </td>
                              <td className="px-3 py-2 align-top text-right text-slate-50">
                                {formatCurrency(s.grossRevenue ?? 0)}
                              </td>
                              <td className="px-3 py-2 align-top text-right text-slate-50">
                                {formatPercent(s.occupancyPct ?? 0)}
                              </td>
                              <td className="px-3 py-2 align-top text-right text-slate-50">
                                {formatCurrency(s.adr ?? 0)}
                              </td>
                              <td className="px-3 py-2 align-top text-right text-slate-50">
                                {s.nightsBooked ?? '—'}
                                <span className="text-slate-400">
                                  {' '}
                                  / {s.nightsAvailable ?? '—'}
                                </span>
                              </td>
                              <td className="px-3 py-2 align-top text-slate-200">
                                <div className="max-w-xs text-xs text-slate-300">
                                  {s.keyInsights || '—'}
                                </div>
                                {(s.revenueReportUrl || s.dashboardUrl) && (
                                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                                    {s.revenueReportUrl && (
                                      <a
                                        href={s.revenueReportUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-cyan-500/50 px-2 py-0.5 text-cyan-300 hover:bg-cyan-500/10"
                                      >
                                        Report PDF
                                      </a>
                                    )}
                                    {s.dashboardUrl && (
                                      <a
                                        href={s.dashboardUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-slate-500/60 px-2 py-0.5 text-slate-200 hover:bg-slate-700/60"
                                      >
                                        Live dashboard
                                      </a>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 align-top text-right">
                                <button
                                  type="button"
                                  onClick={() => startEditLinks(s)}
                                  className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                                >
                                  Edit links
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inline editor for report/dashboard links */}
                    {editingSnapshotId && (
                      <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950/70 p-4 text-xs md:text-sm">
                        <h3 className="text-sm font-semibold text-slate-100">
                          Edit report & dashboard links
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Paste in the public URLs for this snapshot&apos;s
                          Latimere Revenue Intelligence PDF and/or the Google
                          Data Studio dashboard.
                        </p>

                        {linksError && (
                          <div className="mt-3 rounded-md border border-red-500/40 bg-red-950/40 p-2 text-xs text-red-200">
                            {linksError}
                          </div>
                        )}
                        {linksSuccess && (
                          <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-950/40 p-2 text-xs text-emerald-200">
                            {linksSuccess}
                          </div>
                        )}

                        <form
                          onSubmit={handleSaveLinks}
                          className="mt-3 grid gap-3 md:grid-cols-2"
                        >
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300">
                              Revenue report URL (Canva / Slides PDF)
                            </label>
                            <input
                              type="url"
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                              placeholder="https://..."
                              value={linkRevenueReportUrl}
                              onChange={(e) =>
                                setLinkRevenueReportUrl(e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-300">
                              Dashboard URL (Google Data Studio / Looker)
                            </label>
                            <input
                              type="url"
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-50 outline-none focus:border-cyan-400"
                              placeholder="https://..."
                              value={linkDashboardUrl}
                              onChange={(e) =>
                                setLinkDashboardUrl(e.target.value)
                              }
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 md:col-span-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={savingLinks}
                                className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {savingLinks ? 'Saving...' : 'Save links'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSnapshotId(null)
                                  setLinksError(null)
                                  setLinksSuccess(null)
                                }}
                                className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800/80"
                              >
                                Cancel
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              These links are used in the owner dashboard and in
                              your monthly emails.
                            </p>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>

        {/* Email preview modal */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Owner summary email — preview
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generated from the latest revenue snapshot. Copy into
                    Gmail, SES, or Mailchimp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="rounded-full border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto px-4 py-3 text-xs text-slate-200">
                {emailLoading && (
                  <div className="rounded-md border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200">
                    Generating email preview...
                  </div>
                )}

                {emailError && !emailLoading && (
                  <div className="rounded-md border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200">
                    {emailError}
                  </div>
                )}

                {!emailLoading && !emailError && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-medium text-slate-300">
                          Subject
                        </label>
                        {emailSubject && (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(emailSubject, 'subject')
                            }
                            className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                          >
                            Copy subject
                          </button>
                        )}
                      </div>
                      <input
                        readOnly
                        value={emailSubject}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-medium text-slate-300">
                        Preview text (inbox snippet)
                      </label>
                      <input
                        readOnly
                        value={emailPreviewText}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-[11px] text-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[11px] font-medium text-slate-300">
                          HTML body
                        </label>
                        {emailHtml && (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(emailHtml, 'HTML body')
                            }
                            className="rounded-full border border-slate-600 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                          >
                            Copy HTML
                          </button>
                        )}
                      </div>
                      <textarea
                        readOnly
                        value={emailHtml}
                        className="h-64 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 font-mono text-[11px] text-slate-50"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
