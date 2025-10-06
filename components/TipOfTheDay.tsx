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
    (async () => {
      try {
        const res = await fetch(`/api/tips/daily?date=${date}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.tip) throw new Error(data?.error || "Failed");
        if (alive) setTip(data.tip);
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
