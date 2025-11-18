// pages/api/referrals/create.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const debugReferrals = process.env.DEBUG_REFERRAL_INVITES === '1'
const debugEmail = process.env.DEBUG_EMAIL === '1'

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1',
})

const APPSYNC_ENDPOINT = process.env.APPSYNC_GRAPHQL_ENDPOINT!
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY!

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ONBOARDING_BASE_PATH = process.env.NEXT_PUBLIC_ONBOARDING_BASE_PATH || '/onboarding'

const REFERRAL_INVITE_SUBJECT =
  process.env.REFERRAL_INVITE_SUBJECT || "You’ve been referred to Latimere Hosting"
const REFERRAL_INVITE_FROM_NAME =
  process.env.REFERRAL_INVITE_FROM_NAME || 'Latimere Hosting'
const REFERRAL_INVITE_REPLY_TO =
  process.env.REFERRAL_INVITE_REPLY_TO || process.env.SES_FROM || ''

const createReferralMutation = /* GraphQL */ `
  mutation CreateReferral($input: CreateReferralInput!) {
    createReferral(input: $input) {
      id
      inviteToken
      onboardingStatus
    }
  }
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { realtorName, realtorEmail, clientName, clientEmail, notes } = req.body || {}

    if (!realtorName || !realtorEmail || !clientName || !clientEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const inviteToken = crypto.randomBytes(24).toString('hex')

    if (debugReferrals) {
      console.log('[referrals:create] incoming', {
        realtorName,
        realtorEmail,
        clientName,
        clientEmail,
        notes,
        inviteToken,
      })
    }

    // 1) Create referral record in AppSync
    const referralInput = {
      realtorName,
      realtorEmail,
      clientName,
      clientEmail,
      notes,
      inviteToken,
      onboardingStatus: 'INVITED',
      payoutEligible: false,
      payoutSent: false,
      payoutMethod: null,
    }

    const gqlResponse = await fetch(APPSYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': APPSYNC_API_KEY,
      },
      body: JSON.stringify({
        query: createReferralMutation,
        variables: { input: referralInput },
      }),
    })

    const gqlJson = await gqlResponse.json()

    if (gqlJson.errors) {
      console.error('[referrals:create] AppSync error', gqlJson.errors)
      return res.status(500).json({ error: 'Failed to create referral' })
    }

    const referral = gqlJson.data?.createReferral

    if (debugReferrals) {
      console.log('[referrals:create] created referral', referral)
    }

    // 2) Send invite email to the client
    const onboardingUrl = `${APP_URL}${ONBOARDING_BASE_PATH}/${inviteToken}`

    const fromEmail = process.env.SES_FROM!
    const subject = REFERRAL_INVITE_SUBJECT
    const bodyHtml = `
      <p>Hi ${clientName},</p>
      <p>You were referred to <strong>Latimere Hosting</strong> by ${realtorName}.</p>
      <p>We specialize in high-performance short-term rental management in the Smoky Mountains, and we’d love to help you maximize your property’s earnings while keeping it beautifully maintained.</p>
      <p>To get started, please click the link below to complete a quick onboarding:</p>
      <p><a href="${onboardingUrl}" target="_blank" rel="noopener noreferrer">Start your Latimere onboarding</a></p>
      <p>If you have any questions before getting started, just reply to this email.</p>
      <p>— The Latimere Hosting Team</p>
    `

    if (debugEmail) {
      console.log('[email:referralInvite] payload', {
        to: clientEmail,
        from: fromEmail,
        subject,
        onboardingUrl,
      })
    }

    const emailCommand = new SendEmailCommand({
      Source: REFERRAL_INVITE_FROM_NAME
        ? `${REFERRAL_INVITE_FROM_NAME} <${fromEmail}>`
        : fromEmail,
      Destination: {
        ToAddresses: [clientEmail],
        CcAddresses: [realtorEmail], // optional: keep realtor in the loop
      },
      ReplyToAddresses: REFERRAL_INVITE_REPLY_TO ? [REFERRAL_INVITE_REPLY_TO] : [],
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: bodyHtml },
        },
      },
    })

    const emailResult = await ses.send(emailCommand)

    if (debugEmail) {
      console.log('[email:referralInvite] SES result', emailResult)
    }

    return res.status(200).json({
      ok: true,
      referralId: referral.id,
      inviteToken,
    })
  } catch (err) {
    console.error('[referrals:create] unexpected error', err)
    return res.status(500).json({ error: 'Unexpected error creating referral' })
  }
}
