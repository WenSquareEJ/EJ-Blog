"use client";
import BreakTheBlock from "@/components/BreakTheBlock";

export default function BreakTheBlockAtXP() {
  return (
    <div className="hidden md:block absolute right-[15%] -top-6 z-30">
      <div className="flex flex-col items-center">
        <BreakTheBlock blockTextureSrc="/icons/brick.png" minimalChrome />
        <div className="mt-1 text-[11px] text-gray-800 font-medium bg-white/90 px-2 py-1 rounded-sm border border-gray-300 select-none shadow-sm">
          💬 Ebot whispers: What happens if you tap this block?
        </div>
      </div>
    </div>
  );
}