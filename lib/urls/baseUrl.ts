export function getPublicBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (env) return env.replace(/\/+$/, '')
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'http://localhost:3000'
}
