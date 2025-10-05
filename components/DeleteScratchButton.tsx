"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteScratchButtonProps {
  projectId: string;
}

export default function DeleteScratchButton({ projectId }: DeleteScratchButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scratch/${projectId}`, { method: "DELETE" });
      if (res.status === 204) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-mc-danger text-xs px-2 py-1 rounded"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete Scratch Project"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
