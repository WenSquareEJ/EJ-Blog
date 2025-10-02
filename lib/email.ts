// lib/email.ts — zero external deps; uses Resend HTTP API via fetch

type EmailPayload = {
  from: string
  to: string[]          // recipients
  subject: string
  html: string
}

export async function sendReviewEmail(to: string[], reviewUrl: string, postTitle: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to?.length) {
    console.warn('Skipping email: missing RESEND_API_KEY or empty recipients.')
    return
  }

  const from = 'KidSite <onboarding@resend.dev>' // swap to your verified sender later
  const subject = `New post pending review: ${postTitle}`
  const html = `
    <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
      <h2 style="margin:0 0 8px 0">New post waiting for approval</h2>
      <p style="margin:0 0 12px 0"><strong>${escapeHtml(postTitle)}</strong> was submitted and is pending moderation.</p>
      <p style="margin:0 0 12px 0">
        <a href="${reviewUrl}" style="display:inline-block;padding:10px 14px;background:#3CAB3A;color:#fff;text-decoration:none;border-radius:8px">
          Open Moderation
        </a>
      </p>
      <p style="font-size:12px;color:#555;margin:0">If the button doesn’t work, use this link:<br>${reviewUrl}</p>
    </div>
  `
  await sendResend({ apiKey, payload: { from, to, subject, html } })
}

// 👇 Add this export to satisfy app/api/digest/route.ts
export async function sendDailyDigest(to: string[], subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to?.length) {
    console.warn('Skipping daily digest: missing RESEND_API_KEY or empty recipients.')
    return
  }
  const from = 'KidSite <onboarding@resend.dev>'
  await sendResend({ apiKey, payload: { from, to, subject, html } })
}

async function sendResend({ apiKey, payload }: { apiKey: string; payload: EmailPayload }) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn('Resend API error:', res.status, text)
    }
  } catch (e) {
    console.warn('Resend fetch failed:', e)
  }
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]
  )
}
