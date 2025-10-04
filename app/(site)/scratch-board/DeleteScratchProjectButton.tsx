"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteScratchProjectButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Delete this project from the site? This won’t remove it from Scratch.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scratch-projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body?.error || "Failed to delete project.");
        setLoading(false);
        return;
      }
      // Optimistic UI: refresh page
      router.refresh();
    } catch (err) {
      alert("Network error while deleting.");
      setLoading(false);
    }
  }

  return (
    <button
      className="btn-mc-danger text-xs px-2 py-1 rounded mt-2"
      aria-label="Delete Scratch project"
      title="Delete Scratch project"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}