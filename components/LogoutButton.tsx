"use client";

import { useRouter } from "next/navigation";
import supabaseBrowser from "@/lib/supabaseClient";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/");
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  return (
    <button onClick={handleLogout} className="underline">
      Log out
    </button>
  );
}