import Link from "next/link";
import React from "react";

const portals = [
  {
    href: "/blog",
    title: "Stories",
    subtitle: "My adventures",
    aria: "Go to Stories section"
  },
  {
    href: "/minecraft-zone",
    title: "Minecraft Zone",
    subtitle: "MC build",
    aria: "Go to Minecraft Zone"
  },
  {
    href: "/scratch-board",
    title: "Scratch Board",
    subtitle: "Coding work",
    aria: "Go to Scratch Board"
  },
  {
    href: "/badges",
    title: "Achievements",
    subtitle: "View earned badges",
    aria: "Go to Achievements"
  }
];

export default function PortalRoom() {
  return (
    <section className="portal-room" aria-label="Portal Room">
      <header className="mb-4">
        <h2 className="font-mc text-xl font-bold text-[#3b2f23] hover:text-[#5a3d1a] transition-colors" style={{textShadow: "1px 1px 0 #fff"}}>⚙️ Portal Rooms</h2>
        <p className="portal-subtitle text-xs text-mc-stone mt-1">Step through to explore Erik’s worlds.</p>
      </header>
      <div className="portal-grid">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="portal-tile portal-tile-mc"
            aria-label={p.aria}
          >
            <div className="portal-content">
              <h3 className="portal-title font-mc font-bold text-base text-[#3b2f23] hover:text-[#5a3d1a] transition-colors" style={{textShadow: "1px 1px 0 #fff"}}>{p.title}</h3>
              <p className="portal-subtitle text-xs text-mc-stone">{p.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
