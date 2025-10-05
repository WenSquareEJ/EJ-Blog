"use client";
import React, { useState } from "react";
import { AVATAR_OPTIONS } from "@/lib/erik";

interface AvatarHouseProps {
  erikUserId: string | null;
  currentAvatarFilename: string | null;
}

export default function AvatarHouse({ erikUserId, currentAvatarFilename }: AvatarHouseProps) {
  // Only Erik can edit
  const [selected, setSelected] = useState(currentAvatarFilename ?? "Steve.png");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get current user from window (client-only, extra guard)
  // If not Erik, render null
  // For simplicity, assume erikUserId is only passed for Erik
  if (!erikUserId) return null;

  const handleChoose = async (filename: string) => {
    if (loading || filename === selected) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings/avatar/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (res.ok) {
        setSelected(filename);
        setStatus("Avatar updated!");
      } else {
        setStatus("Failed to update avatar.");
      }
    } catch {
      setStatus("Error updating avatar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="avatar-grid">
        {AVATAR_OPTIONS.map((filename) => (
          <button
            key={filename}
            className="avatar-tile"
            aria-pressed={selected === filename}
            onClick={() => handleChoose(filename)}
            disabled={loading}
            tabIndex={0}
            type="button"
          >
            <img
              src={`/avatars/${filename}`}
              alt={filename.replace(/\.png$/, "") + " avatar"}
              draggable={false}
            />
          </button>
        ))}
      </div>
      {status && <div className="mt-2 text-sm text-mc-ink">{status}</div>}
    </div>
  );
}
