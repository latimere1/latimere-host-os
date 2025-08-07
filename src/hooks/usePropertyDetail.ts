import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { listCleanings } from '@/graphql/queries';
import type { Property, Cleaning } from '@/types/Property';

const client = generateClient();

export function usePropertyDetail(id: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [cleanings, setCleanings] = useState<Cleaning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperty = useCallback(async () => {
    if (!id) return;

    try {
      const res = await client.graphql({
        query: /* GraphQL */ `
          query GetProperty($id: ID!) {
            getProperty(id: $id) {
              id
              name
              address
              owner
              createdAt
              updatedAt
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
        `,
        variables: { id },
        authMode: 'userPool',
      });

      const fetched = res.data.getProperty;
      setProperty(fetched);

      const unitIds = fetched.units?.items?.map((u: any) => u.id) ?? [];
      const unitMap = new Map(fetched.units?.items.map((u: any) => [u.id, u.name]));

      const cleaningRes = await client.graphql({
        query: listCleanings,
        variables: {},
        authMode: 'userPool',
      });

      const raw = cleaningRes?.data?.listCleanings?.items ?? [];
      const filtered = raw.filter((c: any) => unitIds.includes(c?.unitID)).map((c: any) => ({
        ...c,
        unitName: unitMap.get(c.unitID) || 'Unknown',
        normalizedStatus: (c.status || '').toLowerCase(),
      }));

      setCleanings(filtered);
    } catch (err) {
      console.error('❌ Failed to fetch property or cleanings', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { property, setProperty, cleanings, loading, fetchProperty };
}
