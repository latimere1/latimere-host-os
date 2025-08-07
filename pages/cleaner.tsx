// pages/cleaner.tsx
// ---------------------------------------------------------------------------
// Cleaner dashboard — lists this user’s cleanings and lets them mark jobs done
// Only users with role "cleaner" may reach this page (withRole guard)
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { generateClient }      from 'aws-amplify/api';
import { getCurrentUser }      from 'aws-amplify/auth';

import { listCleanings, listUnits } from '@/graphql/queries';
import { updateCleaning }           from '@/graphql/mutations';

import Layout            from '@/components/Layout';
import CleaningCalendar  from '@/components/CleaningCalendar';
import { withRole }      from '@/components/withRole';

/** Use the exact same interface CleaningCalendar expects */
import type { Cleaning } from '@/components/CleaningCalendar';

const client = generateClient({ authMode: 'userPool' });

function CleanerDashboard() {
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Load tasks on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        console.log('[Cleaner] fetching tasks …');

        /** 1️⃣  Get every Cleaning row */
        const cRes: any   = await client.graphql({ query: listCleanings });
        const all: any[]  = cRes?.data?.listCleanings?.items ?? [];

        /** 2️⃣  Build a map { unitID → unitName } */
        const uRes: any   = await client.graphql({ query: listUnits });
        const units: Record<string, string> = {};
        (uRes?.data?.listUnits?.items ?? []).forEach((u: any) => {
          units[u.id] = u.name;
        });

        /** 3️⃣  Current cleaner’s e-mail */
        const { username: myEmail } = await getCurrentUser();

        /** 4️⃣  Normalise + keep only scheduled/completed rows for this cleaner */
        const normalised: Cleaning[] = all
          .filter((c) => c.assignedTo === myEmail)
          .map((c) => {
            const raw   = c.scheduledDate || c.date;
            const status = (c.status || '').toLowerCase() as Cleaning['status'];

            if (status !== 'scheduled' && status !== 'completed') return null; // drop "missed"

            return {
              id:            c.id,
              unitID:        c.unitID,
              scheduledDate: raw.split('T')[0],   // YYYY-MM-DD
              date:          raw,
              status,
              assignedTo:    myEmail,
              unitName:      units[c.unitID] ?? 'Unknown',
            };
          })
          .filter(Boolean) as Cleaning[];

        setCleanings(normalised);
      } catch (err) {
        console.error('❌ [Cleaner] load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Mark a cleaning complete ─────────────────────────────────────────────
  const markComplete = async (id: string) => {
    try {
      await client.graphql({
        query: updateCleaning,
        variables: { input: { id, status: 'completed' } },
      });
      setCleanings((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'completed' } : c))
      );
    } catch (err) {
      console.error('❌ [Cleaner] updateCleaning error:', err);
      alert('Failed to mark complete — see console.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout title="My Cleanings">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Assigned Cleanings</h1>

        {loading ? (
          <p>Loading…</p>
        ) : cleanings.length ? (
          <>
            <CleaningCalendar cleanings={cleanings} />

            <ul className="mt-8 space-y-2">
              {cleanings.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between bg-gray-100 p-3 rounded"
                >
                  <span>
                    {c.scheduledDate} — {c.unitName} ({c.status})
                  </span>

                  {c.status !== 'completed' && (
                    <button
                      onClick={() => markComplete(c.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Mark complete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">You have no assigned cleanings.</p>
        )}
      </div>
    </Layout>
  );
}

/* Guard page so only cleaners can reach it */
export default withRole(['cleaner'])(CleanerDashboard);
