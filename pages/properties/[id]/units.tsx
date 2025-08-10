import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getProperty, listUnits } from '../../../src/graphql/queries';
import { createUnit, updateUnit, deleteUnit } from '../../../src/graphql/mutations';

const client = generateClient();

export default function UnitsPage() {
  const router = useRouter();
  const { id: propertyId } = router.query;

  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', sleeps: 1 });
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    (async () => {
      const propRes = await client.graphql({
        query: getProperty,
        variables: { id: propertyId },
        authMode: 'userPool',
      });
      setProperty(propRes.data.getProperty);
    })();
  }, [propertyId]);

  useEffect(() => {
    if (!propertyId) return;
    (async () => {
      const unitRes = await client.graphql({
        query: listUnits,
        variables: {
          filter: {
            propertyUnitsId: { eq: propertyId },
          },
        },
        authMode: 'userPool',
      });
      setUnits(unitRes.data.listUnits.items);
    })();
  }, [propertyId]);

  const saveUnit = async () => {
    const payload = {
      name: form.name.trim(),
      sleeps: parseInt(form.sleeps as any, 10),
      propertyUnitsId: propertyId,
      id: editing?.id,
    };

    const mutation = editing ? updateUnit : createUnit;

    await client.graphql({
      query: mutation,
      variables: {
        input: payload,
      },
      authMode: 'userPool',
    });

    setForm({ name: '', sleeps: 1 });
    setEditing(null);
    const unitRes = await client.graphql({
      query: listUnits,
      variables: {
        filter: {
          propertyUnitsId: { eq: propertyId },
        },
      },
      authMode: 'userPool',
    });
    setUnits(unitRes.data.listUnits.items);
  };

  const removeUnit = async (unitId: string) => {
    await client.graphql({
      query: deleteUnit,
      variables: { input: { id: unitId } },
      authMode: 'userPool',
    });
    setUnits(units.filter((u) => u.id !== unitId));
  };

  if (!property) return <main style={{ padding: 32 }}>Loading property...</main>;

  return (
    <main style={{ padding: 32 }}>
      <h1>Units for {property.name}</h1>

      <div style={{ marginBottom: 24 }}>
        <input
          placeholder="Unit Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ marginRight: 8 }}
        />
        <input
          type="number"
          min={1}
          placeholder="Sleeps"
          value={form.sleeps}
          onChange={(e) => setForm({ ...form, sleeps: parseInt(e.target.value) })}
          style={{ marginRight: 8 }}
        />
        <button onClick={saveUnit}>{editing ? 'Save' : 'Add Unit'}</button>
        {editing && (
          <button onClick={() => {
            setEditing(null);
            setForm({ name: '', sleeps: 1 });
          }} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </div>

      <ul>
        {units.map((unit) => (
          <li key={unit.id}>
            {unit.name} — Sleeps {unit.sleeps}
            <button
              onClick={() => {
                setForm({ name: unit.name, sleeps: unit.sleeps });
                setEditing(unit);
              }}
              style={{ marginLeft: 10, color: 'blue' }}
            >
              Edit
            </button>
            <button
              onClick={() => removeUnit(unit.id)}
              style={{ marginLeft: 10, color: 'red' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
