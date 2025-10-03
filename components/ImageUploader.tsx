// /components/ImageUploader.tsx
"use client"

import { useState } from "react"
import { createBrowserClient } from "@/lib/supabaseClient"

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const supabase = createBrowserClient()

  async function upload() {
    if (!file) return
    const { data, error } = await supabase.storage
      .from("images")
      .upload(`public/${Date.now()}-${file.name}`, file)

    if (error) {
      alert("Upload failed")
      return
    }
    const { data: pub } = supabase.storage.from("images").getPublicUrl(data.path)
    setUrl(pub.publicUrl)
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="button" onClick={upload} className="btn-mc">
        Upload
      </button>
      {url && <p className="text-xs">Uploaded: {url}</p>}
      <input type="hidden" name="image_url" value={url || ""} />
    </div>
  )
}
