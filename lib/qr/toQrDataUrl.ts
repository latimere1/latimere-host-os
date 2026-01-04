export async function toQrDataUrl(value: string): Promise<string> {
  const clean = (value || '').trim()
  if (!clean) throw new Error('Missing value for QR')

  const mod: any = await import('qrcode')
  const QRCode = mod?.default || mod
  if (!QRCode?.toDataURL) throw new Error('QR library missing toDataURL()')

  return QRCode.toDataURL(clean, { errorCorrectionLevel: 'M', margin: 1, scale: 8 })
}
