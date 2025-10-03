// /app/(site)/milestones/page.tsx
export const dynamic = "force-dynamic";

export default function MilestonesPage() {
  return (
    <div className="space-y-3">
      <h1 className="font-mc text-lg">Milestones</h1>
      <p className="text-sm">
        Public milestone board (visible to everyone). You can edit this page later to show a timeline.
      </p>
      <div className="card-block p-4">
        <p className="text-sm">No milestones yet — add the first one soon! 🎉</p>
      </div>
    </div>
  );
}
