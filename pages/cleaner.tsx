// pages/cleaner.tsx

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listCleanings, listUnits } from '@/src/graphql/queries';
import { updateCleaning } from '@/src/graphql/mutations';
import Layout from '@/src/components/Layout';
import type { Cleaning } from '@/types/Cleaning';

const client = generateClient();
const CLEANER_NAME = 'Taylor';

export default function CleanerDashboard() {
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitMap, setUnitMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cleaningRes, unitRes] = await Promise.all([
          client.graphql({ query: listCleanings, variables: {}, authMode: 'userPool' }),
          client.graphql({ query: listUnits, variables: {}, authMode: 'userPool' })
        ]);

        const unitItems = unitRes?.data?.listUnits?.items ?? [];
        const unitNameMap: Record<string, string> = {};
        unitItems.forEach((u: any) => {
          if (u?.id && u?.name) {
            unitNameMap[u.id] = u.name;
          }
        });
        setUnitMap(unitNameMap);

        const rawItems = cleaningRes?.data?.listCleanings?.items ?? [];
        const filtered = rawItems
          .filter((c: any) =>
            (c.assignedTo || '').toLowerCase() === CLEANER_NAME.toLowerCase() &&
            (c.status || '').toLowerCase() !== 'completed' &&
            c?.date
          )
          .map((c: any) => ({
            id: c.id,
            unitID: c.unitID,
            date: c.date,
            scheduledDate: c.scheduledDate || c.date,
            status: c.status,
            assignedTo: c.assignedTo,
          }));

        setCleanings(filtered);
      } catch (err) {
        console.error('❌ Error loading cleaner tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkComplete = async (id: string) => {
    try {
      await client.graphql({
        query: updateCleaning,
        variables: {
          input: {
            id,
            status: 'completed',
          },
        },
        authMode: 'userPool',
      });
      setCleanings(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('❌ Failed to mark complete:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Cleaner Dashboard</h1>
        {loading ? (
          <p>Loading tasks...</p>
        ) : cleanings.length === 0 ? (
          <p className="text-gray-500">No upcoming cleanings.</p>
        ) : (
          <ul className="space-y-3">
            {cleanings.map((c) => (
              <li key={c.id} className="border p-4 rounded shadow-sm bg-white">
                <p><strong>Date:</strong> {c.scheduledDate?.split('T')[0]}</p>
                <p><strong>Unit:</strong> {unitMap[c.unitID] || 'Unknown'}</p>
                <p><strong>Status:</strong> {c.status}</p>
                <button
                  onClick={() => handleMarkComplete(c.id)}
                  className="mt-2 inline-block bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Mark Complete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}