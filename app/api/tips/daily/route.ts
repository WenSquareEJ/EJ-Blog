import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getServiceClient } from "@/lib/supabaseService";
import OpenAI from "openai";

const curatedFallback: string[] = [
  "Craft a shield early—right-click to block arrows and creeper splash.",
  "Carry a water bucket to stop fall damage and cross lava safely.",
  "Place torches every ~5 blocks in caves to prevent mob spawns.",
  "Use a boat to move villagers safely—even across land.",
  "Silk Touch keeps ore blocks; use Fortune later for more drops.",
  "Trapdoors let you crawl through 1-block spaces—sneaky tunnels!",
  "Compost extra seeds to make bone meal for crops and trees.",
  "Name tags stop pets and mobs from despawning.",
  "Keep a spare pickaxe; F3+H shows durability numbers.",
  "Bottom slabs stop mob spawns—great for floors and paths.",
];

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD
}

function cleanTip(text: string): string {
  let t = text.trim().replace(/\s+/g, " ");
  // Strip emoji/links and cap length
  t = t.replace(/\p{Extended_Pictographic}/gu, "").replace(/https?:\/\/\S+/g, "");
  if (t.length > 140) t = t.slice(0, 140).trim();
  return t;
}

async function generateTip(): Promise<{ tip: string; source: "ai" | "fallback" }> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const prompt = [
      { role: "system", content: "You write short, kid-safe Minecraft tips for ages 7–12. 1–2 sentences, 90–140 chars, friendly, accurate for Java/Bedrock. No unsafe acts, no hacks/mods, no links, no violence details." },
      { role: "user", content: "Give one helpful Minecraft tip about survival, crafting, redstone basics, farming, exploration, or safety." },
    ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: prompt,
      temperature: 0.7,
      max_tokens: 80,
    });

    const raw = resp.choices?.[0]?.message?.content ?? "";
    const tip = cleanTip(raw);
    if (!tip || tip.length < 50) throw new Error("too short");
    return { tip, source: "ai" };
  } catch {
    const tip = curatedFallback[Math.floor(Math.random() * curatedFallback.length)];
    return { tip: cleanTip(tip), source: "fallback" };
  }
}

export async function GET() {
  try {
    const dateStr = todayUTC();

    // Read client for read-only (cookies ok)
    const supabase = createRouteHandlerClient({ cookies });

    // 1) Check cache
    const { data: existing, error: selErr } = await supabase
      .from("daily_tips")
      .select("text, source, tip_date")
      .eq("tip_date", dateStr)
      .maybeSingle();

    if (existing && !selErr) {
      return NextResponse.json({ date: existing.tip_date, tip: existing.text, source: existing.source });
    }

    // 2) Generate new tip
    const gen = await generateTip();

    // 3) Write with service role (server-only)
    const serverSupabase = getServiceClient();

    const { error: insErr } = await serverSupabase
      .from("daily_tips")
      .insert({ tip_date: dateStr, text: gen.tip, source: gen.source });

    // Even if insert fails (race condition), return the tip we generated
    return NextResponse.json({ date: dateStr, tip: gen.tip, source: gen.source, stored: !insErr });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
