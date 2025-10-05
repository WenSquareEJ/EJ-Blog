import { getErikUserId, getErikProfileAvatar } from "@/lib/erik";
import supabaseServer from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { useState } from "react";

export default async function AvatarSettingsPage() {
  const erikUserId = await getErikUserId();
  const currentAvatar = await getErikProfileAvatar();
  const sb = supabaseServer();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user ?? null;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() ?? "wenyu.yan@gmail.com";
  const isAdmin = user?.email?.toLowerCase() === adminEmail;
  const isErik = user?.id === erikUserId;
  if (!isAdmin && !isErik) {
    redirect("/");
  }

  // Client-side upload form
  return (
    <div className="max-w-md mx-auto mt-10 card-block p-6 rounded-xl">
  <h2 className="font-mc text-xl mb-4">Change Erik&apos;s Avatar</h2>
      <div className="mb-4 flex flex-col items-center">
        <img
          src={currentAvatar ?? "/placeholder-logo.svg"}
          alt="Current avatar"
          className="rounded-full border-4 border-mc-wood w-32 h-32 object-cover mb-2"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="text-mc-stone text-sm mt-4">
        Avatar uploads are disabled. Please choose from the available avatars on the Home page (Avatar House).
      </div>
    </div>
  );
}
