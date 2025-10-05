"use client";

import { useEffect, useRef, useState } from "react";

type IdleXPOptions = {
  ratePerMinute?: number; // default 1 xp/min
  storageKey?: string;    // default "ej.idleXP"
  enable?: boolean;       // default true
};

type XPState = {
  xp: number;    // current xp towards this level
  level: number; // starting at 1
};

export function levelGoal(level: number) {
  return 100 + (level - 1) * 50; // simple, readable curve
}

export function useIdleXP(opts: IdleXPOptions = {}) {
  const { ratePerMinute = 1, storageKey = "ej.idleXP", enable = true } = opts;
  const [state, setState] = useState<XPState>({ xp: 0, level: 1 });
  const [justGained, setJustGained] = useState<number>(0); // amount gained in last tick
  const [leveledUp, setLeveledUp] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // read from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as XPState;
        if (
          typeof parsed?.xp === "number" &&
          typeof parsed?.level === "number" &&
          parsed.level >= 1 &&
          parsed.xp >= 0
        ) {
          setState(parsed);
        }
      }
    } catch {}
  }, [storageKey]);

  // write to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }, [state, storageKey]);

  // idle trickle loop (client only)
  useEffect(() => {
    if (!enable) return;

    const perSecond = ratePerMinute / 60; // xp per second
    const tick = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const deltaS = (now - lastTickRef.current) / 1000;
      if (deltaS >= 1) {
        lastTickRef.current = now;
        if (perSecond > 0) {
          setState((prev) => {
            let { xp, level } = prev;
            let gained = Math.max(0.25, perSecond * deltaS); // ensure visible trickle
            // Clamp tiny gains to 1 decimal to avoid float noise
            gained = Math.round(gained * 10) / 10;

            let goal = levelGoal(level);
            let newXP = xp + gained;
            let didLevel = false;

            while (newXP >= goal) {
              newXP -= goal;
              level += 1;
              goal = levelGoal(level);
              didLevel = true;
            }

            setJustGained(gained);
            setLeveledUp(didLevel);

            return { xp: newXP, level };
          });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enable, ratePerMinute]);

  const goal = levelGoal(state.level);
  const pct = Math.max(0, Math.min(1, goal ? state.xp / goal : 0));

  return {
    ...state,
    goal,
    pct,              // 0..1 for width
    justGained,       // amount from last tick (for +XP badge)
    leveledUp,        // true for the tick that leveled up
    setState,         // exposed if the UI wants to reset
  };
}
