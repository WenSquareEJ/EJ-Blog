"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error || "Failed to delete post.");
        return;
      }

      // go home after deletion
      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      alert("Network error while deleting.");
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={isPending}
      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      aria-label="Delete post"
      title="Delete post"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
