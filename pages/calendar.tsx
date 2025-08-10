// pages/calendar.tsx
// ────────────────────────────────────────────────────────────────────────────
// Global cleaning-calendar view.
// • Fetches ALL Cleaning records
// • Lets user filter by cleaner or status
// • Works for any signed-in role (no RBAC wrapper needed)
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';

import { listCleanings }   from '@/graphql/queries';          // <- alias = src/*
import Layout              from '@/src/components/Layout';
import CleaningCalendar     from '@/src/components/CleaningCalendar';
import type { Cleaning }    from '@/types/Cleaning';

const client = generateClient({ authMode: 'userPool' });

export default function CalendarPage() {
  const [cleanings, setCleanings]       = useState<Cleaning[]>([]);
  const [filtered,  setFiltered]        = useState<Cleaning[]>([]);
  const [loading,   setLoading]         = useState(true);
  const [cleanerFilter, setCleanerFilter] = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  // ── Fetch all cleanings ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      console.log('[Calendar] fetching cleanings…');
      try {
        const res: any = await client.graphql({ query: listCleanings });
        const items: any[] = res?.data?.listCleanings?.items ?? [];
        console.log(`[Calendar] got ${items.length} raw items`);

        const normalised: Cleaning[] = items
          .filter((c) => c && c.id && c.unitID && (c.scheduledDate || c.date))
          .map((c) => ({
            id:            c.id,
            unitID:        c.unitID,
            scheduledDate: (c.scheduledDate || c.date).split('T')[0],
            status:        (c.status || '').toLowerCase() as Cleaning['status'],
            assignedTo:    c.assignedTo || '',
            unitName:      c.unit?.name || 'Unknown',
          }));

        setCleanings(normalised);
        setFiltered(normalised);
      } catch (err) {
        console.error('❌ [Calendar] listCleanings error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Apply in-memory filters whenever inputs change ───────────────────────
  useEffect(() => {
    let list = cleanings;

    if (cleanerFilter.trim()) {
      const term = cleanerFilter.toLowerCase();
      list = list.filter((c) => (c.assignedTo ?? '').toLowerCase().includes(term));
    }
    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter);
    }
    setFiltered(list);
  }, [cleanerFilter, statusFilter, cleanings]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout title="Cleaning Calendar">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Cleaning Calendar</h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Filter by cleaner e-mail"
            value={cleanerFilter}
            onChange={(e) => setCleanerFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-[#1E1E1E] text-white"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-[#1E1E1E] text-white"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading cleanings…</p>
        ) : filtered.length > 0 ? (
          <CleaningCalendar cleanings={filtered} />
        ) : (
          <p className="text-gray-500">No cleanings match the current filters.</p>
        )}
      </div>
    </Layout>
  );
}