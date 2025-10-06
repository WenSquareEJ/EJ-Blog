"use client";
import { useEffect, useState } from "react";

const DEFAULT_CHOICES = [
  { key: "diamond", iconSrc: "/icons/diamond.png", label: "Diamond" },
  { key: "emerald", iconSrc: "/icons/emerald.png", label: "Emerald" },
  { key: "heart", iconSrc: "/icons/heart.png", label: "Heart" },
  { key: "blaze", iconSrc: "/icons/blaze.png", label: "Blaze" },
  { key: "brick", iconSrc: "/icons/brick.png", label: "Brick" },
  { key: "star", iconSrc: "/icons/star.png", label: "Star" },
  { key: "coin", iconSrc: "/icons/coin.png", label: "Coin" },
  { key: "gear", iconSrc: "/icons/gear.png", label: "Gear" },
];

type ReactionKey = typeof DEFAULT_CHOICES[number]["key"];

type Counts = Record<string, number>;

type Props = {
  postId: string;
  choices?: typeof DEFAULT_CHOICES;
};

export default function ReactionsBar({ postId, choices = DEFAULT_CHOICES }: Props) {
  const [counts, setCounts] = useState<Counts>({});
  const [pending, setPending] = useState<string | null>(null);

  // Fetch counts on mount
  useEffect(() => {
    let ignore = false;
    async function fetchCounts() {
      try {
        const res = await fetch(`/api/likes?postId=${encodeURIComponent(postId)}&aggregate=byType`);
        const data = await res.json();
        if (!ignore) {
          if (data?.counts && typeof data.counts === "object") {
            setCounts(data.counts);
          } else if (typeof data.count === "number") {
            setCounts({ diamond: data.count }); // legacy fallback
          } else {
            setCounts({});
          }
        }
      } catch {
        if (!ignore) setCounts({});
      }
    }
    if (postId) fetchCounts();
    return () => { ignore = true; };
  }, [postId]);

  async function handleReact(key: ReactionKey) {
    if (!postId || pending) return;
    setPending(key);
    setCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 })); // optimistic
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type: key }),
      });
      const data = await res.json();
      if (res.ok && data?.counts) {
        setCounts(data.counts);
      } else if (res.ok && typeof data.count === "number") {
        setCounts((prev) => ({ ...prev, diamond: data.count }));
      } else {
        setCounts((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 1) - 1) }));
      }
    } catch {
      setCounts((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 1) - 1) }));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex gap-2 mt-3">
      {choices.map(({ key, iconSrc, label }) => (
        <button
          key={key}
          type="button"
          className="btn-mc flex flex-col items-center px-2 py-1 text-xs"
          aria-label={label || key}
          disabled={pending === key}
          onClick={() => handleReact(key as ReactionKey)}
        >
          <img src={iconSrc} alt="" className="w-6 h-6 mb-1 select-none pointer-events-none" draggable={false} />
          <span>{counts[key] || 0}</span>
        </button>
      ))}
    </div>
  );
}
