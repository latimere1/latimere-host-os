import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listCleanings } from '@/src/graphql/queries';
import { updateCleaning } from '@/src/graphql/mutations';
import type { Cleaning } from '@/types/Cleaning';
import Layout from '@/src/components/Layout';

const client = generateClient();

export default function CleanerDashboard() {
  const router = useRouter();
  const { name } = router.query;

  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCleanings = async () => {
    if (!name || typeof name !== 'string') return;

    try {
      const res = await client.graphql({
        query: listCleanings,
        variables: {
          filter: {
            assignedTo: { eq: name },
            status: { eq: 'scheduled' },
          },
        },
        authMode: 'userPool',
      });

      const items = res?.data?.listCleanings?.items ?? [];
      setCleanings(items);
    } catch (err) {
      console.error('❌ Error fetching cleaner tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (id: string) => {
    try {
      await client.graphql({
        query: updateCleaning,
        variables: {
          input: { id, status: 'completed' },
        },
        authMode: 'userPool',
      });
      fetchCleanings(); // Refresh after completion
    } catch (err) {
      console.error('❌ Error marking cleaning complete:', err);
    }
  };

  useEffect(() => {
    fetchCleanings();
  }, [name]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Cleaner Dashboard</h1>

        {typeof name !== 'string' ? (
          <p className="text-red-500">No cleaner name provided in URL. Example: /cleaner?name=Taylor</p>
        ) : loading ? (
          <p>Loading cleaning tasks for {name}...</p>
        ) : cleanings.length === 0 ? (
          <p className="text-gray-600">No cleaning tasks assigned to {name}.</p>
        ) : (
          <ul className="space-y-4">
            {cleanings.map((task) => (
              <li key={task.id} className="border p-4 rounded shadow-sm bg-white">
                <p><strong>Unit ID:</strong> {task.unitID}</p>
                <p><strong>Date:</strong> {task.date}</p>
                <p><strong>Status:</strong> {task.status}</p>
                <button
                  onClick={() => markComplete(task.id)}
                  className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
