// src/hooks/useAuthProfile.ts
// ────────────────────────────────────────────────────────────────────────────
// Fetch the signed-in user’s profile (or auto-create it the first time) and
// expose { role, loading } to the rest of the app.
// Lots of console logging is sprinkled throughout so RBAC issues are easy
// to trace in DevTools.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { getCurrentUser }      from 'aws-amplify/auth';
import { generateClient }      from 'aws-amplify/api';

import { getUserProfile }   from '@/graphql/queries';
import { createUserProfile } from '@/graphql/mutations';

export type Role = 'admin' | 'owner' | 'cleaner';
interface UseAuthProfile {
  role:    Role | null;
  loading: boolean;
}

const client = generateClient({ authMode: 'userPool' });

export function useAuthProfile(): UseAuthProfile {
  const [role,    setRole]    = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ── 1. Who is signed in? ────────────────────────────────────────────
        const { username, userId } = await getCurrentUser();   // userId = Cognito sub
        const profileId = username;                            // use email / username as PK
        console.log('[useAuthProfile] Cognito user:', { profileId, userId });

        // ── 2. Try to read the profile ─────────────────────────────────────
        const readRes: any = await client.graphql({
          query: getUserProfile,
          variables: { id: profileId },
        });

        let profile = readRes?.data?.getUserProfile;
        console.log('[useAuthProfile] getUserProfile →', profile ?? 'null');

        // ── 3. Auto-create profile on first login ──────────────────────────
        if (!profile) {
          console.log('[useAuthProfile] profile not found – creating default “cleaner”…');
          const createRes: any = await client.graphql({
            query: createUserProfile,
            variables: {
              input: {
                id:       profileId,       // must match PK in getUserProfile
                username: profileId,
                role:     'cleaner',       // default
                hasPaid:  false,
                owner:    userId,          // needed for owner-based @auth
              },
            },
          });
          profile = createRes?.data?.createUserProfile;
          console.log('[useAuthProfile] created profile →', profile);
        }

        // ── 4. Persist role in state ───────────────────────────────────────
        if (!cancelled && profile?.role) {
          setRole(profile.role as Role);
        }
      } catch (err: any) {
        // Amplify returns a shape { data:{}, errors:[{ message: "...", ... }] }
        console.error(
          '❌ useAuthProfile error – full payload ↓\n',
          JSON.stringify(err, null, 2)
        );
        // fall through; role remains null
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { role, loading };
}
