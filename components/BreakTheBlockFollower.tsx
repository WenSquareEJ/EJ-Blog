"use client";
import { useEffect, useState } from "react";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockFollower() {
  const [pos, setPos] = useState<{left: number; top: number} | null>(null);

  useEffect(() => {
    const el = document.getElementById("hero-card");
    if (!el) return;

    const BRICK_W = 96;           // matches h-24 w-24
    const GAP_X = 24;             // horizontal gap from hero border
    const OFFSET_Y = 0.64;        // ~parrot height area
    const SAFE = 16;              // viewport padding
    
    const update = () => {
      const r = el.getBoundingClientRect();
      let x = r.right + GAP_X;
      let y = r.top + r.height * OFFSET_Y;

      // Right edge clamp so brick is fully visible:
      const maxX = window.innerWidth - SAFE - BRICK_W / 2;
      const minX = SAFE + BRICK_W / 2;
      x = Math.min(Math.max(x, minX), maxX);

      // Vertical clamp:
      const maxY = window.innerHeight - SAFE - BRICK_W / 2;
      const minY = SAFE + BRICK_W / 2;
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
      className="hidden md:block z-30 pointer-events-auto"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)" // centers the 96x96 brick around the point
      }}
    >
      <div className="flex flex-col items-center">
        <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
        <div className="hidden md:block text-[11px] text-mc-ink/70 mt-1 text-center select-none">
          💬 Ebot whispers: What happens if you tap this block?
        </div>
      </div>
    </div>
  );
}