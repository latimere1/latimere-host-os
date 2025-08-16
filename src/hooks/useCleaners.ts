// src/hooks/useCleaners.ts
import { useEffect, useState } from 'react';
import { generateClient }      from 'aws-amplify/api';
import { listUserProfiles }    from '@/graphql/queries';
import type { UserProfile }    from '@/types/UserProfile';

const client = generateClient({ authMode: 'userPool' });

export function useCleaners() {
  const [cleaners, setCleaners] = useState<UserProfile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await client.graphql({ query: listUserProfiles });
        const items: UserProfile[] = res?.data?.listUserProfiles?.items ?? [];
        setCleaners(items.filter(u => u.role === 'cleaner'));
      } catch (e) {
        console.error('[useCleaners] listUserProfiles failed:', e);
        setError('Failed to load cleaners');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { cleaners, loading, error };
}
