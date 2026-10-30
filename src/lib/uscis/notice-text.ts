/**
 * USCIS status descriptions sometimes carry raw HTML: anchors to uscis.gov pages and the odd
 * formatting tag. The UI must never render that markup as-is, so this turns a description into
 * text and link segments. Only links to uscis.gov become links; everything else becomes text.
 */

export type NoticeSegment = { type: "text"; value: string } | { type: "link"; href: string; label: string };

const anchorPattern = /<a\s+[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
const tagPattern = /<[^>]+>/g;
const entities: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

function decode(text: string): string {
  return text.replace(tagPattern, "").replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (entity) => entities[entity] ?? entity);
}

function isUscisLink(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "https:" && (url.hostname === "uscis.gov" || url.hostname.endsWith(".uscis.gov"));
  } catch {
    return false;
  }
}

/** Splits a description into text and uscis.gov link segments, merging adjacent text. */
export function parseNoticeText(text: string): NoticeSegment[] {
  const segments: NoticeSegment[] = [];
  const pushText = (value: string) => {
    if (!value) return;
    const last = segments.at(-1);
    if (last?.type === "text") last.value += value;
    else segments.push({ type: "text", value });
  };

  let cursor = 0;
  for (const match of text.matchAll(anchorPattern)) {
    const [whole, href, inner] = match;
    pushText(decode(text.slice(cursor, match.index)));
    const label = decode(inner);
    if (isUscisLink(href)) segments.push({ type: "link", href, label });
    else pushText(label);
    cursor = match.index + whole.length;
  }
  pushText(decode(text.slice(cursor)));
  return segments;
}

/** The description as plain text: links become their label. For emails and the assistant. */
export function noticePlainText(text: string): string {
  return parseNoticeText(text)
    .map((segment) => (segment.type === "link" ? segment.label : segment.value))
    .join("");
}
