// pages/_app.tsx
import '../styles/globals.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { Amplify } from 'aws-amplify'
import awsExports from '../src/aws-exports'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

/**
 * Configure Amplify exactly once.
 * If NEXT_PUBLIC_AMPLIFY_JSON is present (prod), use it.
 * Otherwise fall back to the checked-in dev aws-exports.
 */
function loadAmplifyConfig() {
  const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (raw && typeof raw === 'string') {
    try {
      const cfg = JSON.parse(raw)
      return { cfg, source: 'NEXT_PUBLIC_AMPLIFY_JSON' as const }
    } catch (e) {
      console.warn('⚠️ Invalid NEXT_PUBLIC_AMPLIFY_JSON; falling back to aws-exports.', e)
    }
  }
  return { cfg: awsExports as any, source: 'aws-exports (dev)' as const }
}

const { cfg: amplifyCfg, source: amplifySource } = loadAmplifyConfig()

try {
  Amplify.configure(amplifyCfg)
  if (typeof window !== 'undefined') {
    // Helpful runtime visibility (remove later if noisy)
    console.log(
      '🔌 Amplify configured from:',
      amplifySource,
      '\n• AppSync:', (amplifyCfg as any).aws_appsync_graphqlEndpoint,
      '\n• Auth type:', (amplifyCfg as any).aws_appsync_authenticationType || 'AMAZON_COGNITO_USER_POOLS'
    )
  }
} catch (e) {
  console.error('❌ Amplify.configure failed:', e)
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Route-change logging
  useEffect(() => {
    const onStart = (url: string) => {
      console.log(`🧭 routeChangeStart → ${url}`)
      console.time?.(`⏱ route → ${url}`)
    }
    const onComplete = (url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.log(`✅ routeChangeComplete → ${url}`)
    }
    const onError = (err: unknown, url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.error(`❌ routeChangeError → ${url}`, err)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onComplete)
    router.events.on('routeChangeError', onError)

    console.log(`🚀 App mounted (env: ${process.env.NODE_ENV}) | path: ${router.asPath}`)

    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onComplete)
      router.events.off('routeChangeError', onError)
    }
  }, [router])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Latimere Host OS</title>
      </Head>

      {/* Amplify Auth context everywhere */}
      <Authenticator.Provider>
        <Component {...pageProps} />
      </Authenticator.Provider>
    </>
  )
}
