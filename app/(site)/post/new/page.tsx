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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);

  const MAX_TAGS = 12;

  const normalizeTag = (value: string) => value.trim().toLowerCase();

  function addTag(raw: string) {
    const normalized = normalizeTag(raw);
    setTagError(null);
    if (!normalized) return;
    if (normalized.length > 20) {
      setTagError("Tags must be 1-20 characters long.");
      return;
    }
    setTags((prev) => {
      if (prev.length >= MAX_TAGS) {
        setTagError("Limit of 12 tags per post.");
        return prev;
      }
      if (prev.some((tag) => tag === normalized)) {
        setTagError("Duplicate tag.");
        return prev;
      }
      return [...prev, normalized];
    });
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTagError(null);
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && tagInput === "" && tags.length) {
      event.preventDefault();
      const last = tags[tags.length - 1];
      setTags((prev) => prev.slice(0, prev.length - 1));
      setTagInput(last);
    }
  }

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
            tags,
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
    [doc, editor, html, imageUrl, router, tags, textContent, title]
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
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="minecraft, adventure, family"
            className="w-full rounded-md border-2 border-mc-wood-dark bg-mc-parchment px-3 py-2 font-pixel text-sm text-mc-dirt focus:outline-none focus:ring-2 focus:ring-mc-wood"
          />
          {tagError && (
            <p className="text-xs text-red-500">{tagError}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-mc-wood-dark bg-mc-sand/70 px-3 py-1 text-xs uppercase tracking-wide text-mc-wood-dark"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full bg-mc-wood-dark/10 px-1 text-[10px] leading-none text-mc-wood-dark transition hover:bg-mc-wood-dark hover:text-mc-parchment"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
