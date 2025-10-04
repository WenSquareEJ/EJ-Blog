import { getErikUserId, getErikProfileAvatar, setErikProfileAvatar } from "@/lib/erik";
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
      <h2 className="font-mc text-xl mb-4">Change Erik's Avatar</h2>
      <div className="mb-4 flex flex-col items-center">
        <img
          src={currentAvatar ?? "/placeholder-logo.svg"}
          alt="Current avatar"
          className="rounded-full border-4 border-mc-wood w-32 h-32 object-cover mb-2"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <form
        className="space-y-4"
        encType="multipart/form-data"
        onSubmit={async (e) => {
          e.preventDefault();
          const fileInput = e.currentTarget.elements.namedItem("avatar") as HTMLInputElement;
          if (!fileInput?.files?.[0]) {
            alert("Please select an image file.");
            return;
          }
          const file = fileInput.files[0];
          const timestamp = Date.now();
          const filePath = `avatars/${erikUserId}/${timestamp}-${file.name}`;
          // Upload to Supabase Storage
          const { data, error } = await sb.storage.from("avatars").upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });
          if (error) {
            alert("Upload failed: " + error.message);
            return;
          }
          // Get public URL
          const { publicUrl } = sb.storage.from("avatars").getPublicUrl(filePath).data ?? {};
          if (!publicURL) {
            alert("Could not get public URL for avatar.");
            return;
          }
          // Save to profile
          const ok = await setErikProfileAvatar(publicURL);
          if (!ok) {
            alert("Failed to save avatar URL.");
            return;
          }
          // Redirect to home
          window.location.href = "/";
        }}
      >
        <input
          type="file"
          name="avatar"
          accept=".png,.jpg,.jpeg"
          className="block w-full border rounded px-2 py-1"
          required
        />
        <button type="submit" className="btn-mc-primary w-full mt-2">
          Upload & Save
        </button>
      </form>
    </div>
  );
}
