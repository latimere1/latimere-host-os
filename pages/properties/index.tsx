// pages/properties/index.tsx
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listProperties } from '../../src/graphql/queries';
import { createProperty } from '../../src/graphql/mutations';

const client = generateClient();

export default function Properties() {
  const [items, setItems] = useState<any[]>([]);

  // Fetch properties (filter out corrupted/null entries)
  async function load() {
    try {
      const result: any = await client.graphql({
        query: listProperties,
        authMode: 'userPool',
      });

      const rawItems = result.data?.listProperties?.items ?? [];

      // Filter out items with null required fields
      const filtered = rawItems.filter(
        (p: any) => p && p.name && p.address && typeof p.sleeps === 'number'
      );

      setItems(filtered);
    } catch (err) {
      console.error("Failed to load properties:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Create demo property (no ownerId!)
  async function addDemo() {
    try {
      await client.graphql({
        query: createProperty,
        variables: {
          input: {
            name: 'Demo Cabin',
            address: '123 Test Lane',
            sleeps: 4,
          },
        },
        authMode: 'userPool',
      });
      await load();
    } catch (err) {
      console.error("Add demo property failed:", err);
      alert("Failed to create demo property. See console.");
    }
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>My Properties</h1>
      <button onClick={addDemo}>+ Add Demo Property</button>
      <ul>
        {items.map((p: any) => (
          <li key={p.id}>
            {p.name} — {p.address} (Sleeps {p.sleeps})
          </li>
        ))}
      </ul>
    </main>
  );
}
