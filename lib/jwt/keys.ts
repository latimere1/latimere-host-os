// lib/jwt/keys.ts
import { importJWK, JWK, KeyLike } from 'jose'

export async function getIssuerPrivateKey(): Promise<{ key: KeyLike; kid?: string; alg: string }> {
  const raw = process.env.LATIMERE_ISSUER_PRIVATE_JWK
  if (!raw) throw new Error('Missing env LATIMERE_ISSUER_PRIVATE_JWK')

  let jwk: JWK
  try {
    jwk = JSON.parse(raw)
  } catch {
    throw new Error('LATIMERE_ISSUER_PRIVATE_JWK must be valid JSON (JWK)')
  }

  const alg = (process.env.LATIMERE_ISSUER_ALG || (jwk.alg as string) || 'RS256').toString()
  const kid = (process.env.LATIMERE_ISSUER_KID || (jwk.kid as string) || '').toString() || undefined

  const key = await importJWK(jwk, alg)
  return { key, kid, alg }
}

export async function getIssuerPublicKeyClient(): Promise<{ key: CryptoKey; kid?: string; alg: string }> {
  const raw = process.env.NEXT_PUBLIC_LATIMERE_ISSUER_PUBLIC_JWK
  if (!raw) throw new Error('Missing env NEXT_PUBLIC_LATIMERE_ISSUER_PUBLIC_JWK')

  let jwk: JWK
  try {
    jwk = JSON.parse(raw)
  } catch {
    throw new Error('NEXT_PUBLIC_LATIMERE_ISSUER_PUBLIC_JWK must be valid JSON (JWK)')
  }

  const alg = (process.env.NEXT_PUBLIC_LATIMERE_ISSUER_ALG || (jwk.alg as string) || 'RS256').toString()
  const kid = (process.env.NEXT_PUBLIC_LATIMERE_ISSUER_KID || (jwk.kid as string) || '').toString() || undefined

  // Browser: importJWK returns a CryptoKey
  const key = (await importJWK(jwk, alg)) as unknown as CryptoKey
  return { key, kid, alg }
}
