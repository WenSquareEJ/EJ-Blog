"use client";
import { useEffect, useState } from "react";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockFollowerLeft() {
  const [pos, setPos] = useState<{left: number; top: number} | null>(null);

  useEffect(() => {
    const el = document.getElementById("hero-card");
    if (!el) return;

    const BRICK = 96;          // px (h-24 w-24)
    const GAP_X = 28;          // space between hero border and brick (to the LEFT)
    const BELOW = 32;          // distance below hero bottom (aligns near "Portal Rooms")
    const SAFE = 16;           // viewport padding for clamping
    
    const update = () => {
      const r = el.getBoundingClientRect();
      let x = r.left - GAP_X;
      let y = r.bottom + BELOW;

      // Clamp to viewport
      const minX = SAFE + BRICK/2;
      const maxX = window.innerWidth - SAFE - BRICK/2;
      const minY = SAFE + BRICK/2;
      const maxY = window.innerHeight - SAFE - BRICK/2;
      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);

      setPos({ left: Math.round(x), top: Math.round(y) });
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
      className="hidden md:block z-30"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)" // centers the 96x96 brick around the point
      }}
    >
      <div className="flex flex-col items-center">
        <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
        <div className="mt-1 max-w-[12rem] text-center text-[11px] text-white/85 drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] break-words">
          💬 Ebot whispers: What happens if you tap this block?
        </div>
      </div>
    </div>
  );
}