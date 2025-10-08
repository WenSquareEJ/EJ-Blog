"use client";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockAnchor() {
  return (
    <div className="hidden md:block absolute -right-14 bottom-10 z-30">
      <BreakTheBlock blockTextureSrc="/icons/brick.png" />
    </div>
  );
}