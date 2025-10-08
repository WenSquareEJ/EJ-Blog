"use client";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockAnchor() {
  return (
    <div
      className="hidden md:block absolute -right-20 bottom-20 z-30"
      style={{ right: 'max(5rem, calc(env(safe-area-inset-right) + 5rem))' }}
    >
      <BreakTheBlock blockTextureSrc="/icons/brick.png" />
    </div>
  );
}