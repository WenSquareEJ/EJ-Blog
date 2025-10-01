'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

async function stripExif(file: File) {
  const bitmap = await createImageBitmap(file)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

export default function ImageUploader({ onUploaded }: { onUploaded: (paths: string[]) => void }) {
  const [loading, setLoading] = useState(false)
  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={async e => {
        const files = Array.from(e.target.files||[])
        if (!files.length) return
        setLoading(true)
        const paths: string[] = []
        for (const f of files.slice(0,5)) {
          const cleaned = await stripExif(f)
          const { data, error } = await supabase.storage.from('images').upload(`${Date.now()}-${cleaned.name}`, cleaned)
          if (!error && data) paths.push(data.path)
        }
        setLoading(false)
        onUploaded(paths)
      }} />
      {loading && <p className="text-sm text-gray-500 mt-2">Uploading…</p>}
    </div>
  )
}
