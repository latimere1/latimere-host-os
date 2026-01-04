// lib/wallet/presentations.ts
export type PresentationEvent = {
  id: string
  createdAt: string
  credentialId?: string
  title?: string
  verifierName?: string
  verdict?: string
  status?: string
  expired?: boolean
  receiptId?: string
  receiptUrl?: string
  requestId?: string
}

const PRESENT_NS = 'latimere_wallet_presentations_v0'
const PRESENT_KEY = `${PRESENT_NS}:events`

export function loadPresentations(): PresentationEvent[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRESENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PresentationEvent[]) : []
  } catch {
    return []
  }
}

export function savePresentations(items: PresentationEvent[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRESENT_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {}
}

export function addPresentationEvent(ev: PresentationEvent) {
  const cur = loadPresentations()
  savePresentations([ev, ...cur].slice(0, 50))
}

export function clearPresentations() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PRESENT_KEY)
  } catch {}
}
