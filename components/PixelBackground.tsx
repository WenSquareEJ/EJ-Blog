"use client";

import { useEffect, useRef } from "react";

type PixelBackgroundProps = {
  className?: string;
};

const CLOUD_LIMIT = 6;
const TREE_LIMIT = 4;

export default function PixelBackground({ className }: PixelBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const updateParallax = () => {
      const y = window.scrollY || 0;
      const cloudShift = Math.min(CLOUD_LIMIT, 2 + y * 0.04);
      const treeShift = Math.min(TREE_LIMIT, 1 + y * 0.03);
      node.style.setProperty("--cloud-shift", `${cloudShift}px`);
      node.style.setProperty("--tree-shift", `${treeShift}px`);
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    return () => window.removeEventListener("scroll", updateParallax);
  }, []);

  const classes = ["pixel-banner", className].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={classes} aria-hidden="true">
      <div className="pixel-banner__layer pixel-banner__sky" />
      <div className="pixel-banner__layer pixel-banner__clouds">
        <span className="pixel-banner__cloud pixel-banner__cloud--one" />
        <span className="pixel-banner__cloud pixel-banner__cloud--two" />
        <span className="pixel-banner__cloud pixel-banner__cloud--three" />
        <span className="pixel-banner__cloud pixel-banner__cloud--four" />
      </div>
      <div className="pixel-banner__layer pixel-banner__trees" />
      <div className="pixel-banner__layer pixel-banner__grass">
        <span className="pixel-banner__grass-top" />
        <span className="pixel-banner__dirt" />
      </div>
    </div>
  );
}
