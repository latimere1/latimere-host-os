// pages/dev/seed-affiliation.tsx
import { useState } from 'react'
import { generateClient } from 'aws-amplify/api'
import { getCurrentUser } from 'aws-amplify/auth'
import { createCleanerAffiliation } from '@/src/graphql/mutations'
import { listAffiliationsByOwner } from '@/src/graphql/queries'

const client = generateClient({ authMode: 'userPool' })

export default function SeedAffiliation() {
  const [email, setEmail] = useState('taylorfrost')
  const [label, setLabel] = useState('Taylor Frost')
  const [ownerSub, setOwnerSub] = useState<string>('')

  const log = (...a: any[]) => console.log('[SeedAffiliation]', ...a)

  const loadOwner = async () => {
    const { userId } = await getCurrentUser()
    setOwnerSub(userId)
    log('Current ownerSub:', userId)
  }

  const createOne = async () => {
    if (!ownerSub) await loadOwner()
    try {
      const res = await client.graphql({
        query: createCleanerAffiliation,
        variables: {
          input: {
            ownerSub: ownerSub || (await getCurrentUser()).userId,
            cleanerUsername: email,     // must match Cleaning.assignedTo format
            cleanerDisplay: label,
          },
        },
        authMode: 'userPool',
      })
      log('createCleanerAffiliation:', res)
      alert('✅ Affiliation created. Open a unit page and try the dropdown.')
    } catch (e: any) {
      console.error('createCleanerAffiliation error:', e, e?.errors)
      alert(`Failed: ${e?.errors?.[0]?.message || e}`)
    }
  }

  const listMine = async () => {
    if (!ownerSub) await loadOwner()
    const res: any = await client.graphql({
      query: listAffiliationsByOwner,
      variables: { ownerSub: ownerSub || (await getCurrentUser()).userId },
      authMode: 'userPool',
    })
    log('listAffiliationsByOwner:', res?.data?.listAffiliationsByOwner?.items)
    alert(`Check console: listed ${res?.data?.listAffiliationsByOwner?.items?.length ?? 0} rows`)
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Seed Cleaner Affiliation</h1>
      <p style={{ color: '#666' }}>
        This links the <b>current admin/owner</b> to a cleaner so your unit page
        dropdown shows the right options.
      </p>

      <div style={{ marginTop: 16 }}>
        <label>Email (cleaner username): </label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 8, width: 320 }} />
      </div>

      <div style={{ marginTop: 8 }}>
        <label>Display label (optional): </label>
        <input value={label} onChange={e => setLabel(e.target.value)} style={{ padding: 8, width: 320 }} />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button onClick={loadOwner}>1) Load My Owner Sub</button>
        <button onClick={createOne}>2) Create Affiliation</button>
        <button onClick={listMine}>3) List My Affiliations</button>
      </div>

      <pre style={{ marginTop: 16, background: '#f6f6f6', padding: 12 }}>
        ownerSub: {ownerSub || '(click "Load My Owner Sub")'}
      </pre>
    </div>
  )
}
