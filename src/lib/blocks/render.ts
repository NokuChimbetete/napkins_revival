/**
 * Doc → body_html.
 *
 * This is the only place that decides what a piece's markup looks like, which
 * is the point: restyling the archive in 2030 means editing this file, not 117
 * rows. The output has to match `src/components/reader/reader.module.css`
 * exactly — .align-right, .row/.col[data-span], .gallery[data-count],
 * .embed/.embed-audio — because the live reader is the renderer and it is not
 * changing.
 *
 * Isomorphic on purpose: the admin's live preview calls this on every keystroke
 * in the browser, and the save path calls it on the server. One function, so
 * preview and production cannot drift.
 */

import type { Block, Doc, EmbedProvider, ImageRef, TextSize, Wrap } from "./types";
import { normalizeImg, textToInline } from "./inline";

const WRAP_OPEN: Record<Wrap, string> = {
  left: '<div class="align-left">',
  center: '<div class="align-center">',
  right: '<div class="align-right">',
  plain: "<div>",
};

const wrapped = (inner: string, wrap: Wrap | undefined) =>
  wrap ? `${WRAP_OPEN[wrap]}${inner}</div>` : inner;

/**
 * Caption and size ride on a <span> around the whole text run, not on the
 * wrapper div — a text block often has no wrapper, and inventing one to hang a
 * class off would change the block-level layout of everything that has been
 * published so far. A span changes type and nothing else.
 *
 * Class order is fixed (caption, then size) so the string is canonical and the
 * round-trip stays byte-exact.
 */
export const styleClass = (b: { caption?: true; size?: TextSize }): string =>
  [b.caption ? "caption" : "", b.size ? `size-${b.size}` : ""].filter(Boolean).join(" ");

const styled = (inner: string, b: { caption?: true; size?: TextSize }) => {
  const cls = styleClass(b);
  return cls ? `<span class="${cls}">${inner}</span>` : inner;
};

/** Only the two players the reader styles differently: a playlist is a player,
 *  not a 16:9 video frame (see .embed-audio in reader.module.css). */
const embedClass = (p: EmbedProvider) =>
  p === "youtube" ? "embed embed-video" : "embed embed-audio";

/** & inside an attribute has to be an entity or the URL is malformed — the
 *  SoundCloud player URL carries seven of them. */
const attrEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** A scale is emitted as an inline width, because it has to beat
 *  `.bodyHtml .col img { width: 100% }` — an image sized down to 30% must stay
 *  30% inside a side-by-side row too, and only a style attribute outranks that.
 *  The sanitizer rebuilds this attribute from a strict `width:N%` match rather
 *  than passing any style through. */
const img = (i: ImageRef & { scale?: number }) =>
  normalizeImg(
    `<img src="${i.src}" alt="${(i.alt ?? "").replace(/"/g, "&quot;")}"` +
      (i.width ? ` width="${i.width}"` : "") +
      (i.height ? ` height="${i.height}"` : "") +
      (i.scale && i.scale < 100 ? ` style="width:${Math.round(i.scale)}%"` : "") +
      ">"
  );

export function renderBlock(b: Block): string {
  switch (b.type) {
    case "text":
      return wrapped(styled(textToInline(b.text), b), b.wrap);

    case "image":
      return wrapped(img(b), b.wrap);

    case "gallery":
      // data-count is not decoration: .gallery[data-count="1"] turns off the
      // scroll affordance so a one-image "slideshow" doesn't look swipeable.
      return (
        `<div class="gallery" data-count="${b.images.length}">` +
        b.images.map(img).join("") +
        "</div>"
      );

    case "embed":
      return (
        `<div class="${embedClass(b.provider)}">` +
        `<iframe src="${attrEscape(b.url)}" loading="lazy" allowfullscreen></iframe>` +
        "</div>"
      );

    case "video":
      return `<video src="${attrEscape(b.src)}" controls preload="metadata" playsinline></video>`;

    case "heading":
      return `<h3>${textToInline(b.text)}</h3>`;

    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag}>${b.items.map((i) => `<li>${textToInline(i)}</li>`).join("")}</${tag}>`;
    }

    case "group":
      return wrapped(renderBlocks(b.blocks), b.wrap);

    case "row":
      return (
        '<div class="row">' +
        b.cols
          .map((c) => `<div class="col" data-span="${c.span}">${renderBlocks(c.blocks)}</div>`)
          .join("") +
        "</div>"
      );

    case "legacy":
      return b.html;
  }
}

/** No separator between blocks — see the note in types.ts. A <br> that lived
 *  between two blocks belongs to one of them, as a leading or trailing "\n". */
export function renderBlocks(blocks: Block[]): string {
  return blocks.map(renderBlock).join("");
}

export function renderDoc(doc: Doc): string {
  return renderBlocks(doc.blocks);
}
