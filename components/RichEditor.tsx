// components/RichEditor.tsx
'use client';

import { useState } from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  height?: number; // px
};

export default function RichEditor({
  value,
  onChange,
  placeholder = 'Write your post in Markdown…',
  height = 240,
}: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        <button
          type="button"
          onClick={() => setTab('edit')}
          className={`px-3 py-2 text-xs font-medium border-r ${
            tab === 'edit' ? 'bg-white' : ''
          }`}
        >
          Edit (Markdown)
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`px-3 py-2 text-xs font-medium ${
            tab === 'preview' ? 'bg-white' : ''
          }`}
        >
          Preview
        </button>
      </div>

      {/* Body */}
      {tab === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ height }}
          className="w-full p-3 font-mono text-sm outline-none"
        />
      ) : (
        <MarkdownPreview markdown={value} />
      )}
    </div>
  );
}

/** Tiny Markdown previewer (bold, italics, code, links, headings, lists). */
function MarkdownPreview({ markdown }: { markdown: string }) {
  // extremely small/strict renderer to avoid extra deps
  let html = markdown
    // escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // very light formatting
  html = html
    .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/$begin:math:display$([^$end:math:display$]+?)\]$begin:math:text$([^)]+?)$end:math:text$/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return (
    <div
      className="p-3 prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}