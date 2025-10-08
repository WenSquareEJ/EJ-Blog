"use client";
import { useEffect, useState } from "react";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockFollowerLeft() {
  const [pos, setPos] = useState<{left: number; top: number} | null>(null);

  useEffect(() => {
    const el = document.getElementById("hero-card");
    if (!el) return;

    const update = () => {
      const heroRect = el.getBoundingClientRect();
      
      // Simple approach: position in the left gutter area
      // Place it to the left of the hero card, below its bottom edge
      const x = Math.max(80, heroRect.left - 120); // 120px to the left of hero card, minimum 80px from edge
      const y = heroRect.bottom + 50; // 50px below hero card bottom

      // Ensure it stays on screen
      const minY = 100; // minimum distance from top
      const maxY = window.innerHeight - 200; // minimum distance from bottom
      const clampedY = Math.min(Math.max(y, minY), maxY);

      setPos({ left: Math.round(x), top: Math.round(clampedY) });
    };

    // Initial position
    update();
    
    // Update on resize and scroll
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
      className="z-50"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(255, 255, 0, 0.8)",
        border: "3px solid red",
        padding: "10px",
        borderRadius: "10px"
      }}
    >
      <div style={{ color: "black", fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
        LEFT BRICK HERE! ({pos.left}, {pos.top})
      </div>
      <div className="flex flex-col items-center">
        <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
        <div className="mt-1 max-w-[12rem] text-center text-[11px] text-white/85 drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] break-words">
          💬 Ebot whispers: What happens if you tap this block?
        </div>
      </div>
    </div>
  );
}