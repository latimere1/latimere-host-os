import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listUnits, listProperties } from '../../src/graphql/queries';
import { createUnit } from '../../src/graphql/mutations';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = generateClient();

export default function Units() {
  const [units, setUnits] = useState<any[]>([]);
  const [props, setProps] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', propertyId: '', icalUrl: '' });

  // load units & properties
  useEffect(() => {
    (async () => {
      const u: any = await client.graphql({ query: listUnits, authMode: 'userPool' });
      const p: any = await client.graphql({ query: listProperties, authMode: 'userPool' });
      setUnits(u.data.listUnits.items);
      setProps(p.data.listProperties.items);
      form.propertyId || setForm(f => ({ ...f, propertyId: p.data.listProperties.items[0]?.id ?? '' }));
    })();
  }, []);

  async function addUnit() {
    const { tokens } = await fetchAuthSession();
    const ownerId = tokens?.accessToken?.payload.sub ?? 'unknown';

    await client.graphql({
      query: createUnit,
      variables: { input: { ...form, ownerId } },
      authMode: 'userPool',
    });
    location.reload();
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>Units</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="Unit name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <select
          value={form.propertyId}
          onChange={e => setForm({ ...form, propertyId: e.target.value })}
        >
          {props.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
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
        {units.map((u: any) => (
          <li key={u.id}>
            {u.name} – property {u.propertyId}
          </li>
        ))}
      </ul>
    </main>
  );
}

