// lib/wallet/inboxStore.ts
export type InboxItem = {
  id: string
  createdAt: string
  source?: 'paste' | 'link' | 'handoff'
  jwt: string
  preview?: {
    credentialId?: string
    title?: string
    issuerName?: string
    subjectName?: string
  }
}

const INBOX_KEY = 'latimere_wallet_inbox_v0'

function uuid(): string {
  return (globalThis.crypto as any)?.randomUUID?.() || `in_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function load(): InboxItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(INBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as InboxItem[]) : []
  } catch {
    return []
  }
}

function save(items: InboxItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {}
}

export function inboxCount(): number {
  return load().length
}

export function addInboxJwt(jwt: string, source: InboxItem['source'], preview?: InboxItem['preview']) {
  const item: InboxItem = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    source,
    jwt,
    preview,
  }
  const cur = load()
  save([item, ...cur])
}
