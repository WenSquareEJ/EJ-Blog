// /app/(site)/minecraft-zone/page.tsx
export const dynamic = "force-dynamic";

export default function MinecraftZonePage() {
  return (
    <div className="space-y-3">
      <h1 className="font-mc text-lg">Minecraft Zone</h1>
      <p className="text-sm">Screenshots, builds, stories — all Minecraft-themed content lives here.</p>
      <div className="card-block p-4">
        <p className="text-sm">Nothing here yet. Create a new post and tag it “minecraft”.</p>
      </div>
    </div>
  );
}
