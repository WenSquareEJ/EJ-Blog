"use client";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockAtXP() {
  return (
    <div className="hidden md:block absolute left-full ml-6 top-1/2 -translate-y-1/2 z-30">
      <div className="flex flex-col items-center">
        <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
        <div className="mt-1 text-[11px] text-white/85 drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] select-none max-w-[12rem] text-center break-words">
          💬 Ebot whispers: What happens if you tap this block?
        </div>
      </div>
    </div>
  );
}