// pages/_app.tsx
import '../styles/globals.css' // ✅ Make sure Tailwind utilities are available everywhere

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { Amplify } from 'aws-amplify'
import awsExports from '../src/aws-exports'

import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

// ───────────────────────────────────────────────────────────
// Initialize Amplify exactly once with extra logging
// (Amplify.configure is idempotent, but we guard & log for sanity)
try {
  // Tiny sanity check that awsExports looks right
  if (!awsExports || typeof awsExports !== 'object') {
    // This helps catch path mistakes like '../aws-exports' vs '../src/aws-exports'
    // without crashing the app.
    // eslint-disable-next-line no-console
    console.error('❌ awsExports is missing or invalid. Received:', awsExports)
  }

  // eslint-disable-next-line no-console
  console.log('🔧 Amplify.configure starting…')
  Amplify.configure(awsExports)
  // eslint-disable-next-line no-console
  console.log('✅ Amplify configured')
} catch (e) {
  // eslint-disable-next-line no-console
  console.error('❌ Amplify.configure failed:', e)
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Route change logging (super useful when debugging nav + guards)
  useEffect(() => {
    const onStart = (url: string) => {
      console.log(`🧭 routeChangeStart → ${url}`)
      console.time?.(`⏱ route → ${url}`)
    }
    const onComplete = (url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.log(`✅ routeChangeComplete → ${url}`)
    }
    const onError = (err: any, url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.error(`❌ routeChangeError → ${url}`, err)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onComplete)
    router.events.on('routeChangeError', onError)

    // Initial mount log
    console.log(
      `🚀 App mounted (env: ${process.env.NODE_ENV}) | path: ${router.asPath}`
    )

    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onComplete)
      router.events.off('routeChangeError', onError)
    }
  }, [router])

  return (
    <>
      {/* Safe defaults; individual pages can override with their own <Head> */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Latimere Host OS</title>
      </Head>

      {/* Make Amplify Auth context available everywhere */}
      <Authenticator.Provider>
        <Component {...pageProps} />
      </Authenticator.Provider>
    </>
  )
}
