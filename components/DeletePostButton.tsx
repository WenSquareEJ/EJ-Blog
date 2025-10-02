"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/delete`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => "Unknown error");
        alert("Failed to delete: " + text);
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
