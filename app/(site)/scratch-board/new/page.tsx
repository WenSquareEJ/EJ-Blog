"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { parseScratchId } from "@/lib/parseScratchId";
import type { TablesInsert } from "@/lib/database.types";

export default function NewScratchProjectPage() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [urlOrId, setUrlOrId] = useState("");
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const scratch_id = parseScratchId(urlOrId);
    if (!scratch_id) {
      setMsg("Please enter a valid Scratch project URL or numeric ID.");
      return;
    }

    setBusy(true);
    try {
      // Get user (enforce login)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMsg("Please log in first.");
        return;
      }

      const { error } = await supabase
        .from("scratch_projects")
        .insert<TablesInsert<"scratch_projects">>({
          user_id: user.id,
          scratch_id,
          title: title || null,
        });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("Added! Redirecting…");
      router.push("/scratch-board");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full card-block space-y-4">
      <h1 className="font-mc text-xl">➕ Add a Scratch project</h1>
      <p className="opacity-80 text-sm">
        Paste a Scratch project link (e.g. <code>https://scratch.mit.edu/projects/123456789/</code>) or just the project number.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Project URL or ID</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={urlOrId}
            onChange={(e) => setUrlOrId(e.target.value)}
            placeholder="https://scratch.mit.edu/projects/123456789/"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Title (optional)</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My jumping cat game"
          />
        </div>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button type="submit" className="btn-mc" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
