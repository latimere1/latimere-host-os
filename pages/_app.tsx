// pages/_app.tsx
import '../styles/globals.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Amplify v6 imports
import { Amplify } from 'aws-amplify'
import { Hub } from 'aws-amplify/utils'

// UI
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

/**
 * -------------------------------------------------------
 * Amplify configuration (robust, idempotent, SSR-ready)
 * Priority: NEXT_PUBLIC_AMPLIFY_JSON → src/aws-exports → aws-exports
 * -------------------------------------------------------
 */
function resolveAmplifyConfig(): { cfg: any; source: string } {
  // 1) env-driven (handy in CI/CD or when swapping stacks)
  const raw = process.env.NEXT_PUBLIC_AMPLIFY_JSON
  if (raw && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return { cfg: parsed, source: 'NEXT_PUBLIC_AMPLIFY_JSON' }
    } catch (e) {
      console.warn('⚠️ Invalid NEXT_PUBLIC_AMPLIFY_JSON; falling back to local exports.', e)
    }
  }

  // 2) local aws-exports (try src/ then project root)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fromSrc = require('../src/aws-exports').default
    return { cfg: fromSrc, source: 'src/aws-exports' }
  } catch {}

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fromRoot = require('../aws-exports').default
    return { cfg: fromRoot, source: 'aws-exports' }
  } catch {}

  console.error('❌ Amplify config not found. Provide NEXT_PUBLIC_AMPLIFY_JSON or aws-exports.')
  return { cfg: {}, source: 'missing' }
}

const { cfg: amplifyCfg, source: amplifySource } = resolveAmplifyConfig()

// Ensure SSR flag for Next.js
try {
  if (amplifyCfg && typeof amplifyCfg === 'object') {
    ;(amplifyCfg as any).ssr = true
  }
} catch { /* no-op */ }

// Configure Amplify once on module init.
// Safe in Next.js when ssr:true is set.
try {
  Amplify.configure(amplifyCfg)
  const endpoint =
    (amplifyCfg as any).aws_appsync_graphqlEndpoint ||
    (amplifyCfg as any)?.API?.GraphQL?.endpoint
  const authType =
    (amplifyCfg as any).aws_appsync_authenticationType ||
    (amplifyCfg as any)?.API?.GraphQL?.defaultAuthMode ||
    'AMAZON_COGNITO_USER_POOLS'

  // Only log endpoints in the browser to avoid noisy server logs
  if (typeof window !== 'undefined') {
    console.log(
      '🔌 Amplify configured from:',
      amplifySource,
      '\n• AppSync:', endpoint,
      '\n• Auth type:', authType
    )
  }
} catch (e) {
  console.error('❌ Amplify.configure failed:', e)
}

/**
 * -------------------------------------------------------
 * Google Tag (gtag.js) helpers
 * -------------------------------------------------------
 */
const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID || 'G-06XK5B7HD2'

// queue-friendly push
function dlPush(...args: any[]) {
  if (typeof window !== 'undefined') {
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).dataLayer.push(args)
  }
}

function sendPageview(path: string) {
  if (!GTAG_ID) return
  if (typeof window === 'undefined' || !(window as any).gtag) {
    dlPush('js', new Date())
    dlPush('config', GTAG_ID, { page_path: path })
    console.warn('ℹ️ gtag not ready, queued pageview:', path)
    return
  }
  ;(window as any).gtag('config', GTAG_ID, { page_path: path })
  console.log('📊 GA pageview:', path)
}

/**
 * -------------------------------------------------------
 * Lightweight telemetry helpers exposed on window
 * -------------------------------------------------------
 */
