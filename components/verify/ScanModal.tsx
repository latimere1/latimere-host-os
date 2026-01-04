// components/verify/ScanModal.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { logInfo, logWarn } from '../../lib/verify/log'

function hasBarcodeDetector() {
  return typeof window !== 'undefined' && typeof (window as any).BarcodeDetector !== 'undefined'
}

async function scanFrameForQr(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<string | null> {
  const BD = (window as any).BarcodeDetector
  if (!BD) return null
  const detector = new BD({ formats: ['qr_code'] })

  const w = video.videoWidth
  const h = video.videoHeight
  if (!w || !h) return null

  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, w, h)

  try {
    const codes = await detector.detect(canvas)
    const v = codes?.[0]?.rawValue
    return v ? String(v) : null
  } catch {
    return null
  }
}

type Props = {
  open: boolean
  onClose: () => void
  onScanned: (raw: string) => void | Promise<void>
}

export default function ScanModal({ open, onClose, onScanned }: Props) {
  const [err, setErr] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const canScan = useMemo(() => {
    if (typeof window === 'undefined') return false
    return !!navigator.mediaDevices?.getUserMedia && hasBarcodeDetector()
  }, [])

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop()
      streamRef.current = null
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause()
      } catch {}
      ;(videoRef.current as any).srcObject = null
    }
    setStatus(null)
  }, [])

  const start = useCallback(async () => {
    setErr(null)
    setStatus(null)

    if (!canScan) {
      setErr('Scanning is not supported in this browser. Use Chrome/Edge with a camera.')
      logWarn('[verify] scan not supported', { canScan })
      return
    }

    try {
      logInfo('[verify] scan starting')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream

      const v = videoRef.current
      if (!v) {
        setErr('Scanner failed to initialize.')
        stop()
        return
      }

      const canvas = canvasRef.current || document.createElement('canvas')
      canvasRef.current = canvas

      ;(v as any).srcObject = stream
      await v.play()
      setStatus('Point the camera at a QR code…')

      timerRef.current = window.setInterval(async () => {
        const vv = videoRef.current
        const cc = canvasRef.current
        if (!vv || !cc) return

        const raw = await scanFrameForQr(vv, cc)
        if (!raw) return

        logInfo('[verify] scan success', { rawLen: raw.length })
        stop()
        await onScanned(raw)
      }, 350)
    } catch (e: any) {
      logWarn('[verify] scan start failed', { message: e?.message, name: e?.name })
      const msg =
        e?.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera access and try again.'
          : e?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not start camera.'
      setErr(msg)
      stop()
    }
  }, [canScan, onScanned, stop])

  useEffect(() => {
    if (!open) {
      stop()
      setErr(null)
      return
    }
    start()
    return () => stop()
  }, [open, start, stop])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B1220] p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Scan QR</div>
            <div className="mt-1 text-xs text-white/60">Point the camera at a credential QR code.</div>
          </div>
          <button
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
            onClick={() => {
              onClose()
              stop()
              setErr(null)
            }}
          >
            Close
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black">
          <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
        </div>

        {status && <div className="mt-3 text-xs text-white/60">{status}</div>}

        {err && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>
        )}

        {!canScan && <div className="mt-4 text-[11px] text-white/50">Note: scanning uses BarcodeDetector. Use Chrome/Edge.</div>}
      </div>
    </div>
  )
}
