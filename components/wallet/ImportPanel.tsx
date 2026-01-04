// components/wallet/ImportPanel.tsx
import Link from 'next/link'
import React from 'react'

type Props = {
  importText: string
  onChangeImportText: (v: string) => void
  onImport: () => void | Promise<void>
  inboxN: number
}

export default function ImportPanel({ importText, onChangeImportText, onImport, inboxN }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-lg font-semibold">Import JSON, JWT, or link</h2>
      <p className="mt-1 text-sm text-gray-300">Paste a signed JWT, verify link, or wallet claim link. (JSON supported.)</p>

      <textarea
        className="mt-4 h-56 w-full rounded-xl border border-white/15 bg-gray-900 p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        placeholder='JWT: eyJ... OR /verify#t=... OR /wallet#claim=... OR {"type":"...","claims":{...}}'
        value={importText}
        onChange={(e) => onChangeImportText(e.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-cyan-400" onClick={() => onImport()}>
          Import
        </button>

        <Link href="/wallet/inbox" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
          Inbox{inboxN ? ` (${inboxN})` : ''} →
        </Link>

        <Link href="/verify" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
          Verify a proof →
        </Link>

        <Link href="/issuer" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">
          Issuer Lite →
        </Link>
      </div>
    </div>
  )
}
