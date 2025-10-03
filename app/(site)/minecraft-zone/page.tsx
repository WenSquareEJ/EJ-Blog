// /app/(site)/minecraft-zone/page.tsx
import Link from "next/link";

export default function MinecraftZonePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-mc text-2xl">Minecraft Zone</h1>
      <p className="opacity-80">
        Welcome to Erik’s Minecraft builds, experiments, and fun mini-games!
      </p>

      {/* Gallery of builds */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Example build card */}
        <div className="card-block">
          <img
            src="/images/minecraft-babington.png"
            alt="Babington House Build"
            className="rounded mb-2"
          />
          <h2 className="font-mc text-lg">Babington House</h2>
          <p className="text-sm">
            Recreating my school in Minecraft, block by block.
          </p>
          <Link href="/minecraft-zone/babington" className="btn-mc mt-2 inline-block">
            View Project
          </Link>
        </div>

        {/* Add more cards here */}
        <div className="card-block">
          <img
            src="/images/minecraft-home.png"
            alt="Family Storage Design"
            className="rounded mb-2"
          />
          <h2 className="font-mc text-lg">Family Home Storage</h2>
          <p className="text-sm">
            My Minecraft version of our house storage project.
          </p>
          <Link href="/minecraft-zone/storage" className="btn-mc mt-2 inline-block">
            View Project
          </Link>
        </div>
      </div>

      {/* Mini-game teaser */}
      <div className="card-block">
        <h2 className="font-mc text-lg mb-2">Mini-Games</h2>
        <p className="text-sm mb-2">Play Minecraft-style games directly here!</p>
        <Link href="/minecraft-zone/snake" className="btn-mc">
          Minecraft Snake
        </Link>
      </div>
    </div>
  );
}