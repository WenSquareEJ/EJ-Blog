import { redirect } from "next/navigation";
import { useState } from "react";
import supabaseServer from "@/lib/supabaseServer";
import { getErikUserId, getErikProfileAvatar } from "@/lib/erik";
import type { TablesRow } from "@/lib/database.types";

const AVATAR_OPTIONS = [
  "steve.png",
  "alex.png",
  "slime.png",
  "creeper.png",
  "skeleton.png",
  "enderman.png",
  "parrot-blue.png",
  "parrot-red.png",
  "miner.png",
  "builder.png",
];

const AVATAR_PATH = "/assets/avatars/";

export default async function AvatarHousePage() {
  const erikUserId = await getErikUserId();
  const avatarUrl = await getErikProfileAvatar();
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "";
  const isErik = user?.id === erikUserId;
  const isAdmin = user?.email?.toLowerCase() === adminEmail;

  if (!isErik && !isAdmin) {
    redirect("/");
  }

  // Server component: form posts to API route
  return (
    <div className="home-card mx-auto max-w-xl mt-8">
      <div className="home-card__body flex flex-col items-center gap-6">
        <h1 className="home-card-title text-2xl mb-2">Avatar House</h1>
        <p className="text-mc-stone text-sm mb-2">Pick your Minecraft-style avatar. Changes are instant!</p>
        <form
          action="/api/profile/avatar"
          method="POST"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {AVATAR_OPTIONS.map((filename) => {
            const url = AVATAR_PATH + filename;
            const selected = avatarUrl === url;
            return (
              <button
                key={filename}
                type="submit"
                name="avatarUrl"
                value={url}
                className={`border-2 rounded-lg p-1 bg-[color:var(--mc-parchment)] border-[color:var(--mc-wood)] shadow-mc focus:outline-mc-wood transition-all duration-100 ${selected ? "ring-2 ring-mc-emerald" : ""}`}
                aria-label={filename.replace(".png", "")}
              >
                <img
                  src={url}
                  alt={filename.replace(".png", "")}
                  className="w-16 h-16 object-cover rounded-md"
                />
              </button>
            );
          })}
        </form>
        <a href="/" className="btn-mc-secondary mt-4">Back to Home</a>
      </div>
    </div>
  );
}
