// lib/verify/log.ts
type Level = 'debug' | 'info' | 'warn' | 'error'

function getLevel(): Level {
  const v = (process.env.NEXT_PUBLIC_LOG_LEVEL || '').toLowerCase()
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
}

const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
function enabled(at: Level) {
  return order[at] >= order[getLevel()]
}

export function logInfo(msg: string, data?: any) {
  if (!enabled('info')) return
  // keep consistent and grep-friendly
  console.info(msg, data ?? '')
}

export function logWarn(msg: string, data?: any) {
  if (!enabled('warn')) return
  console.warn(msg, data ?? '')
}

export function logError(msg: string, data?: any) {
  if (!enabled('error')) return
  console.error(msg, data ?? '')
}
