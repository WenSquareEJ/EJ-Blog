'use client'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'

// ReactQuill must load client-side
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichEditor({ value, onChange, placeholder }: Props) {
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        // IMPORTANT: use function () { ... } so `this.quill` is available.
        handlers: {
          image: function (this: any) {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = async () => {
              const file = input.files?.[0]
              if (!file) return
              try {
                const key = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                const { error: upErr } = await supabase.storage
                  .from('images')
                  .upload(key, file, { upsert: false })
                if (upErr) throw upErr

                const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
                const url = `${base}/storage/v1/object/public/images/${key}`

                // Insert at cursor using Quill from the toolbar context
                const quill = this.quill as any
                const range = quill.getSelection(true)
                quill.insertEmbed(range.index, 'image', url, 'user')
                quill.setSelection(range.index + 1, 0)
              } catch (e) {
                alert('Upload failed. Check that the "images" bucket exists and policies allow upload.')
                console.error(e)
              }
            }
            input.click()
          },
        },
      },
      clipboard: { matchVisual: false },
      history: { delay: 500, maxStack: 100, userOnly: true },
    }
  }, [])

  const formats = useMemo(
    () => [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'align',
      'list',
      'bullet',
      'link',
      'image',
    ],
    []
  )

  return (
    <div className="rounded-block border overflow-hidden bg-white">
      <ReactQuill
        /* no ref needed */
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your story…'}
        style={{ minHeight: 220 }}
      />
    </div>
  )
}
