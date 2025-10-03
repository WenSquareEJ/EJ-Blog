// /app/api/ai/route.ts
import { NextResponse } from "next/server"
import OpenAI from "openai"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: Request) {
  const { question } = await req.json()

  const chat = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: question }],
  })

  const answer = chat.choices[0].message.content
  return NextResponse.json({ answer })
}
