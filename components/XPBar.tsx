    "use client";

    import React, { useEffect, useState } from "react";
    import { useIdleXP } from "../hooks/useIdleXP";

    const ENABLE_IDLE_XP = true;

    export default function XPBar() {
      const { xp, level, goal, pct, justGained, leveledUp } = useIdleXP({
        ratePerMinute: 1.5,
        storageKey: "ej.idleXP",
        enable: ENABLE_IDLE_XP,
      });

      const [showGain, setShowGain] = useState(false);
      useEffect(() => {
        if (justGained > 0) {
          setShowGain(true);
          const t = setTimeout(() => setShowGain(false), 800);
          return () => clearTimeout(t);
        }
      }, [justGained]);

      const [spark, setSpark] = useState(false);
      useEffect(() => {
        if (leveledUp) {
          setSpark(true);
          const t = setTimeout(() => setSpark(false), 1200);
          return () => clearTimeout(t);
        }
      }, [leveledUp]);

      const pctStr = `${Math.round(pct * 100)}%`;
      const tooltip = `${Math.floor(xp)} / ${goal} XP • Level ${level}`;

      return (
        <div className="relative w-full">
          <div className="group" title={tooltip}>
            <div
              className={["relative h-5 w-full rounded-md border-2",
                "border-[#5a3d1a] bg-[#c7a97a]/70 shadow-[inset_0_1px_1px_rgba(0,0,0,0.25)]",
                "pixel-border",
              ].join(" ")}
            >
              <div
                className="xp-fill h-full rounded-[4px] bg-[#2f6f32] relative overflow-hidden transition-[width] duration-700 ease-out"
                style={{ width: pctStr }}
              >
                <span className="pointer-events-none absolute inset-0 animate-xpShimmer opacity-20" />
              </div>
              <span className="pointer-events-none absolute inset-0 rounded-md animate-xpPulse" />
            </div>
          </div>

          {showGain && (
            <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 animate-xpRise text-xs font-mc text-[#2f6f32] drop-shadow">
              +{Math.max(1, Math.round(justGained))} XP
            </div>
          )}

          {spark && (
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-1 animate-sparkFade">
              <span className="sparkle" />
              <span className="sparkle delay-150" />
              <span className="sparkle delay-300" />
            </div>
          )}

          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-[#6b5b4a] font-mc">Progress</span>
            <span className="rounded-md border border-[#5a3d1a] bg-[#c7a97a]/60 px-2 py-[2px] text-[10px] font-mc text-[#3b2f23]">
              {Math.floor(xp)} / {goal} XP • L{level}
            </span>
          </div>
        </div>
      );
    }
