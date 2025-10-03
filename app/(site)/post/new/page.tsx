// /app/(site)/post/new/page.tsx
"use client"

import { useState } from "react"
import ImageUploader from "@/components/ImageUploader"

export default function NewPostPage() {
  const [content, setContent] = useState("")

  return (
    <div className="space-y-4">
      <h1 className="font-mc text-lg">Create New Post</h1>
      <form action="/api/posts/create" method="post" className="space-y-3">
        <input
          name="title"
          type="text"
          placeholder="Post title"
          className="w-full rounded border p-2"
        />
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write in markdown..."
          rows={8}
          className="w-full rounded border p-2 font-pixel"
        />

        {/* Image uploader */}
        <ImageUploader />

        <button type="submit" className="btn-mc">Publish</button>
      </form>
    </div>
  )
}
