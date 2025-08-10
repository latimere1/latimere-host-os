// pages/properties/index.tsx

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { createProperty } from '@/graphql/mutations';
import { listProperties } from '@/graphql/queries';
import type { Property } from '@/types/Property';
import Layout from '@/src/components/Layout';

const client = generateClient();

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newSleeps, setNewSleeps] = useState<number | ''>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      const { userId } = await getCurrentUser();

      const res = await client.graphql({
        query: listProperties,
        variables: {
          filter: {
            owner: { eq: userId },
          },
        },
        authMode: 'userPool',
      });

      const rawItems = res?.data?.listProperties?.items ?? [];

      const cleanItems = rawItems.filter(
        (item: any): item is Property =>
          item &&
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.address === 'string' &&
          typeof item.sleeps === 'number'
      );

      setProperties(cleanItems);
    } catch (err: any) {
      console.error('❌ Error fetching properties:', err);
      setProperties([]);
      setErrorMessage('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreateProperty = async () => {
    const name = newPropertyName.trim();
    const address = newAddress.trim();
    const sleeps = typeof newSleeps === 'number' ? newSleeps : parseInt(String(newSleeps));

    if (!name || !address || isNaN(sleeps) || sleeps <= 0) {
      alert('⚠️ Please fill in all fields correctly.');
      return;
    }

    try {
      const { userId } = await getCurrentUser();

      await client.graphql({
        query: createProperty,
        variables: {
          input: {
            name,
            address,
            sleeps,
            owner: userId,
          },
        },
        authMode: 'userPool',
      });

      setNewPropertyName('');
      setNewAddress('');
      setNewSleeps('');
      fetchProperties();
    } catch (err) {
      console.error('❌ Error creating property:', err);
      alert('Failed to create property.');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Properties</h1>

        {errorMessage && (
          <p className="text-red-600 mb-4">{errorMessage}</p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading properties...</p>
        ) : properties.length === 0 ? (
          <p className="text-gray-500">No properties found.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {properties.map((property) => (
              <li
                key={property.id}
                className="bg-gray-100 p-4 rounded shadow-sm hover:shadow-md"
              >
                <Link
                  href={`/properties/${property.id}`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {property.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-medium mb-2">Add a New Property</h2>
          <div className="flex flex-col space-y-4">
            <input
              type="text"
              placeholder="Property name"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
              required
            />
            <input
              type="number"
              placeholder="Sleeps"
              value={newSleeps}
              onChange={(e) => setNewSleeps(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
              min={1}
              required
            />
            <button
              onClick={handleCreateProperty}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Property
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
