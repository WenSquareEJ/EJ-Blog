// lib/email.ts
export async function sendReviewEmail(to: string[], reviewUrl: string, postTitle: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !to?.length) {
    console.warn('Skipping email: missing RESEND_API_KEY or empty recipients.')
    return
  }

  // Lazy-load the package so builds don’t fail if it’s not installed
  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const from = 'KidSite <onboarding@resend.dev>' // use your verified domain later
  const subject = `New post pending review: ${postTitle}`

  const html = `
    <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.5">
      <h2>New post waiting for approval</h2>
      <p><strong>${escapeHtml(postTitle)}</strong> was submitted and is pending moderation.</p>
      <p><a href="${reviewUrl}" style="display:inline-block;padding:10px 14px;background:#3CAB3A;color:#fff;text-decoration:none;border-radius:8px">Open Moderation</a></p>
      <p>If the button doesn’t work, use this link:<br>${reviewUrl}</p>
    </div>
  `

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
    })
  } catch (e) {
    console.warn('sendReviewEmail failed:', e)
  }
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]
  )
}
