import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const backupFacts = [
    "Creepers were created by accident while coding pigs!",
    "Endermen get angry if you look right into their eyes.",
    "A Minecraft world is almost eight times bigger than Earth!",
    "You can place a torch under sand or gravel to make it fall and break.",
    "Cats in Minecraft always land on their feet—just like in real life!",
    "The first version of Minecraft was made in just 6 days by Notch.",
    "Diamonds are most common at Y-level -58 in newer versions.",
    "A full day-night cycle in Minecraft lasts exactly 20 minutes.",
    "The Nether is 8 times smaller than the Overworld for travel.",
    "Wolves only spawn in forest and taiga biomes naturally."
  ];

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("No OpenAI key");
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const nonce = Math.random().toString(36).slice(2, 8);
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a fun, safe guide for kids who love Minecraft. Give one short, factual Minecraft fun fact in 1–2 sentences. Keep it cheerful and age-appropriate for kids 7-12. No scary content."
        },
        { role: "user", content: `Give me one different Minecraft fun fact. seed:${nonce}` }
      ],
      max_tokens: 60,
      temperature: 0.8
    });

    const fact =
      completion.choices[0]?.message?.content?.trim() ||
      backupFacts[Math.floor(Math.random() * backupFacts.length)];

    const res = NextResponse.json({ fact });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  } catch {
    const fallback =
      backupFacts[Math.floor(Math.random() * backupFacts.length)];
    const res = NextResponse.json({ fact: fallback });
    res.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    return res;
  }
}