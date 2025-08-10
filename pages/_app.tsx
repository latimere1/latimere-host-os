// pages/_app.tsx
import '../styles/globals.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// ───────────────────────────────────────────────────────────
// Amplify configure (idempotent) with CI‑safe fallbacks
// We AVOID a static `import '../src/aws-exports'` so the build
// won’t fail when that file isn’t present in CI.
let __amplifyConfigured = false;

function configureAmplifyOnce() {
  if (__amplifyConfigured) return;
  __amplifyConfigured = true;

  // 1) Try JSON from env (copy/paste your aws-exports content into NEXT_PUBLIC_AMPLIFY_JSON)
  const envJson = process.env.NEXT_PUBLIC_AMPLIFY_JSON;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson);
      console.log('🔧 Amplify.configure from NEXT_PUBLIC_AMPLIFY_JSON');
      Amplify.configure({ ...parsed, ssr: true });
      console.log('✅ Amplify configured (env JSON)');
      return;
    } catch (e) {
      console.error('❌ Failed to parse NEXT_PUBLIC_AMPLIFY_JSON:', e);
    }
  }

  // 2) Try to require local ../src/aws-exports on the server only, without letting webpack see the path
  if (typeof window === 'undefined') {
    try {
      // prevent static analysis: do NOT turn this into a normal import
      // eslint-disable-next-line no-eval
      const req: NodeRequire = eval('require');
      const maybe = req('../src/aws-exports'); // will work if the file exists on the build host
      const cfg = maybe?.default ?? maybe;
      if (cfg && typeof cfg === 'object') {
        console.log('🔧 Amplify.configure from server aws-exports');
        Amplify.configure({ ...cfg, ssr: true });
        console.log('✅ Amplify configured (server aws-exports)');
        return;
      }
      console.warn('ℹ️ Server aws-exports was found but not an object:', cfg);
    } catch (e) {
      console.warn('ℹ️ No server aws-exports available (this is OK in CI):', (e as any)?.message || e);
    }
  }

  // 3) Last resort: skip config (public pages still work); gated areas will show auth errors
  console.warn(
    '⚠️ Amplify was NOT configured. ' +
      'Public pages will work, but authenticated features require either NEXT_PUBLIC_AMPLIFY_JSON ' +
      'or checking in aws-exports (not recommended) or providing it on the build host.'
  );
}

try {
  console.log('🔎 Amplify bootstrap starting… (NODE_ENV:', process.env.NODE_ENV, ')');
  configureAmplifyOnce();
} catch (e) {
  console.error('❌ Amplify bootstrap failed:', e);
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Route change logging (handy for debugging)
  useEffect(() => {
    const onStart = (url: string) => {
      console.log(`🧭 routeChangeStart → ${url}`);
      console.time?.(`⏱ route → ${url}`);
    };
    const onComplete = (url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`);
      console.log(`✅ routeChangeComplete → ${url}`);
    };
    const onError = (err: any, url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`);
      console.error(`❌ routeChangeError → ${url}`, err);
    };

    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onComplete);
    router.events.on('routeChangeError', onError);

    console.log(`🚀 App mounted | path: ${router.asPath}`);

    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onComplete);
      router.events.off('routeChangeError', onError);
    };
  }, [router]);

  return (
    <>
      {/* Safe defaults; individual pages can override with their own <Head> */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Latimere Host OS</title>
      </Head>

      {/* Keep Auth context even if not configured; components will no-op gracefully */}
      <Authenticator.Provider>
        <Component {...pageProps} />
      </Authenticator.Provider>
    </>
  );
}
