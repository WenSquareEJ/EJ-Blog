"use client";
export default function SiteError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  console.error("[site] route error:", error);
  return (
    <div style={{ padding: 16 }}>
      <h1>Something went wrong</h1>
      <p>Digest: {error?.digest ?? "n/a"}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
