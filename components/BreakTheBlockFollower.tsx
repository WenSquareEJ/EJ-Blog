"use client";
import { useEffect, useState } from "react";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockFollower() {
  const [pos, setPos] = useState<{left: number; top: number} | null>(null);

  useEffect(() => {
    const el = document.getElementById("hero-card");
    if (!el) return;

    const GAP_X = 24;      // horizontal gap outside the hero border
    const OFFSET_Y = 0.60; // vertical factor (60% down from hero top, near the parrot)
    
    const update = () => {
      const r = el.getBoundingClientRect();
      setPos({
        left: Math.round(r.right + GAP_X),
        top:  Math.round(r.top + r.height * OFFSET_Y),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      className="hidden md:block z-30 pointer-events-auto"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)" // centers the 96x96 brick around the point
      }}
    >
      <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
    </div>
  );
}