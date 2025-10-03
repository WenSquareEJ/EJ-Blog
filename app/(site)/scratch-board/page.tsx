import Link from "next/link";
import supabaseServer from "@/lib/supabaseServer";

export default async function ScratchBoardPage() {
  const sb = supabaseServer();

  // Check login so we can show the "Add" button
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;

  // Load projects
  const { data: projects, error } = await sb
    .from("scratch_projects")
    .select("id, scratch_id, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-mc text-2xl">🎨 Scratch Board</h1>
          <p className="opacity-80">
            A gallery of Erik’s Scratch projects and coding experiments.
          </p>
        </div>

        {user && (
          <Link href="/scratch-board/new" className="btn-mc">
            ➕ Add a project
          </Link>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm">
          Error loading projects: {error.message}
        </p>
      )}

      {!projects || projects.length === 0 ? (
        <div className="card-block">
          <p className="text-sm opacity-80">
            No Scratch projects yet — add your first one!
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="card-block space-y-2">
              <h3 className="font-mc text-sm">{p.title || `Project ${p.scratch_id}`}</h3>
              <div className="rounded overflow-hidden border">
                <iframe
                  src={`https://scratch.mit.edu/projects/${p.scratch_id}/embed`}
                  allowTransparency={true}
                  width="100%"
                  height="402"
                  frameBorder="0"
                  scrolling="no"
                  allowFullScreen
                  title={p.title || `Scratch project ${p.scratch_id}`}
                />
              </div>
              <a
                className="btn-mc-secondary inline-block"
                href={`https://scratch.mit.edu/projects/${p.scratch_id}`}
                target="_blank"
                rel="noreferrer"
              >
                Open on Scratch ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}