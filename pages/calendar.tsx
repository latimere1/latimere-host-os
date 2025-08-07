// pages/calendar.tsx
// ---------------------------------------------------------------------------
// Cleaning calendar — now matches CleaningCalendar’s narrower status union
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { generateClient }      from 'aws-amplify/api';

import { listCleanings }       from '@/graphql/queries';
import Layout                  from '@/components/Layout';
import CleaningCalendar        from '@/components/CleaningCalendar';
import type { Cleaning }       from '@/components/CleaningCalendar'; // <- use the same interface

const client = generateClient({ authMode: 'userPool' });

export default function CalendarPage() {
  const [cleanings, setCleanings]      = useState<Cleaning[]>([]);
  const [filtered,  setFiltered]       = useState<Cleaning[]>([]);
  const [loading,   setLoading]        = useState(true);
  const [cleanerFilter, setCleanerFilter] = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'scheduled' | 'completed' | ''>('');

  // ── Fetch all cleanings ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res: any   = await client.graphql({ query: listCleanings });
        const items: any[] = res?.data?.listCleanings?.items ?? [];

        const normalised: Cleaning[] = items
          .filter((c) => c && c.id && c.unitID && (c.scheduledDate || c.date))
          .map((c) => {
            const iso = c.scheduledDate || c.date;
            const status = (c.status || '').toLowerCase();
            // Only include statuses the calendar UI understands
            if (status !== 'scheduled' && status !== 'completed') return null;

            return {
              id:            c.id,
              unitID:        c.unitID,
              scheduledDate: iso.split('T')[0],
              date:          iso,
              status,                                // 'scheduled' | 'completed'
              assignedTo:    c.assignedTo ?? '',
              unitName:      c.unit?.name ?? 'Unknown',
            } as Cleaning;
          })
          .filter(Boolean) as Cleaning[];

        setCleanings(normalised);
        setFiltered(normalised);
      } catch (err) {
        console.error('❌ [Calendar] listCleanings error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Apply filters ────────────────────────────────────────────────────────
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
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-300 rounded px-3 py-2 bg-[#1E1E1E] text-white"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <p>Loading cleanings…</p>
        ) : filtered.length ? (
          <CleaningCalendar cleanings={filtered} />
        ) : (
          <p className="text-gray-500">No cleanings match the current filters.</p>
        )}
      </div>
    </Layout>
  );
}
