import type { NextApiRequest } from 'next'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { requireAdmin } from './_auth'

type Actor = {
  sub?: string
  email?: string
  orgId?: string
}

function getCognitoJwksUrl() {
  const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1'
  const poolId = process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID
  if (!poolId) return null
  return `https://cognito-idp.${region}.amazonaws.com/${poolId}/.well-known/jwks.json`
}

function bearer(req: NextApiRequest) {
  const b = (req.headers.authorization || '').toString()
  if (!b.startsWith('Bearer ')) return ''
  return b.slice('Bearer '.length).trim()
}

export async function requireIssuerAuth(req: NextApiRequest): Promise<Actor> {
  // 1) Preferred: Cognito Bearer token
  const tok = bearer(req)
  const jwksUrl = getCognitoJwksUrl()

  if (tok && jwksUrl) {
    const JWKS = createRemoteJWKSet(new URL(jwksUrl))
    const { payload } = await jwtVerify(tok, JWKS, {
      issuer: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID}`,
    })

    const sub = payload.sub?.toString()
    const email = (payload.email || payload['cognito:username'] || '').toString() || undefined
    const orgId = (payload['custom:orgId'] || payload['orgId'] || '').toString() || undefined

    return { sub, email, orgId }
  }

  // 2) Transitional fallback: admin key header (dev only)
  const expected = process.env.LATIMERE_ISSUER_ADMIN_KEY
  const header = (req.headers['x-latimere-admin-key'] || '').toString()
  const ok = expected && header === expected
  if (ok) return { sub: 'dev-admin', email: 'dev-admin@local', orgId: undefined }

  const err = new Error('Unauthorized')
  ;(err as any).statusCode = 401
  throw err
}
