"use client";

import BreakTheBlock from "./BreakTheBlock";

export default function BreakTheBlockFloating() {
  return (
    <div 
      className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden md:block"
      style={{ right: 'max(1rem, env(safe-area-inset-right))' }}
    >
      <BreakTheBlock />
    </div>
  );
}