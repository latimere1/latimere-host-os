// lib/wallet/jwtClient.ts
import { decodeJwt } from 'jose'
import { normalizeCredential, WalletCredential, WalletCredentialType } from './types'

function logInfo(msg: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') console.info(msg, data ?? '')
}
function logWarn(msg: string, data?: any) {
  console.warn(msg, data ?? '')
}
function logError(msg: string, data?: any) {
  console.error(msg, data ?? '')
}

function tokenFingerprint(t?: string) {
  const s = String(t || '')
  if (!s) return ''
  if (s.length <= 18) return s
  return `${s.slice(0, 8)}…${s.slice(-8)}`
}

function isProbablyJwt(s: string) {
  const parts = (s || '').split('.')
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

function coerceIsoFromAny(v: any): string | null {
  if (!v) return null

  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return null
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString()
    return null
  }

  if (typeof v === 'number' && isFinite(v)) {
    const ms = v < 1e12 ? v * 1000 : v
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString()
    return null
  }

  return null
}

export function looksLikeJwt(s: string) {
  return isProbablyJwt(String(s || '').trim())
}

/**
 * Decodes (does NOT verify) a JWT/JWS and maps it into our WalletCredential shape.
 *
 * Supports BOTH:
 * 1) Legacy Latimere shape: payload.vc = { id, type, ... }
 * 2) New flat shape: payload has cid/schemaId/title/issuerName/subjectName/claims at top level
 */
export function credentialFromJwt(token: string): WalletCredential | null {
  const raw = String(token || '').trim()
  if (!raw) {
    logWarn('[jwtClient] credentialFromJwt: empty token')
    return null
  }

  // Guard: avoid exceptions if caller passes URL or junk
  if (!isProbablyJwt(raw)) {
    logWarn('[jwtClient] credentialFromJwt: not a JWT', {
      len: raw.length,
      fp: tokenFingerprint(raw),
    })
    return null
  }

  try {
    const payload = decodeJwt(raw) as any
    const keys = payload ? Object.keys(payload) : []

    // 1) Legacy/expected shape
    const vc = payload?.vc || payload?.credential || payload?.verifiableCredential
    if (vc) {
      const id = String(vc?.id || '').trim()
      const type = (String(vc?.type || '').trim() as WalletCredentialType) || ('GenericCredential' as WalletCredentialType)

      if (!id || !type) {
        logWarn('[jwtClient] vc present but missing id/type', { hasId: !!id, hasType: !!type, vcKeys: vc ? Object.keys(vc) : [] })
        return null
      }

      const issuedAt = coerceIsoFromAny(vc?.issuedAt) || coerceIsoFromAny(payload?.iat) || new Date().toISOString()
      const expiresAt = coerceIsoFromAny(vc?.expiresAt) || coerceIsoFromAny(payload?.exp) || undefined

      const mapped = normalizeCredential({
        id,
        type,
        title: vc?.title || 'Untitled Credential',
        issuerName: vc?.issuerName || payload?.iss || 'Unknown Issuer',
        subjectName: vc?.subjectName || '',
        subjectId: vc?.subjectId || payload?.sub || '',
        issuedAt,
        expiresAt,
        claims: (vc?.claims && typeof vc.claims === 'object') ? vc.claims : {},
        format: 'jws',
        jws: raw,
      })

      logInfo('[jwtClient] decoded credential (vc)', {
        id: mapped.id,
        type: mapped.type,
        issuerName: mapped.issuerName,
        jwtLen: raw.length,
        fp: tokenFingerprint(raw),
      })

      return mapped
    }

    // 2) New flat payload shape (what your screenshots show)
    // keys: cid, orgId, schemaId, schemaVersion, title, issuerName, subjectName, claims, v, iss, aud, iat, exp
    const hasFlat = !!payload?.cid && !!payload?.schemaId && (payload?.claims && typeof payload.claims === 'object')
    if (hasFlat) {
      const id = String(payload.cid).trim()

      // schemaId is the closest thing we have to a "type" in the new payload.
      // Keep it stable and cast; normalizeCredential will carry it through.
      const type = (String(payload.schemaId || 'GenericCredential').trim() as WalletCredentialType) || ('GenericCredential' as WalletCredentialType)

      const issuedAt = coerceIsoFromAny(payload?.iat) || new Date().toISOString()
      const expiresAt = coerceIsoFromAny(payload?.exp) || undefined

      const mapped = normalizeCredential({
        id,
        type,
        title: String(payload?.title || 'Untitled Credential'),
        issuerName: String(payload?.issuerName || payload?.iss || 'Unknown Issuer'),
        subjectName: String(payload?.subjectName || ''),
        subjectId: String(payload?.sub || payload?.subjectId || ''),
        issuedAt,
        expiresAt,
        claims: payload?.claims || {},
        format: 'jws',
        jws: raw,
      })

      logInfo('[jwtClient] decoded credential (flat)', {
        id: mapped.id,
        type: mapped.type,
        schemaId: payload?.schemaId,
        schemaVersion: payload?.schemaVersion,
        issuerName: mapped.issuerName,
        jwtLen: raw.length,
        fp: tokenFingerprint(raw),
        topKeys: keys,
      })

      return mapped
    }

    logWarn('[jwtClient] decode ok but unsupported payload shape', {
      iss: payload?.iss,
      sub: payload?.sub,
      iat: payload?.iat,
      exp: payload?.exp,
      keys,
    })
    return null
  } catch (e: any) {
    logError('[jwtClient] decodeJwt failed', {
      message: e?.message,
      name: e?.name,
      jwtLen: raw.length,
      fp: tokenFingerprint(raw),
    })
    return null
  }
}
