// pages/units/index.tsx
import { useEffect, useState }                          from 'react'
import { generateClient }                               from 'aws-amplify/api'
import { Auth }                                         from 'aws-amplify'
import { listUnits, listProperties }                    from '@/graphql/queries'
import { createUnit }                                   from '@/graphql/mutations'
import { withRole }                                     from '@/src/components/withRole'

const client = generateClient({ authMode: 'userPool' })

type UnitForm = {
  name: string
  propertyId: string
  icalUrl: string
}

function UnitsPage() {
  const [units, setUnits]       = useState<any[]>([])
  const [propsList, setProps]   = useState<any[]>([])
  const [form, setForm]         = useState<UnitForm>({
    name: '',
    propertyId: '',
    icalUrl: '',
  })

  // ── load all units & properties ────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      const uRes: any = await client.graphql({
        query: listUnits,
        authMode: 'userPool',
      })
      const pRes: any = await client.graphql({
        query: listProperties,
        authMode: 'userPool',
      })

      setUnits(uRes.data.listUnits.items)
      setProps(pRes.data.listProperties.items)

      // pre-select the first property if none chosen yet
      if (!form.propertyId && pRes.data.listProperties.items.length) {
        setForm(f => ({
          ...f,
          propertyId: pRes.data.listProperties.items[0].id,
        }))
      }
    }

    fetchAll()
  }, [])

  // ── add a new unit ───────────────────────────────────────────────
  async function addUnit() {
    // get the Cognito sub for the current user
    const authUser: any = await Auth.currentAuthenticatedUser()
    const ownerId       = authUser.attributes.sub

    await client.graphql({
      query: createUnit,
      variables: {
        input: {
          name:        form.name,
          propertyID:  form.propertyId,
          icalURL:     form.icalUrl,
          owner:       ownerId,
        },
      },
      authMode: 'userPool',
    })

    // simple reload to refresh the list
    window.location.reload()
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Units</h1>

      <div style={{ margin: '1em 0' }}>
        <input
          placeholder="Unit name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <select
          value={form.propertyId}
          onChange={e => setForm({ ...form, propertyId: e.target.value })}
        >
          {propsList.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          placeholder="iCal URL"
          value={form.icalUrl}
          onChange={e => setForm({ ...form, icalUrl: e.target.value })}
        />

        <button onClick={addUnit}>Add Unit</button>
      </div>

      <ul>
        {units.map(u => (
          <li key={u.id}>
            {u.name} — property {u.propertyID}
          </li>
        ))}
      </ul>
    </main>
  )
}

// only admins & owners can see this page; cleaners are sent to /cleanings
export default withRole(['admin', 'owner'], '/cleanings')(UnitsPage)
