// lib/keys.ts
import { importJWK, JWK, KeyLike } from 'jose'

type ParsedKey = {
  alg: 'ES256' | 'RS256' | 'HS256'
  kid?: string
  key: KeyLike | Uint8Array
}

function detectAlgFromJwk(jwk: JWK): ParsedKey['alg'] {
  if (jwk.kty === 'oct') return 'HS256'
  if (jwk.kty === 'RSA') return 'RS256'
  return 'ES256'
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export function getIssuerAdminKey(): string {
  return requireEnv('LATIMERE_ISSUER_ADMIN_KEY')
}

export async function getPrivateSigningKey(): Promise<ParsedKey> {
  const raw = requireEnv('LATIMERE_ISSUER_PRIVATE_JWK')
  let jwk: JWK
  try {
    jwk = JSON.parse(raw)
  } catch {
    throw new Error('LATIMERE_ISSUER_PRIVATE_JWK must be valid JSON (JWK)')
  }

  const alg = (jwk.alg as ParsedKey['alg']) || detectAlgFromJwk(jwk)
  const key = await importJWK(jwk, alg)
  return { alg, kid: jwk.kid, key }
}

export async function getPublicVerifyKey(): Promise<ParsedKey> {
  const raw = requireEnv('LATIMERE_ISSUER_PUBLIC_JWK')
  let jwk: JWK
  try {
    jwk = JSON.parse(raw)
  } catch {
    throw new Error('LATIMERE_ISSUER_PUBLIC_JWK must be valid JSON (JWK)')
  }

  const alg = (jwk.alg as ParsedKey['alg']) || detectAlgFromJwk(jwk)
  const key = await importJWK(jwk, alg)
  return { alg, kid: jwk.kid, key }
}

export function issuerIssuer(): string {
  return process.env.LATIMERE_JWT_ISSUER || 'latimere'
}

export function issuerAudience(): string {
  return process.env.LATIMERE_JWT_AUDIENCE || 'latimere'
}
