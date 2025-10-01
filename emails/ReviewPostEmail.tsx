export default function ReviewPostEmail({ title, url }: { title: string; url: string }) {
  return `<h1>Review post</h1><p>${title}</p><a href="${url}">Open moderation</a>` as unknown as any
}
