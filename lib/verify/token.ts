// lib/verify/token.ts
export function tokenFingerprint(t?: string) {
  const s = String(t || '')
  if (!s) return ''
  if (s.length <= 18) return s
  return `${s.slice(0, 8)}…${s.slice(-8)}`
}

export function isProbablyJwt(s: string) {
  const parts = (s || '').split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

/**
 * Accepts ANY of:
 * - raw JWT
 * - verify URL: /verify#t=<jwt> or /verify?token=<jwt>
 * - wallet claim URL: /wallet#claim=<jwt>
 * - any URL with #token= or #t= or #claim= fragments
 */
export function extractJwtFromAnyInput(input: string): { jwt: string; via: string } | null {
  const s0 = (input ?? '').trim()
  if (!s0) return null
  const s = s0.replace(/\s+/g, '')

  if (isProbablyJwt(s) && !s.includes('t=') && !s.includes('token=') && !s.includes('claim=')) {
    return { jwt: s, via: 'raw-jwt' }
  }

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      const hash = (u.hash || '').replace(/^#/, '')
      if (hash) {
        const hp = new URLSearchParams(hash)
        const t = hp.get('t') || hp.get('token') || hp.get('claim')
        if (t && t.trim()) return { jwt: decodeURIComponent(t.trim()), via: 'url-hash' }
      }
      const qt = u.searchParams.get('token') || u.searchParams.get('t') || u.searchParams.get('claim')
      if (qt && qt.trim()) return { jwt: decodeURIComponent(qt.trim()), via: 'url-query' }
    } catch {}
  }

  const frag = s.startsWith('#') ? s.slice(1) : s
  try {
    const fp = new URLSearchParams(frag)
    const t = fp.get('t') || fp.get('token') || fp.get('claim')
    if (t && t.trim()) return { jwt: decodeURIComponent(t.trim()), via: 'fragment' }
  } catch {}

  for (const key of ['token=', 't=', 'claim=']) {
    const idx = s.indexOf(key)
    if (idx >= 0) {
      const tail = s.slice(idx + key.length)
      const cut = tail.split('&')[0].trim()
      if (!cut) continue
      try {
        return { jwt: decodeURIComponent(cut), via: `contains-${key.replace('=', '')}` }
      } catch {
        return { jwt: cut, via: `contains-${key.replace('=', '')}` }
      }
    }
  }

  return null
}

export function readTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash || ''
  if (!h) return null
  const raw = h.startsWith('#') ? h.slice(1) : h
  const params = new URLSearchParams(raw)
  const t = params.get('t') || params.get('token') || params.get('claim')
  return t && t.trim() ? t.trim() : null
}

export function clearHash() {
  if (typeof window === 'undefined') return
  if (!window.location.hash) return
  const url = window.location.pathname + window.location.search
  window.history.replaceState({}, document.title, url)
}
