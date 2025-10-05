"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const AVATAR_FILES = ["alex","bluey","creeper","erik_steve","scientist","skeleton","villager","waffle","zombie","steve"];

export default function AvatarHousePage() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [current, setCurrent] = useState("/avatars/steve.png");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in as Erik to change your avatar.");
        return;
      }
      setUser(user);
      const { data } = await supabase
        .from("profile_avatar")
        .select("avatar")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.avatar) setCurrent(data.avatar);
    })();
  }, [supabase]);

  async function chooseAvatar(file: string) {
    if (!user) return;
    await supabase
      .from("profile_avatar")
      .upsert({ id: user.id, avatar: `/avatars/${file}.png` });
    setCurrent(`/avatars/${file}.png`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-mc text-2xl">Avatar House</h1>
        <Link href="/site" className="btn-mc-secondary">← Back to Home</Link>
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <span>Current:</span>
            <Image src={current} alt="Current avatar" width={64} height={64} className="rounded-md" />
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {AVATAR_FILES.map((f) => (
              <button
                key={f}
                onClick={() => chooseAvatar(f)}
                className={`border-2 rounded-md p-1 ${
                  current === `/avatars/${f}.png` ? "border-green-600" : "border-[#5a3d1a]"
                }`}
              >
                <Image
                  src={`/avatars/${f}.png`}
                  alt={f}
                  width={64}
                  height={64}
                  className="object-contain rounded"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}