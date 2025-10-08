"use client";
import { useEffect, useState } from "react";

export default function TipOfTheDay() {
  const [tip, setTip] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function todayLondon() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(now);
    const y = parts.find(p => p.type === "year")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const d = parts.find(p => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  }

  useEffect(() => {
    let alive = true;
    const date = todayLondon();
    const cacheKey = `tip:${date}`;
    
    // Try to show cached tip immediately
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && alive) {
        setTip(cached);
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Fetch fresh tip with cache-busting
    (async () => {
      try {
        const res = await fetch(`/api/tip?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-store" }
        });
        const data = await res.json();
        if (!res.ok || !data?.tip) throw new Error("Failed to fetch tip");
        
        if (alive) {
          setTip(data.tip);
          // Cache the tip for today
          try {
            localStorage.setItem(cacheKey, data.tip);
            // Clear old cache entries
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key?.startsWith("tip:") && key !== cacheKey) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || "Failed");
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="home-card">
      <div className="home-card__body">
        <h4 className="font-mc text-base tracking-wide">TIP OF THE DAY</h4>
        <p className="mt-1 text-sm text-[#3b2f23]">
          {tip
            ? tip
            : err
            ? "Having a nap in the Nether… try again soon!"
            : "Finding today’s best Minecraft wisdom…"}
        </p>
      </div>
    </div>
  );
}
