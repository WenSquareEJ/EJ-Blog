// /app/api/ai/route.ts
import { NextResponse } from "next/server"
import OpenAI from "openai"

const apiKey = process.env.OPENAI_API_KEY

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI helper unavailable" },
      { status: 503 }
    )
  }

  const client = new OpenAI({ apiKey })
  const { question } = await req.json()

  const chat = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: question }],
  })

  const answer = chat.choices[0].message.content
  return NextResponse.json({ answer })
}
