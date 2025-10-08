"use client";

import BreakTheBlock from "./BreakTheBlock";

export default function BreakTheBlockFloating() {
  return (
    <div 
      className="hidden md:block fixed top-[60%] right-8 xl:right-16 -translate-y-1/2 z-30"
      style={{ right: 'max(2rem, env(safe-area-inset-right))' }}
    >
      <BreakTheBlock />
    </div>
  );
}