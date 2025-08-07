// pages/properties/[id]/index.tsx
// ----------------------------------------------------------------------------
// Latimere Host OS – Property-detail page
// Only users with role “admin” or “owner” may access this page.
// All others (e.g. “cleaner”) are redirected to /cleanings automatically
// via the withRole HOC.
// ----------------------------------------------------------------------------

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser }   from 'aws-amplify/auth';

import {
  createUnit,
  updateUnit,
  deleteUnit,
  updateCleaning,
  deleteProperty,
  updateProperty,
  createRevenueRecord,
} from '@/src/graphql/mutations';

import {
  listCleanings,
  listRevenueRecords,
} from '@/src/graphql/queries';

import type { Property, Unit }       from '@/src/types/Property';
import type { Cleaning }             from '@/src/types/Cleaning';
import type { RevenueRecord }        from '@/src/types/RevenueRecord';

import Layout              from '@/src/components/Layout';
import CleaningCalendar    from '@/src/components/CleaningCalendar';
import PropertyForm        from '@/src/components/PropertyForm';
import UnitForm            from '@/src/components/UnitForm';
import RevenueSection      from '@/src/components/RevenueSection';
import { withRole }        from '@/src/components/withRole';

const client = generateClient({ authMode: 'userPool' });

const GET_PROPERTY = /* GraphQL */ `
  query GetProperty($id: ID!) {
    getProperty(id: $id) {
      id
      name
      address
      owner
      units {
        items {
          id
          name
          sleeps
          price
        }
      }
    }
  }
`;

