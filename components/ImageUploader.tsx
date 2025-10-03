// components/ImageUploader.tsx
'use client';

import { useState } from 'react';
import supabaseBrowser from "@/lib/supabaseClient";

type Props = {
  onUploaded?: (path: string, publicUrl: string) => void;
};

export default function ImageUploader({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = supabaseBrowser(); // ← use our wrapper (no args)

  async function upload() {
    if (!file || loading) return;
    setLoading(true);

    // Optional: strip EXIF client-side later if you want; for now we upload as-is.
    const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

    // Upload to the 'images' bucket (make sure it exists and is public)
    const { data, error } = await supabase
      .storage
      .from('images')
      .upload(safeName, file, { upsert: false });

    if (error) {
      console.error(error);
      alert(`Upload failed: ${error.message}`);
      setLoading(false);
      return;
    }

    // Get a public URL
    const { data: pub } = supabase
      .storage
      .from('images')
      .getPublicUrl(data.path);

    setUrl(pub.publicUrl);
    onUploaded?.(data.path, pub.publicUrl);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block"
      />
      <button
        type="button"
        onClick={upload}
        disabled={!file || loading}
        className="btn-mc"
      >
        {loading ? 'Uploading…' : 'Upload'}
      </button>

      {url && (
        <div className="mt-2">
          <div className="text-xs">Uploaded:</div>
          <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
            {url}
          </a>
          <div className="mt-2">
            <img src={url} alt="Uploaded preview" className="max-w-xs border" />
          </div>
        </div>
      )}
    </div>
  );
}