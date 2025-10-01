// lib/email.ts
import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

export async function sendReviewEmail(to: string[], reviewUrl: string, title: string) {
  const resend = getResend()
  if (!resend) return // no-op if key not set
  await resend.emails.send({
    from: 'KidSite <nboarding@resend.dev>',
    to,
    subject: `Review post: ${title}`,
    html: `<p>A new post is waiting for approval.</p><p><a href="${reviewUrl}">Open review</a></p>`
  })
}

export async function sendDailyDigest(to: string[], html: string) {
  const resend = getResend()
  if (!resend) return // no-op if key not set
  await resend.emails.send({
    from: 'KidSite <nboarding@resend.dev>',
    to,
    subject: 'Daily digest',
    html
  })
}
