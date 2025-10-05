import Link from "next/link";
import React from "react";

const portals = [
  {
    href: "/blog",
    title: "Stories",
    subtitle: "Read and share adventures",
    aria: "Go to Stories section"
  },
  {
    href: "/minecraft-zone",
    title: "Minecraft Zone",
    subtitle: "Explore builds and games",
    aria: "Go to Minecraft Zone"
  },
  {
    href: "/scratch-board",
    title: "Scratch Board",
    subtitle: "Code and create projects",
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
      <div className="portal-grid">
        {portals.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="portal-tile"
            aria-label={p.aria}
          >
            <div className="portal-bg" />
            <div className="portal-content">
              <h3 className="portal-title">{p.title}</h3>
              <p className="portal-subtitle">{p.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
