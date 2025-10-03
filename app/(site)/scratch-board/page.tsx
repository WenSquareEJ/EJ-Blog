// /app/(site)/scratch-board/page.tsx
export const dynamic = "force-dynamic";

export default function ScratchBoardPage() {
  return (
    <div className="space-y-3">
      <h1 className="font-mc text-lg">Scratch Board</h1>
      <p className="text-sm">Ideas, drafts, experiments. You can keep this public or later gate by login.</p>
      <div className="card-block p-4">
        <p className="text-sm">Empty for now — start sketching! ✍️</p>
      </div>
    </div>
  );
}
