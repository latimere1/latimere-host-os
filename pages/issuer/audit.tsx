// pages/issuer/audit.tsx
import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import TopNav from '../../components/TopNav'

type AuditResp =
  | {
      ok: true
      requestId: string
      orgId: string
      count: number
      items: any[]
    }
  | {
      ok: false
      requestId?: string
      error: string
    }

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function safeString(v: any) {
  return (v ?? '').toString().trim()
}

function downloadJson(filename: string, obj: any) {
  try {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    logWarn('[IssuerAudit] download failed', { message: e?.message })
    alert('Download failed.')
  }
}

function formatTs(ts?: string) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function IssuerAuditPage() {
  const [limit, setLimit] = React.useState(50)
  const [action, setAction] = React.useState<string>('') // ISSUE | REVOKE | VERIFY (future)
  const [credentialId, setCredentialId] = React.useState<string>('')

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [orgId, setOrgId] = React.useState<string>('')
  const [items, setItems] = React.useState<any[]>([])
  const [requestId, setRequestId] = React.useState<string>('')

  async function fetchAudit() {
    setLoading(true)
    setError(null)

    try {
      const qs = new URLSearchParams()
      qs.set('limit', String(limit || 50))
      if (action.trim()) qs.set('action', action.trim())
      if (credentialId.trim()) qs.set('credentialId', credentialId.trim())

      logInfo('[IssuerAudit] fetching', {
        limit,
        action: action.trim() || null,
        credentialId: credentialId.trim() || null,
      })

      const res = await fetch(`/api/audit?${qs.toString()}`, { method: 'GET' })
      const data = (await res.json().catch(() => null)) as AuditResp | null

      if (!res.ok || !data) {
        setError('Failed to load audit.')
        logWarn('[IssuerAudit] fetch failed', { status: res.status })
        return
      }

      if (!data.ok) {
        setError(data.error || 'Failed to load audit.')
        logWarn('[IssuerAudit] api error', { error: data.error })
        return
      }

      setOrgId(data.orgId)
      setItems(Array.isArray(data.items) ? data.items : [])
      setRequestId(data.requestId)
      logInfo('[IssuerAudit] loaded', { orgId: data.orgId, count: data.count, requestId: data.requestId })
    } catch (e: any) {
      setError('Failed to load audit.')
      logError('[IssuerAudit] error', { message: e?.message })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void fetchAudit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredCount = items.length

  return (
    <div className="min-h-screen bg-[#070B12] text-white">
      <Head>
        <title>Latimere · Issuer Audit</title>
      </Head>

      <TopNav />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Audit</h1>
            <p className="mt-2 text-sm text-gray-300">
              Evidence log for issuance/revocation/verification events (org-scoped).
            </p>
            <div className="mt-2 text-xs text-gray-500">
              Org: <span className="font-mono text-gray-300">{orgId || '—'}</span>
              {requestId ? (
                <>
                  {' '}
                  · Request: <span className="font-mono text-gray-300">{requestId}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/issuer"
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Issuer
            </Link>

            <button
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
              disabled={loading}
              onClick={() => fetchAudit()}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>

            <button
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-60"
              disabled={loading || items.length === 0}
              onClick={() => {
                const fname = `latimere-audit-${orgId || 'org'}-${new Date().toISOString().slice(0, 10)}.json`
                downloadJson(fname, { orgId, requestId, count: filteredCount, items })
              }}
            >
              Download JSON
            </button>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-800 bg-[#0B1220]/70 p-6 shadow">
          <h2 className="text-lg font-semibold">Filters</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs text-gray-400">Limit</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                value={String(limit)}
                onChange={(e) => setLimit(Number(e.target.value || 50))}
              />
              <div className="mt-1 text-[11px] text-gray-500">Max 500 (server-enforced).</div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Action (optional)</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="">All</option>
                <option value="ISSUE">ISSUE</option>
                <option value="REVOKE">REVOKE</option>
                <option value="VERIFY">VERIFY</option>
              </select>
              <div className="mt-1 text-[11px] text-gray-500">
                VERIFY events will appear once we start writing them to audit on verification.
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400">Credential ID (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-800 bg-[#08101D] px-3 py-2 text-sm"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="cred_..."
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-cyan-400 disabled:opacity-60"
              disabled={loading}
              onClick={() => fetchAudit()}
            >
              Apply
            </button>

            <button
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              onClick={() => {
                setAction('')
                setCredentialId('')
                setLimit(50)
                void fetchAudit()
              }}
            >
              Reset
            </button>

            <div className="ml-auto text-sm text-gray-300">
              Showing: <span className="text-gray-100">{filteredCount}</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-gray-800 bg-[#0B1220]/70 p-6 shadow">
          <h2 className="text-lg font-semibold">Events</h2>

          {loading ? (
            <div className="mt-4 text-sm text-gray-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="mt-4 rounded-lg border border-gray-800 bg-[#08101D] p-4 text-sm text-gray-200">
              No audit events found.
            </div>
          ) : (
            <div className="mt-4 overflow-auto rounded-xl border border-gray-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/30 text-xs text-gray-300">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Credential</th>
                    <th className="px-3 py-2">Actor</th>
                    <th className="px-3 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const ts = safeString(it?.ts || it?.createdAt || it?.time)
                    const action = safeString(it?.action)
                    const cid = safeString(it?.credentialId)
                    const actor = safeString(it?.actorEmail || it?.actorSub || it?.by)

                    return (
                      <tr key={it?.auditId || it?.sk || `${idx}`} className="border-t border-gray-800 bg-[#08101D]">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-200">{formatTs(ts)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-200">
                            {action || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-200">{cid || '—'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-300">{actor || '—'}</td>
                        <td className="px-3 py-2">
                          <details>
                            <summary className="cursor-pointer text-xs text-cyan-200">View</summary>
                            <pre className="mt-2 max-w-[900px] overflow-auto rounded-lg border border-gray-800 bg-black/30 p-3 text-[11px] text-gray-200">
                              {JSON.stringify(it?.detail || it, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