function attachTelemetryHelpers() {
  if (typeof window === 'undefined') return
  ;(window as any).latimere = (window as any).latimere || {}

  ;(window as any).latimere.trackLead = (label?: string) => {
    const payload: any = { event_category: 'engagement', value: 1 }
    if (label) payload.event_label = label
    try {
      if ((window as any).gtag) {
        (window as any).gtag('event', 'generate_lead', payload)
        console.log('✅ Lead event:', payload)
      } else {
        dlPush('event', 'generate_lead', payload)
        console.warn('ℹ️ gtag not ready; lead queued:', payload)
      }
    } catch (err) {
      console.error('❌ Lead event error:', err)
    }
  }

  ;(window as any).latimere.trackCTA = (label?: string, extras?: Record<string, any>) => {
    const payload: any = { event_category: 'cta', value: 1, ...extras }
    if (label) payload.event_label = label
    try {
      if ((window as any).gtag) {
        (window as any).gtag('event', 'cta_click', payload)
        console.log('✅ CTA event:', payload)
      } else {
        dlPush('event', 'cta_click', payload)
        console.warn('ℹ️ gtag not ready; CTA queued:', payload)
      }
    } catch (err) {
      console.error('❌ CTA event error:', err)
    }
  }

  ;(window as any).latimere.trackCommunity = (
    name: 'post_created' | 'answer_submitted' | 'vote_cast' | 'accepted_answer' | 'comment_added',
    extras?: Record<string, any>
  ) => {
    const payload = { event_category: 'community', value: 1, ...extras }
    try {
      if ((window as any).gtag) {
        ;(window as any).gtag('event', name, payload)
        console.log(`✅ Community event: ${name}`, payload)
      } else {
        dlPush('event', name, payload)
        console.warn(`ℹ️ gtag not ready; community queued: ${name}`, payload)
      }
    } catch (err) {
      console.error(`❌ Community event error: ${name}`, err)
    }
  }
}

/**
 * -------------------------------------------------------
 * Amplify Hub listeners (Auth/API) → console logs
 * -------------------------------------------------------
 */
function attachAmplifyHubLogging() {
  if (typeof window === 'undefined') return

  Hub.listen('auth', ({ payload }) => {
    const { event, data } = payload || {}
    switch (event) {
      case 'signIn':
      case 'cognitoHostedUI':
        console.log('🔐 Auth:', event, data?.username || data)
        break
      case 'signOut':
        console.log('🔐 Auth: signOut')
        break
      case 'tokenRefresh':
        console.log('🔐 Auth: tokenRefresh')
        break
      case 'signIn_failure':
      case 'cognitoHostedUI_failure':
        console.error('❌ Auth failure:', event, data)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          console.log('ℹ️ Auth hub:', event, data)
        }
    }
  })

  Hub.listen('api', ({ payload }) => {
    const { event, data } = payload || {}
    if (event?.toString?.().toLowerCase?.().includes('error')) {
      console.error('❌ API hub error:', event, data)
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('🔗 API hub:', event, data)
    }
  })
}

/**
 * -------------------------------------------------------
 * Global error logging (browser)
 * -------------------------------------------------------
 */
function attachGlobalErrorLogging(routerPath: string) {
  if (typeof window === 'undefined') return

  const onError = (event: ErrorEvent) => {
    console.error('💥 Uncaught error @', routerPath, '\n', event.error ?? event.message)
  }
  const onRejection = (event: PromiseRejectionEvent) => {
    console.error('💥 Unhandled rejection @', routerPath, '\n', event.reason)
  }

  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    const onStart = (url: string) => {
      console.log(`🧭 routeChangeStart → ${url}`)
      console.time?.(`⏱ route → ${url}`)
      try { performance.mark?.('latimere-route-start') } catch {}
    }
    const onComplete = (url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.log(`✅ routeChangeComplete → ${url}`)
      sendPageview(url)
      try {
        performance.mark?.('latimere-route-complete')
        performance.measure?.('latimere-route', 'latimere-route-start', 'latimere-route-complete')
      } catch {}
    }
    const onError = (err: unknown, url: string) => {
      console.timeEnd?.(`⏱ route → ${url}`)
      console.error(`❌ routeChangeError → ${url}`, err)
    }

    router.events.on('routeChangeStart', onStart)
    router.events.on('routeChangeComplete', onComplete)
    router.events.on('routeChangeError', onError)

    console.log(`🚀 App mounted (env: ${process.env.NODE_ENV}) | path: ${router.asPath}`)
    attachTelemetryHelpers()
    attachAmplifyHubLogging()
    const detachGlobal = attachGlobalErrorLogging(router.asPath)

    // Initial pageview
    sendPageview(router.asPath)

    return () => {
      router.events.off('routeChangeStart', onStart)
      router.events.off('routeChangeComplete', onComplete)
      router.events.off('routeChangeError', onError)
      detachGlobal?.()
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
 * Quick usage examples:
 *  - window.latimere.trackLead('facebook_group_reply')
 *  - window.latimere.trackCTA('community_sidebar_consult', { page: location.pathname })
 *  - window.latimere.trackCommunity('post_created', { slug: 'steep-driveway-tips' })
 */
