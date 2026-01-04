// lib/apiAuth.ts
import type { NextApiRequest } from 'next'

export function requireAdmin(req: NextApiRequest) {
  const expected = process.env.LATIMERE_ISSUER_ADMIN_KEY
  if (!expected) {
    console.warn('[API Auth] Missing LATIMERE_ISSUER_ADMIN_KEY (admin protection disabled)')
    return
  }

  const header = (req.headers['x-latimere-admin-key'] || '').toString()
  const bearer = (req.headers.authorization || '').toString()
  const token = bearer.startsWith('Bearer ') ? bearer.slice('Bearer '.length).trim() : ''

  const ok = header === expected || token === expected
  if (!ok) {
    console.warn('[API Auth] unauthorized', { path: req.url })
    const err = new Error('Unauthorized')
    ;(err as any).statusCode = 401
    throw err
  }
}
