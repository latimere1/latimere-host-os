// pages/signin.tsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'

export default function SignIn() {
  const router = useRouter()

  // Where to go after auth
  const next = useMemo(
    () => (typeof router.query.next === 'string' && router.query.next) || '/community',
    [router.query.next]
  )

  // Watch auth status and redirect on success
  const { authStatus, user } = useAuthenticator((ctx) => [ctx.authStatus, ctx.user])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      console.log('✅ Authenticated — redirecting', { next, username: user?.username })
      router.replace(next)
    }
  }, [authStatus, next, router, user?.username])

  return (
    <>
      <Head>
        <title>Sign in · Latimere</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>

        {/* No custom `services` overrides — avoids `nextStep` errors */}
        <Authenticator
          // You can tweak these to your flow
          initialState="signIn"
          loginMechanisms={['email']}
          signUpAttributes={['email']}
        />

        <p className="mt-4 text-sm text-slate-600">
          After you sign in you’ll be sent to <code>{next}</code>.
        </p>
      </div>
    </>
  )
}
