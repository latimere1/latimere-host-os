// pages/dev/send-invite.tsx
import { useState } from 'react'
import { inviteCleaner } from '@/src/utils/invite'

export default function DevSendInvite() {
  const [email, setEmail] = useState('taylorhamblinfrost@gmail.com')
  const [busy, setBusy] = useState(false)

  const go = async () => {
    try {
      setBusy(true)
      await inviteCleaner(email)
      alert('✅ Invite created & email sent')
    } catch (e:any) {
      alert(`Failed: ${e.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Send Cleaner Invite</h1>
      <input value={email} onChange={e=>setEmail(e.target.value)} style={{padding:8,width:360}} />
      <button onClick={go} disabled={busy} style={{marginLeft:8}}>
        {busy ? 'Sending…' : 'Send Invite'}
      </button>
    </div>
  )
}
