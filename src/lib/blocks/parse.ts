/**
 * body_html → Doc. The migration path for 117 existing pieces, and the repair
 * path for any row whose `doc` is ever lost.
 *
 * The contract is exact: for every piece in the archive,
 *
 *     renderDoc(parseHtml(canonicalize(h))) === canonicalize(h)
 *
 * byte for byte. `scripts/verify-blocks.mjs` proves it. Anything this parser
 * cannot represent becomes a `legacy` block holding the original fragment
 * rather than a best guess — losing an author's layout silently is the one
 * outcome worth failing loudly to avoid.
 */

import {
  blockId,
  type Block,
  type Doc,
  type EmbedProvider,
  type ImageRef,
  type Wrap,
} from "./types";
import { attr, imageScale, inlineToText } from "./inline";

/** Tags that nest and therefore need a real tree. Everything else — em,
 *  strong, a, img, br — is inline and travels inside a text block verbatim. */
const CONTAINER = /^(?:div|p|h[1-6]|blockquote|ol|ul|li|video|iframe)$/i;

type Node =
  | { kind: "text"; raw: string }
  | { kind: "el"; tag: string; open: string; children: Node[] };

/**
 * A tag-walking parser rather than a regex, because rows contain rows and
 * align divs contain divs. Unbalanced closing tags are ignored rather than
 * throwing: a parser that gives up on one malformed fragment would take the
 * whole issue down with it.
 */
function parseNodes(html: string): Node[] {
  const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  const root: Node[] = [];
  const stack: { children: Node[]; tag: string }[] = [{ children: root, tag: "" }];
  let last = 0;
  let m: RegExpExecArray | null;

  const push = (n: Node) => stack[stack.length - 1].children.push(n);
  const text = (s: string) => {
    if (!s) return;
    const top = stack[stack.length - 1].children;
    const prev = top[top.length - 1];
    if (prev?.kind === "text") prev.raw += s;
    else top.push({ kind: "text", raw: s });
  };

  while ((m = TAG.exec(html))) {
    const [full, closing, tag] = m;
    if (!CONTAINER.test(tag)) continue; // inline: leave it in the text run
    text(html.slice(last, m.index));
    last = TAG.lastIndex;

    if (closing) {
      // unwind to the matching open tag, tolerating stray closers
      let at = -1;
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag.toLowerCase() === tag.toLowerCase()) {
          at = i;
          break;
        }
      }
      if (at > 0) stack.length = at;
    } else {
      const node: Node = { kind: "el", tag: tag.toLowerCase(), open: full, children: [] };
      push(node);
      stack.push({ children: node.children, tag });
    }
  }
  text(html.slice(last));
  return root;
}

const classOf = (open: string) => attr(open, "class") ?? "";

const wrapOf = (cls: string): Wrap | null =>
  cls === "align-left"
    ? "left"
    : cls === "align-center"
      ? "center"
      : cls === "align-right"
        ? "right"
        : cls === ""
          ? "plain"
          : null;

/** Split an inline run into text and image blocks.
 *
 *  Only TOP-LEVEL images split the run. Two archive pieces wrap an image in
 *  <em>; splitting there would break the emphasis across two blocks and change
 *  the markup, so those images stay inside the text block, where <img> is an
 *  allowed inline tag. */
function flowToBlocks(flow: string): Block[] {
  if (!flow) return [];
  const out: Block[] = [];
  let buf = "";
  let depth = 0;
  const TOKEN = /<(\/?)(?:em|strong|a)\b[^>]*>|<img\b[^>]*>/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  const flushText = () => {
    if (buf) out.push({ id: blockId(), type: "text", text: inlineToText(buf) });
    buf = "";
  };

  while ((m = TOKEN.exec(flow))) {
    buf += flow.slice(last, m.index);
    last = TOKEN.lastIndex;
    if (/^<img/i.test(m[0])) {
      if (depth > 0) {
        buf += m[0];
      } else {
        flushText();
        out.push(imageBlock(m[0]));
      }
    } else {
      buf += m[0];
      depth += m[1] ? -1 : 1;
      if (depth < 0) depth = 0;
    }
  }
  buf += flow.slice(last);
  flushText();
  return out;
}

function imageRef(tag: string): ImageRef & { scale?: number } {
  const w = attr(tag, "width");
  const h = attr(tag, "height");
  const scale = imageScale(tag);
  return {
    src: attr(tag, "src") ?? "",
    alt: attr(tag, "alt") ?? "",
    ...(w ? { width: Number(w) } : {}),
    ...(h ? { height: Number(h) } : {}),
    ...(scale ? { scale } : {}),
  };
}

const imageBlock = (tag: string): Block => ({ id: blockId(), type: "image", ...imageRef(tag) });

const legacy = (html: string): Block => ({ id: blockId(), type: "legacy", html });

/** Serialise a node subtree back to HTML, for legacy blocks. */
function raw(nodes: Node[]): string {
  return nodes
    .map((n) => (n.kind === "text" ? n.raw : `${n.open}${raw(n.children)}</${n.tag}>`))
    .join("");
}

const rawEl = (n: Node) => (n.kind === "el" ? `${n.open}${raw(n.children)}</${n.tag}>` : n.raw);

