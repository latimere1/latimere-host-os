import type { NextApiRequest, NextApiResponse } from 'next'
import { importJWK, JWK } from 'jose'

function json(res: NextApiResponse, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function safeParse(name: string) {
  const raw = process.env[name]
  if (!raw) return { ok: false as const, error: `missing ${name}` }
  try {
    const parsed = JSON.parse(raw) as JWK
    return { ok: true as const, parsed }
  } catch (e: any) {
    return { ok: false as const, error: `${name} invalid JSON: ${e?.message}` }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return json(res, 405, { ok: false, error: 'Method not allowed' })

    const priv = safeParse('LATIMERE_ISSUER_PRIVATE_JWK')
    const pub = safeParse('LATIMERE_ISSUER_PUBLIC_JWK')

    const details: any = {
      nodeEnv: process.env.NODE_ENV,
      hasAdminKey: !!process.env.LATIMERE_ISSUER_ADMIN_KEY,
      private: priv.ok
        ? { kty: priv.parsed.kty, crv: (priv.parsed as any).crv, alg: (priv.parsed as any).alg, kid: (priv.parsed as any).kid, hasD: !!(priv.parsed as any).d }
        : { error: priv.error },
      public: pub.ok
        ? { kty: pub.parsed.kty, crv: (pub.parsed as any).crv, alg: (pub.parsed as any).alg, kid: (pub.parsed as any).kid, hasD: !!(pub.parsed as any).d }
        : { error: pub.error },
    }

    // Attempt to import keys (this is where {} will fail)
    if (priv.ok) {
      const alg = ((priv.parsed as any).alg || 'ES256') as any
      await importJWK(priv.parsed, alg)
      details.privateImported = true
    }
    if (pub.ok) {
      const alg = ((pub.parsed as any).alg || 'ES256') as any
      await importJWK(pub.parsed, alg)
      details.publicImported = true
    }

    json(res, 200, { ok: true, details })
  } catch (e: any) {
    json(res, 500, { ok: false, error: e?.message || 'Internal error' })
  }
}
