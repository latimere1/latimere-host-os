import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listProperties } from '../../src/graphql/queries';
import { createProperty } from '../../src/graphql/mutations';
import { fetchAuthSession } from 'aws-amplify/auth';

const client = generateClient();

export default function Properties() {
  const [items, setItems] = useState<any[]>([]);

  // fetch properties owned by the signed‑in user
  async function load() {
    const { data } = await client.graphql({
      query: listProperties,
      authMode: 'userPool',
    });
    setItems(data.listProperties?.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  // create a demo property for the current owner
  async function addDemo() {
    const { tokens } = await fetchAuthSession();
    const ownerId = tokens?.accessToken?.payload.sub ?? 'unknown';

    await client.graphql({
      query: createProperty,
      variables: { input: { name: 'Demo Cabin', ownerId } },
      authMode: 'userPool',
    });

    await load();
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>My Properties</h1>
      <button onClick={addDemo}>+ Add Demo Property</button>
      <ul>
        {items.map((p: any) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </main>
  );
}

