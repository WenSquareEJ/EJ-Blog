import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReviewEmail(to: string[], reviewUrl: string, title: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: 'KidSite <noreply@your-domain>',
    to,
    subject: `Review post: ${title}`,
    html: `<p>A new post is waiting for approval.</p><p><a href="${reviewUrl}">Open review</a></p>`
  })
}

export async function sendDailyDigest(to: string[], html: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({ from: 'KidSite <noreply@your-domain>', to, subject: 'Daily digest', html })
}