/** All children are <img> and nothing else? Galleries and rows depend on it. */
function imagesOnly(nodes: Node[]): ImageRef[] | null {
  const imgs: ImageRef[] = [];
  for (const n of nodes) {
    if (n.kind !== "text") return null;
    let rest = n.raw;
    for (const m of n.raw.matchAll(/<img\b[^>]*>/gi)) imgs.push(imageRef(m[0]));
    rest = rest.replace(/<img\b[^>]*>/gi, "").trim();
    if (rest) return null;
  }
  return imgs;
}

const PROVIDERS: { test: RegExp; provider: EmbedProvider }[] = [
  { test: /^https:\/\/www\.youtube\.com\/embed\//i, provider: "youtube" },
  { test: /^https:\/\/open\.spotify\.com\/embed\//i, provider: "spotify" },
  { test: /^https:\/\/w\.soundcloud\.com\/player\//i, provider: "soundcloud" },
];

function elementToBlocks(n: Node & { kind: "el" }): Block[] {
  const cls = classOf(n.open);

  if (n.tag === "video") {
    const src = attr(n.open, "src");
    return src ? [{ id: blockId(), type: "video", src }] : [legacy(rawEl(n))];
  }

  if (n.tag === "h3") return [{ id: blockId(), type: "heading", text: inlineToText(raw(n.children)) }];

  if (n.tag === "ol" || n.tag === "ul") {
    const items: string[] = [];
    for (const c of n.children) {
      if (c.kind === "text") {
        if (c.raw.trim()) return [legacy(rawEl(n))];
        continue;
      }
      if (c.tag !== "li" || c.children.some((g) => g.kind === "el")) return [legacy(rawEl(n))];
      items.push(inlineToText(raw(c.children)));
    }
    return [{ id: blockId(), type: "list", ordered: n.tag === "ol", items }];
  }

  if (n.tag !== "div") return [legacy(rawEl(n))];

  if (cls === "row") {
    const cols: { span: number; blocks: Block[] }[] = [];
    for (const c of n.children) {
      if (c.kind === "text") {
        if (c.raw.trim()) return [legacy(rawEl(n))];
        continue;
      }
      if (c.tag !== "div" || classOf(c.open) !== "col") return [legacy(rawEl(n))];
      cols.push({ span: Number(attr(c.open, "data-span") ?? 1), blocks: nodesToBlocks(c.children) });
    }
    return cols.length ? [{ id: blockId(), type: "row", cols }] : [legacy(rawEl(n))];
  }

  if (cls === "gallery") {
    const images = imagesOnly(n.children);
    // data-count has to agree, or re-rendering would silently change the
    // scroll-snap behaviour the CSS keys off
    if (!images?.length || Number(attr(n.open, "data-count")) !== images.length) {
      return [legacy(rawEl(n))];
    }
    return [{ id: blockId(), type: "gallery", images }];
  }

  if (cls.startsWith("embed")) {
    const frame = n.children.find((c) => c.kind === "el" && c.tag === "iframe");
    const src = frame?.kind === "el" ? attr(frame.open, "src") : null;
    const provider = src && PROVIDERS.find((p) => p.test.test(decodeAmp(src)))?.provider;
    const expected = provider === "youtube" ? "embed embed-video" : "embed embed-audio";
    if (!provider || cls !== expected) return [legacy(rawEl(n))];
    return [{ id: blockId(), type: "embed", provider, url: decodeAmp(src!) }];
  }

  const wrap = wrapOf(cls);
  if (!wrap) return [legacy(rawEl(n))];

  const inner = nodesToBlocks(n.children);
  // A wrapper holding one plain thing is that thing, wrapped — keeps the
  // document small and gives the editor an image with an alignment control
  // instead of a group it has to reason about.
  if (inner.length === 1 && (inner[0].type === "text" || inner[0].type === "image") && !inner[0].wrap) {
    return [{ ...inner[0], wrap }];
  }
  return [{ id: blockId(), type: "group", wrap, blocks: inner }];
}

const decodeAmp = (s: string) => s.replace(/&amp;/g, "&");

function nodesToBlocks(nodes: Node[]): Block[] {
  const out: Block[] = [];
  for (const n of nodes) {
    if (n.kind === "text") out.push(...flowToBlocks(n.raw));
    else out.push(...elementToBlocks(n));
  }
  return out;
}

/**
 * One-time canonicalisation, applied before parsing.
 *
 * The scraper left empty inline tags behind — a leading <strong></strong> on 24
 * pieces, and an orphaned Instagram <a></a> that got copied onto five poems.
 * They render as nothing, but an editor opening a poem and finding a stray link
 * tag above the first line will either be confused by it or delete half a line
 * removing it. Dropping them is render-identical.
 *
 * Strictly *empty* only: <strong> </strong> keeps its space. That space is a
 * character on the page, and one archive piece has one. Repeated until stable,
 * because removing the inner tag of <strong><em></em></strong> is what makes
 * the outer one empty.
 */
export function canonicalize(html: string): string {
  let h = html;
  for (let i = 0; i < 6; i++) {
    const before = h;
    h = h.replace(/<(em|strong)><\/\1>/gi, "");
    h = h.replace(/<a\b[^>]*><\/a>/gi, "");
    if (h === before) break;
  }
  return h;
}

export function parseHtml(html: string | null | undefined): Doc {
  return { v: 1, blocks: nodesToBlocks(parseNodes(html ?? "")) };
}
