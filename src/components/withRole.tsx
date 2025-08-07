// src/components/withRole.tsx
import { useAuthProfile } from '@/src/hooks/useAuthProfile';
import { useRouter }      from 'next/router';
import { useEffect, ComponentType } from 'react';
import type { Role }      from '@/src/hooks/useAuthProfile';

export function withRole(
  allowed: Role[],
  fallback: string = '/properties'
) {
  return function <P>(Wrapped: ComponentType<P>) {
    return function Guarded(props: P) {
      const { role, loading } = useAuthProfile();
      const router            = useRouter();

      console.log('[withRole]', { path: router.pathname, loading, role, allowed });

      useEffect(() => {
        if (loading) return;                   // still fetching profile

        // authorised only if we HAVE a role and it’s in the allowed list
        const authorised = role ? allowed.includes(role) : false;

        if (!authorised) {
          // send cleaners to /cleanings, everyone else to fallback
          const dest =
            role === 'cleaner'
              ? '/cleanings'
              : fallback;

          console.log('[withRole] not authorised, sending →', dest);
          router.replace(dest);
        }
      }, [loading, role, router]);

      // prevent the page flash while we decide
      if (loading) return null;
      if (!role || !allowed.includes(role)) return null;

      return <Wrapped {...props} />;
    };
  };
}
