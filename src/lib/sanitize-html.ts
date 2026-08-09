/**
 * Last line of defence before dangerouslySetInnerHTML.
 *
 * body_html is a *cache*, regenerated from the block document — but it is still
 * a text column in a database that four people and one migration script can
 * write to, and it is injected into the page raw. So it is re-checked on the
 * way out, every time, in `rowToEntry()`: one choke point every read path
 * already shares.
 *
 * The rule is an allowlist, not a blocklist: a tag is rebuilt from scratch out
 * of the attributes named here, or it is dropped and its text kept. Anything
 * this file does not know about cannot reach the page — including whatever
 * the next scraper or paste-handler decides to invent.
 *
 * No dependency. A sanitizer is exactly the kind of thing that must still work
 * in five years without a version bump, and the allowlist it has to cover is
 * fixed by `src/lib/blocks/render.ts` — which is the only thing that legitimately
 * produces this HTML.
 */

/** Kept as-is, no attributes of their own. */
const BARE = /^(?:br|em|strong|h[1-6]|blockquote|ul|ol|li|p)$/i;

/** The only classes the reader has styles for. Anything else is a typo or an
 *  injection attempt; either way it renders unstyled, so it is dropped. */
const DIV_CLASS =
  /^(?:align-left|align-center|align-right|gallery|row|col|embed embed-video|embed embed-audio)$/;

/** The only classes a <span> may carry, and the only reason <span> is allowed
 *  at all: caption styling and an explicit reading size. Matched whole, in the
 *  canonical order render.ts writes them, so nothing else can ride along. */
const SPAN_CLASS = /^(?:caption|caption size-(?:sm|lg|xl)|size-(?:sm|lg|xl))$/;

const IFRAME_HOST =
  /^https:\/\/(?:www\.youtube\.com\/embed\/|open\.spotify\.com\/embed\/|w\.soundcloud\.com\/player\/)/i;

/** Our own paths and our own Storage bucket. Nothing else gets to be a <video>
 *  or an <img> src — that is also what keeps the Next image optimizer, which
 *  runs over this HTML afterwards, pointed only at hosts it is configured for. */
const MEDIA_SRC = /^(?:\/(?!\/)|https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/)/i;

const attrOf = (tag: string, name: string): string | null =>
  tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ??
  tag.match(new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`, "i"))?.[1] ??
  null;

/** Decode-then-encode rather than encode, so sanitizing an already-sanitized
 *  string is a no-op instead of turning &amp; into &amp;amp; each pass. */
const esc = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** Numeric attributes are re-emitted only if they really are numbers, so
 *  data-span="4" onload=..." can't smuggle anything through. */
const num = (v: string | null): string | null => (v && /^\d{1,4}$/.test(v) ? v : null);

function clean(tag: string): string {
  const parsed = tag.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)/);
  if (!parsed) return "";
  const [, closing, rawName] = parsed;
  const name = rawName.toLowerCase();

  if (BARE.test(name)) return `<${closing}${name}>`;
  if (closing)
    return ["div", "a", "video", "iframe", "span"].includes(name) ? `</${name}>` : "";

  switch (name) {
    case "span": {
      // A span with no recognised class is dropped and its text kept — the
      // element only exists to carry caption/size, so there is nothing else it
      // could legitimately be doing.
      const cls = attrOf(tag, "class");
      return cls && SPAN_CLASS.test(cls) ? `<span class="${cls}">` : "";
    }

    case "div": {
      const cls = attrOf(tag, "class");
      if (!cls) return "<div>";
      if (!DIV_CLASS.test(cls)) return "<div>";
      const count = num(attrOf(tag, "data-count"));
      const span = num(attrOf(tag, "data-span"));
      return (
        `<div class="${cls}"` +
        (count ? ` data-count="${count}"` : "") +
        (span ? ` data-span="${span}"` : "") +
        ">"
      );
    }

    case "a": {
      const href = attrOf(tag, "href") ?? "";
      // javascript:, data:, vbscript: and protocol-relative all fail this
      if (!/^https?:\/\//i.test(href)) return "";
      return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">`;
    }

    case "img": {
      const src = attrOf(tag, "src") ?? "";
      // /_next/image is what optimizeBodyImages() rewrites to; allowed so that
      // sanitizing an already-optimized string stays lossless
      if (!MEDIA_SRC.test(src) && !src.startsWith("/_next/image")) return "";
      const w = num(attrOf(tag, "width"));
      const h = num(attrOf(tag, "height"));
      const srcset = attrOf(tag, "srcset");
      const sizes = attrOf(tag, "sizes");
      // The ONE style permitted anywhere, and it is rebuilt from this match
      // rather than passed through — an editor can shrink an image, and
      // nothing else can ride in on a style attribute.
      const scale = attrOf(tag, "style")?.match(/^\s*width:\s*(\d{1,3})%\s*;?\s*$/i)?.[1];
      const pct = scale && Number(scale) >= 1 && Number(scale) <= 100 ? Number(scale) : null;
      return (
        `<img src="${esc(src)}"` +
        (srcset ? ` srcset="${esc(srcset)}"` : "") +
        (sizes ? ` sizes="${esc(sizes)}"` : "") +
        ` alt="${esc(attrOf(tag, "alt") ?? "")}"` +
        (w ? ` width="${w}"` : "") +
        (h ? ` height="${h}"` : "") +
        (pct && pct < 100 ? ` style="width:${pct}%"` : "") +
        ` loading="${attrOf(tag, "loading") === "eager" ? "eager" : "lazy"}"` +
        (attrOf(tag, "decoding") ? ` decoding="async"` : "") +
        ">"
      );
    }

    case "iframe": {
      const src = attrOf(tag, "src") ?? "";
      if (!IFRAME_HOST.test(src.replace(/&amp;/g, "&"))) return "";
      return `<iframe src="${esc(src)}" loading="lazy" allowfullscreen>`;
    }

    case "video": {
      const src = attrOf(tag, "src") ?? "";
      if (!MEDIA_SRC.test(src)) return "";
      return `<video src="${esc(src)}" controls preload="metadata" playsinline>`;
    }

    default:
      return ""; // <script>, <style>, <svg>, <object>… dropped, text kept
  }
}

export function sanitizeHtml(html: string | null): string | null {
  if (!html) return html;
  // Comments can hide a closing tag from the scanner below; remove them first.
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<\/?[a-zA-Z][^>]*>/g, clean);
}
