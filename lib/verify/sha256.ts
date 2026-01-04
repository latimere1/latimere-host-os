// lib/verify/sha256.ts
export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('WebCrypto not available to compute SHA-256')
  }
  const enc = new TextEncoder()
  const bytes = enc.encode(input)
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  const arr = Array.from(new Uint8Array(buf))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}
