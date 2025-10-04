"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showErrorToast, showInfoToast } from "@/components/Toast";

type DeleteBehavior = "refresh" | "redirect";

type AdminDeletePostButtonProps = {
  postId: string;
  behavior?: DeleteBehavior;
  className?: string;
  confirmMessage?: string;
  successMessage?: string;
  onDeleted?: () => void;
};

const DEFAULT_CONFIRM =
  "This will permanently hide the post. Type DELETE in the prompt to confirm.";
const DEFAULT_SUCCESS = "Post deleted";

export default function AdminDeletePostButton({
  postId,
  behavior = "refresh",
  className,
  confirmMessage = DEFAULT_CONFIRM,
  successMessage = DEFAULT_SUCCESS,
  onDeleted,
}: AdminDeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (isDeleting) return;

    const confirmation = prompt(confirmMessage, "");
    if (confirmation === null) return;
    if (confirmation.trim().toUpperCase() !== "DELETE") {
      showErrorToast("Deletion cancelled — you must type DELETE to proceed.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const errorMessage =
          (payload && typeof payload.error === "string" && payload.error) ||
          "Failed to delete post.";
        showErrorToast(errorMessage);
        return;
      }

      showInfoToast(successMessage);

      if (behavior === "redirect") {
        router.push("/");
        router.refresh();
      } else {
        router.refresh();
      }

      onDeleted?.();
    } catch (error) {
      console.error("[AdminDeletePostButton] delete failed", error);
      showErrorToast("Network error while deleting post.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className={`btn-mc-danger ${isDeleting ? "opacity-60" : ""} ${className ?? ""}`.trim()}
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
