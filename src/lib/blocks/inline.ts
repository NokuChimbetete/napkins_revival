/**
 * The two functions that decide whether a poem survives.
 *
 * A text block's `text` is what an editor types into a textarea. It is plain
 * text with exactly four things allowed to be markup — <em>, <strong>, <a> and
 * (rarely, from the archive) <img> — and one rule: a newline is a line break.
 *
 * Everything else an editor could type, including a stray "<", is escaped on
 * the way out. That is why "***" can be a scene divider and "[her]" can be an
 * editorial insertion without either becoming formatting.
 *
 * These two must be exact inverses. `scripts/verify-blocks.mjs` asserts it
 * across all 117 archive pieces, byte for byte.
 */

/** The only markup that may live inside a text block, as it is stored. */
const INLINE_TAG =
  /<\/?(?:em|strong)>|<a\s[^>]*>|<\/a>|<img\s[^>]*>|<br\s*\/?>/gi;

/**
 * Named entities the archive uses, decoded to the real character.
 *
 * This is a deliberate canonicalisation: the source spells the same character
 * both ways (38 `&rsquo;` alongside plenty of raw "’"), so preserving whichever
 * form each piece happened to use would mean carrying a second, invisible
 * dimension of state forever. Decoding is render-identical — the browser draws
 * the same glyph either way — and it means the textarea shows editors a
 * curly quote rather than "&rsquo;".
 *
 * &nbsp; is NOT in this table. It survives as U+00A0 and is re-encoded on the
 * way out, because a non-breaking space is invisible in a textarea and 864 of
 * them carry the indentation of several poems.
 */
const DECODE: Record<string, string> = {
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&ndash;": "–",
  "&mdash;": "—",
  "&hellip;": "…",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, (m) => DECODE[m.toLowerCase()] ?? m);
}

/** Text → HTML text node. Order matters: "&" first, or it double-escapes. */
export function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;");
}

/** Read one attribute off a tag, single- or double-quoted. */
export function attr(tag: string, name: string): string | null {
  return (
    tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
    tag.match(new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, "i"))?.[1] ??
    null
  );
}

/** Rebuild an <a> in exactly one canonical form, whatever was typed.
 *  Non-http(s) hrefs — javascript:, data: — are dropped entirely. */
function normalizeAnchor(tag: string): string {
  const href = attr(tag, "href") ?? "";
  if (!/^https?:\/\//i.test(href)) return "";
  return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
}

/** The only style an <img> may carry: a displayed width in whole percent.
 *  Rebuilt from the match rather than passed through, so `style` can never
 *  become a general escape hatch into the page. */
export function imageScale(tag: string): number | null {
  const m = attr(tag, "style")?.match(/^\s*width:\s*(\d{1,3})%\s*;?\s*$/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 100 ? n : null;
}

/** Rebuild an <img> in the archive's attribute order, dropping anything else. */
export function normalizeImg(tag: string): string {
  const src = attr(tag, "src") ?? "";
  if (!src || /^javascript:/i.test(src)) return "";
  const alt = attr(tag, "alt") ?? "";
  const width = attr(tag, "width");
  const height = attr(tag, "height");
  const loading = attr(tag, "loading") ?? "lazy";
  const scale = imageScale(tag);
  return (
    `<img src="${src}" alt="${alt.replace(/"/g, "&quot;")}"` +
    (width ? ` width="${width}"` : "") +
    (height ? ` height="${height}"` : "") +
    (scale && scale < 100 ? ` style="width:${scale}%"` : "") +
    ` loading="${loading}">`
  );
}

/** Stored inline HTML → the text an editor sees and edits. */
export function inlineToText(html: string): string {
  let out = "";
  let last = 0;
  INLINE_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_TAG.exec(html))) {
    out += decodeEntities(html.slice(last, m.index));
    last = INLINE_TAG.lastIndex;
    out += /^<br/i.test(m[0]) ? "\n" : m[0];
  }
  return out + decodeEntities(html.slice(last));
}

/**
 * Whitespace the author meant to keep.
 *
 * HTML collapses runs of spaces, and poets indent. An editor who types eight
 * spaces to hang a line, or two to mark a caesura, would otherwise watch them
 * vanish between the textarea and the page — the same silent flattening this
 * whole format exists to prevent.
 *
 * Applied to the WHOLE text before it is split into segments, not inside
 * escapeText: segments are cut at every <em> and <a>, so "^" there means "after
 * the last tag", and `<em>their</em> hands` would gain a hard space it never
 * had. Learned the hard way — it changed 46 archive pieces.
 *
 * Indentation becomes all non-breaking; an internal run keeps its last space
 * breakable, so prose still wraps where the author left room for it. Neither
 * touches the archive: it has no double spaces, and the scraper already
 * stripped every space that followed a <br>.
 */
const NBSP = " ";

function keepAuthoredSpaces(text: string): string {
  return text
    // only a run that actually indents something: one archive piece has a
    // lone space sitting on an otherwise empty line, and hardening that would
    // put a visible character where there was none
    .replace(/\n( +)(?=[^ \n])/g, (_m, run: string) => "\n" + NBSP.repeat(run.length))
    .replace(/ {2,}/g, (run) => NBSP.repeat(run.length - 1) + " ");
}

/** The text an editor typed → inline HTML. The inverse of inlineToText. */
export function textToInline(input: string): string {
  const text = keepAuthoredSpaces(input);
  let out = "";
  let last = 0;
  INLINE_TAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_TAG.exec(text))) {
    out += escapeText(text.slice(last, m.index)).replace(/\n/g, "<br>");
    last = INLINE_TAG.lastIndex;
    const tag = m[0];
    if (/^<br/i.test(tag)) out += "<br>";
    else if (/^<a\s/i.test(tag)) out += normalizeAnchor(tag);
    else if (/^<img/i.test(tag)) out += normalizeImg(tag);
    else out += tag.toLowerCase();
  }
  return out + escapeText(text.slice(last)).replace(/\n/g, "<br>");
}

/** Plain reading text, for search indexes and the `body` column. */
export function textToPlain(text: string): string {
  return decodeEntities(text.replace(/<[^>]+>/g, ""))
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
