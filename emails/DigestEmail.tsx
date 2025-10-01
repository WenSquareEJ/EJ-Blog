export default function DigestEmail({ reactions, comments }: { reactions: number; comments: number }) {
  return `<p>New reactions: ${reactions}</p><p>Comments awaiting review: ${comments}</p>` as unknown as any
}
