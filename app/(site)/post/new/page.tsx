// /app/(site)/post/new/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import DOMPurify from "isomorphic-dompurify";
import ImageUploader from "@/components/ImageUploader";

function sanitizePreview(html: string) {
  return DOMPurify.sanitize(html);
}

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [html, setHtml] = useState("<p></p>");
  const [doc, setDoc] = useState<JSONContent | null>(null);
  const [textContent, setTextContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
    ],
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
      setDoc(editor.getJSON());
      setTextContent(editor.getText({ blockSeparator: "\n" }));
    },
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-sm sm:prose-base max-w-none focus:outline-none",
      },
    },
  });

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editor) return;

      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setStatus("Please add a title before publishing.");
        return;
      }

      const currentHtml = html || editor.getHTML();
      const currentDoc = doc ?? editor.getJSON();
      const plainText = textContent || editor.getText({ blockSeparator: "\n" });

      if (!plainText.trim()) {
        setStatus("Write something before publishing.");
        return;
      }

      setSubmitting(true);
      setStatus(null);

      try {
        const response = await fetch("/api/posts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            image_url: imageUrl,
            content_html: currentHtml,
            content_json: currentDoc,
            content_text: plainText,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          setStatus(payload.error ?? "Unable to save the post. Try again.");
          return;
        }

        setStatus("Post submitted for approval! Redirecting…");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unknown error.");
      } finally {
        setSubmitting(false);
      }
    },
    [doc, editor, html, imageUrl, router, textContent, title]
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-mc text-lg sm:text-xl">Create New Post</h1>
        <div className="inline-flex items-center gap-2 rounded border-2 border-mc-wood-dark bg-mc-sand/50 p-1">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={`btn-mc-secondary px-3 py-1 ${
              !showPreview ? "ring-2 ring-mc-wood-dark" : ""
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={`btn-mc-secondary px-3 py-1 ${
              showPreview ? "ring-2 ring-mc-wood-dark" : ""
            }`}
          >
            Preview
          </button>
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.18em] text-mc-stone">
            Title
          </label>
          <input
            name="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Post title"
            className="w-full rounded-md border-2 border-mc-wood-dark bg-mc-parchment px-3 py-2 font-pixel text-sm text-mc-dirt focus:outline-none focus:ring-2 focus:ring-mc-wood"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.18em] text-mc-stone">
            Content
          </label>
          <div className="rounded-md border-2 border-mc-wood-dark bg-mc-parchment p-3">
            {showPreview ? (
              <article
                className="prose prose-sm sm:prose-base max-w-none text-mc-dirt"
                dangerouslySetInnerHTML={{
                  __html: sanitizePreview(html || "<p><em>Nothing yet…</em></p>"),
                }}
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.18em] text-mc-stone">
            Featured Image
          </label>
          <ImageUploader onUploaded={(_, url) => setImageUrl(url)} />
          {imageUrl && (
            <p className="text-xs text-mc-stone">Selected image: {imageUrl}</p>
          )}
        </div>

        {status && <p className="text-sm text-red-600">{status}</p>}

        <div className="flex items-center gap-2">
          <button type="submit" className="btn-mc" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish"}
          </button>
          <button
            type="button"
            className="btn-mc-secondary"
            onClick={() => editor?.commands.clearContent(true)}
            disabled={submitting}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
