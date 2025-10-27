// pages/_app.tsx
import '../styles/globals.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

import { Amplify } from 'aws-amplify'
import awsExports from '../src/aws-exports'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

/**
 * --------------------------
 * Amplify configuration
 * --------------------------
 * Configure Amplify exactly once. Prefer NEXT_PUBLIC_AMPLIFY_JSON in prod,
 * otherwise fall back to checked-in aws-exports for dev.
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

/**
 * --------------------------
 * Google Tag (gtag.js)
 * --------------------------
 * Use NEXT_PUBLIC_GTAG_ID if set; otherwise we fall back to your current ID.
 * Example env: NEXT_PUBLIC_GTAG_ID=G-06XK5B7HD2
 */
const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID || 'G-06XK5B7HD2'

// Safe wrappers so we don't throw if tag isn't ready yet
function gtag(...args: any[]) {
  if (typeof window !== 'undefined') {
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(args)
  }
}

function sendPageview(path: string) {
  if (!GTAG_ID) return
  if (typeof window === 'undefined' || !(window as any).gtag) {
    console.warn('ℹ️ gtag not ready, queuing pageview for:', path)
    gtag('js', new Date()) // queue anyway
    gtag('config', GTAG_ID, { page_path: path })
    return
  }
  ;(window as any).gtag('config', GTAG_ID, { page_path: path })
  console.log('📊 GA pageview sent:', path)
}

/**
 * Small helper to fire a "lead" conversion from anywhere in the app.
 * Call window.latimereTrackLead('airbnb_quote_form') after a successful submit.
 * If you later create an Ads conversion with `send_to`, swap the event below.
 */
function attachLeadHelper() {
  if (typeof window === 'undefined') return
  ;(window as any).latimereTrackLead = (label?: string) => {
    try {
      const payload: any = { event_category: 'engagement', value: 1 }
      if (label) payload.event_label = label
      if ((window as any).gtag) {
        ;(window as any).gtag('event', 'generate_lead', payload)
        console.log('✅ Lead event fired:', payload)
      } else {
        // queue via dataLayer; will still be picked up once gtag loads
        gtag('event', 'generate_lead', payload)
        console.warn('ℹ️ gtag not ready; lead event queued:', payload)
      }
    } catch (err) {
      console.error('❌ Failed to fire lead event:', err)
    }
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Route-change logging + GA pageviews
  useEffect(() => {
    const onStart = (url: string) => {
      console.log(`🧭 routeChangeStart → ${url}`)
      console.time?.(`⏱ route → ${url}`)
    }
    const onComplete = (url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.log(`✅ routeChangeComplete → ${url}`)
      sendPageview(url)
    }
    const onError = (err: unknown, url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.error(`❌ routeChangeError → ${url}`, err)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onComplete)
    router.events.on('routeChangeError', onError)

    console.log(`🚀 App mounted (env: ${process.env.NODE_ENV}) | path: ${router.asPath}`)
    attachLeadHelper() // expose window.latimereTrackLead

    // Send initial pageview
    sendPageview(router.asPath)

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

      {/* Google tag (loads once, non-blocking) */}
      {GTAG_ID && (
        <>
          <Script
            id="gtag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
            strategy="afterInteractive"
            onLoad={() => console.log('📦 gtag.js loaded')}
            onError={(e) => console.error('❌ Failed to load gtag.js', e)}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GTAG_ID}', { page_path: window.location.pathname });
              console.log('🧭 GA initialized with ID: ${GTAG_ID}');
            `}
          </Script>
        </>
      )}

      {/* Amplify Auth context everywhere */}
      <Authenticator.Provider>
        <Component {...pageProps} />
      </Authenticator.Provider>
    </>
  )
}

/**
 * Usage in your form submit (after success):
 *   if (typeof window !== 'undefined' && (window as any).latimereTrackLead) {
 *     (window as any).latimereTrackLead('airbnb_quote_form')
 *   }
 *
 * If you switch to a Google Ads "send_to" conversion later, replace the helper to:
 *   window.gtag?.('event', 'conversion', { send_to: 'AW-XXXX/labelYY' })
 */