function PropertyDetailPage() {
  const router      = useRouter();
  const rawId       = router.query.id;
  const propertyId  =
    typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : '';

  // ─────────────────────────────── State ────────────────────────────────────
  const [property,       setProperty]        = useState<Property | null>(null);
  const [cleanings,      setCleanings]       = useState<Cleaning[]>([]);
  const [revenueRecords, setRevenueRecords]  = useState<RevenueRecord[]>([]);
  const [loading,        setLoading]         = useState(true);

  // form state
  const [unitName,     setUnitName]      = useState('');
  const [sleeps,       setSleeps]        = useState(1);
  const [unitPrice,    setUnitPrice]     = useState(0);
  const [editingUnit,  setEditingUnit]   = useState<Unit | null>(null);

  const [propertyName,    setPropertyName]    = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');

  const [revenueMonth,   setRevenueMonth] = useState(
    () => new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [revenueUnitId,  setRevenueUnitId] = useState('');
  const [revenueAmount,  setRevenueAmount] = useState('');

  // ─────────────────────────────── Fetch ─────────────────────────────────────
  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;

    setLoading(true);
    console.log('[PropertyDetail] fetching data for', propertyId);

    try {
      // 1) property + units
      const pRes: any = await client.graphql({
        query: GET_PROPERTY,
        variables: { id: propertyId },
      });

      const prop: Property = pRes.data.getProperty;
      setProperty(prop);
      setPropertyName(prop.name);
      setPropertyAddress(prop.address);

      const unitIds = prop.units.items.map((u) => u.id);

      // 2) cleanings
      const cRes: any = await client.graphql({ query: listCleanings });
      setCleanings(
        cRes.data.listCleanings.items
          .filter((c: any) => unitIds.includes(c.unitID))
          .map((c: any) => ({
            id: c.id,
            unitID: c.unitID,
            scheduledDate: c.date.split('T')[0],
            status: (c.status || '').toLowerCase() as 'scheduled' | 'completed',
            assignedTo: c.assignedTo || '',
            unitName: prop.units.items.find((u) => u.id === c.unitID)?.name || '',
          }))
      );

      // 3) revenue
      const rRes: any = await client.graphql({ query: listRevenueRecords });
      setRevenueRecords(
        (rRes.data.listRevenueRecords.items as RevenueRecord[]).filter(
          (r) => unitIds.includes(r.unitID) && r.month === revenueMonth
        )
      );
    } catch (err) {
      console.error('❌ Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId, revenueMonth]);

  useEffect(() => {
    if (router.isReady) fetchProperty();
  }, [router.isReady, fetchProperty]);

  // ─────────────────────────────── Helpers ───────────────────────────────────
  const resetUnitForm = () => {
    setUnitName('');
    setSleeps(1);
    setUnitPrice(0);
    setEditingUnit(null);
  };

  const getProjectedTotal = () =>
    property?.units.items.reduce((sum, u) => sum + (u.price || 0) * 30, 0) || 0;

  const getActualTotal = () =>
    revenueRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

  // ───────────────────────────── Handlers ────────────────────────────────────
  const handleUpdateProperty = async () => {
    const name = propertyName.trim();
    const addr = propertyAddress.trim();
    if (!propertyId || !name || !addr) return;

    await client.graphql({
      query: updateProperty,
      variables: { input: { id: propertyId, name, address: addr } },
    });
    fetchProperty();
  };

  const handleDeleteProperty = async () => {
    if (!confirm('Delete this property?')) return;
    await client.graphql({
      query: deleteProperty,
      variables: { input: { id: propertyId } },
    });
    router.push('/properties');
  };

  const handleMarkComplete = async (c: Cleaning) => {
    await client.graphql({
      query: updateCleaning,
      variables: {
        input: {
          id: c.id,
          unitID: c.unitID,
          date: c.scheduledDate,
          status: 'completed',
          assignedTo: c.assignedTo || null,
        },
      },
    });
    fetchProperty();
  };

  const handleAddOrUpdateUnit = async () => {
    const name = unitName.trim();
    if (!propertyId || !name || sleeps < 1) return;
    const { userId } = await getCurrentUser();

    if (editingUnit) {
      await client.graphql({
        query: updateUnit,
        variables: {
          input: { id: editingUnit.id, name, sleeps, price: unitPrice },
        },
      });
    } else {
      await client.graphql({
        query: createUnit,
        variables: {
          input: {
            name,
            sleeps,
            price: unitPrice,
            icalURL: null,
            propertyID: propertyId,
            owner: userId,
          },
        },
      });
    }

    resetUnitForm();
    fetchProperty();
  };

  const handleDeleteUnit = async (uid: string) => {
    if (!confirm('Delete this unit?')) return;
    await client.graphql({
      query: deleteUnit,
      variables: { input: { id: uid } },
    });
    fetchProperty();
  };

  const handleAddRevenue = async () => {
    if (!revenueUnitId || !revenueMonth || !revenueAmount) return;
    const { userId } = await getCurrentUser();

    await client.graphql({
      query: createRevenueRecord,
      variables: {
        input: {
          unitID: revenueUnitId,
          month: revenueMonth,
          amount: parseFloat(revenueAmount),
          owner: userId,
        },
      },
    });

    setRevenueUnitId('');
    setRevenueAmount('');
    fetchProperty();
  };

  // ───────────────────────────── Render ──────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading…</div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="p-6 text-red-500">Property not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <Link
          href="/properties"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to properties
        </Link>

        <h1 className="text-3xl font-bold mb-4">Edit Property</h1>

        {/* ───────────────────── Property form ───────────────────── */}
        <PropertyForm
          propertyName={propertyName}
          setPropertyName={setPropertyName}
          propertyAddress={propertyAddress}
          setPropertyAddress={setPropertyAddress}
          handleUpdateProperty={handleUpdateProperty}
          handleDeleteProperty={handleDeleteProperty}
        />

        {/* ───────────────────── Unit form ───────────────────────── */}
        <UnitForm
          unitName={unitName}
          setUnitName={setUnitName}
          sleeps={sleeps}
          setSleeps={setSleeps}
          unitPrice={unitPrice}
          setUnitPrice={setUnitPrice}
          handleAddOrUpdateUnit={handleAddOrUpdateUnit}
        />

        {/* ───────────────────── Units list ──────────────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Units</h2>

          {property.units.items.length > 0 ? (
            <ul className="space-y-4">
              {property.units.items.map((u) => (
                <li
                  key={u.id}
                  className="flex justify-between items-center p-4 border rounded shadow"
                >
                  <div>
                    <Link
                      href={`/units/${u.id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      {u.name}
                    </Link>
                    <p className="text-gray-600">
                      Sleeps {u.sleeps}
                      {u.price != null && ` — $${u.price}/night`}
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setEditingUnit(u);
                        setUnitName(u.name);
                        setSleeps(u.sleeps);
                        setUnitPrice(u.price ?? 0);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteUnit(u.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No units yet.</p>
          )}
        </section>

        {/* ───────────────────── Cleaning calendar ───────────────── */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Cleaning Calendar</h2>

          {cleanings.length > 0 ? (
            <CleaningCalendar
              cleanings={cleanings}
              onMarkComplete={handleMarkComplete}
            />
          ) : (
            <p className="text-gray-500">No cleanings scheduled.</p>
          )}
        </section>

        {/* ───────────────────── Revenue ─────────────────────────── */}
        <section className="mt-12">
          <RevenueSection
            property={property}
            revenueMonth={revenueMonth}
            setRevenueMonth={setRevenueMonth}
            revenueUnitId={revenueUnitId}
            setRevenueUnitId={setRevenueUnitId}
            revenueAmount={revenueAmount}
            setRevenueAmount={setRevenueAmount}
            handleAddRevenue={handleAddRevenue}
            revenueRecords={revenueRecords}
            getProjectedTotal={getProjectedTotal}
            getActualTotal={getActualTotal}
          />
        </section>
      </div>
    </Layout>
  );
}

// Only “admin” & “owner” may access; others are redirected to /cleanings
export default withRole(['admin', 'owner'], '/cleanings')(PropertyDetailPage);
