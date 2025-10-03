import sanitizeHtmlLib, { IOptions } from "sanitize-html";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const sanitizeOptions: IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "code",
    "pre",
    "a",
    "img",
    "hr",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    '*': ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform(
      "a",
      { target: "_blank", rel: "noopener noreferrer" },
      true
    ),
  },
};

export type PostContentSource = {
  content_html?: string | null;
  content?: string | null;
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtmlLib(html, sanitizeOptions);
}

export function markdownToHtml(markdown: string): string {
  const raw = marked.parse(markdown ?? "");
  return sanitizeRichText(typeof raw === "string" ? raw : raw.toString());
}

export function htmlToPlainText(html: string): string {
  return sanitizeHtmlLib(html, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function extractPostContent(source: PostContentSource) {
  const candidateHtml = source.content_html?.trim();
  const fallbackText = source.content?.trim();

  let html = "";
  if (candidateHtml) {
    html = sanitizeRichText(candidateHtml);
  } else if (fallbackText) {
    html = markdownToHtml(fallbackText);
  }

  const text = html ? htmlToPlainText(html) : fallbackText?.trim() ?? "";
  return { html, text };
}

export function buildExcerpt(text: string, limit = 180) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit).trimEnd()}…`;
}

export const postSanitizeOptions = sanitizeOptions;
