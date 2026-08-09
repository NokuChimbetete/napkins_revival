import { blockId, type Block, type TextSize, type Wrap } from "@/lib/blocks/types";

/**
 * Making new blocks, and the small edits the palette and block bar perform.
 *
 * Nesting is handled by recursion rather than by id lookup: a group or a
 * column renders its own list with its own onChange, which splices back into
 * its parent. There is no tree-walking update function to get wrong, and a
 * block can only ever be edited through the container that owns it.
 */

export type BlockKind =
  | "text"
  | "verse"
  | "image"
  | "figure"
  | "gallery"
  | "embed"
  | "row"
  | "heading"
  | "list"
  | "group";

export const PALETTE: { kind: BlockKind; name: string; what: string }[] = [
  { kind: "text", name: "Text", what: "Paragraphs, with bold, italics and links" },
  { kind: "verse", name: "Poem", what: "Lines stay exactly where you put them" },
  { kind: "image", name: "Image", what: "One picture, full width or centred" },
  { kind: "figure", name: "Image + caption", what: "A picture with words under it" },
  { kind: "gallery", name: "Slideshow", what: "Several images that swipe sideways" },
  { kind: "row", name: "Side by side", what: "Two columns — text beside a photo" },
  { kind: "embed", name: "Video or audio", what: "Paste a YouTube, Spotify or SoundCloud link" },
  { kind: "heading", name: "Heading", what: "A section title inside the piece" },
  { kind: "list", name: "List", what: "Numbered or bulleted" },
];

export function makeBlock(kind: BlockKind): Block {
  const id = blockId();
  switch (kind) {
    case "text":
    case "verse":
      return { id, type: "text", text: "" };
    case "image":
      return { id, type: "image", src: "", alt: "" };
    case "figure":
      // "Image with caption" is a centred group of [image, text]. Keeping it as
      // two real blocks rather than a caption field is what lets a captioned
      // image stay a scrolling figure — it is never a candidate for collapsing
      // into a carousel, which is a standing design rule.
      return {
        id,
        type: "group",
        wrap: "center",
        blocks: [
          { id: blockId(), type: "image", src: "", alt: "" },
          // caption: true is what makes it read as a caption rather than as
          // another paragraph — two points down from body copy, and italic
          { id: blockId(), type: "text", text: "\nCaption", caption: true },
        ],
      };
    case "gallery":
      return { id, type: "gallery", images: [] };
    case "embed":
      return { id, type: "embed", provider: "youtube", url: "" };
    case "heading":
      return { id, type: "heading", text: "" };
    case "list":
      return { id, type: "list", ordered: true, items: [""] };
    case "group":
      return { id, type: "group", blocks: [] };
    case "row":
      return {
        id,
        type: "row",
        cols: [
          { span: 6, blocks: [{ id: blockId(), type: "text", text: "" }] },
          { span: 6, blocks: [{ id: blockId(), type: "image", src: "", alt: "" }] },
        ],
      };
  }
}

/** A fresh copy of a block, ids and all, so duplicating never aliases state. */
export function cloneBlock(block: Block): Block {
  const copy = structuredClone(block) as Block;
  const reid = (b: Block): Block => {
    b.id = blockId();
    if (b.type === "group") b.blocks = b.blocks.map(reid);
    else if (b.type === "row") b.cols = b.cols.map((c) => ({ ...c, blocks: c.blocks.map(reid) }));
    return b;
  };
  return reid(copy);
}

export const KIND_LABEL: Record<Block["type"], string> = {
  text: "Text",
  image: "Image",
  gallery: "Slideshow",
  embed: "Embed",
  video: "Video file",
  heading: "Heading",
  list: "List",
  group: "Group",
  row: "Side by side",
  legacy: "Imported layout",
};

/** What a block is, in one line, for the collapsed bar. */
export function describeBlock(b: Block): string {
  switch (b.type) {
    case "text": {
      const plain = b.text.replace(/<[^>]+>/g, "").trim();
      return plain ? plain.slice(0, 60).replace(/\n/g, " ") : "empty";
    }
    case "image":
      return b.src ? b.alt || "no alt text" : "no image yet";
    case "gallery":
      return `${b.images.length} image${b.images.length === 1 ? "" : "s"}`;
    case "embed":
      return b.url || "no link yet";
    case "video":
      return "self-hosted video";
    case "heading":
      return b.text || "empty";
    case "list":
      return `${b.items.length} item${b.items.length === 1 ? "" : "s"}`;
    case "group":
      return `${b.blocks.length} block${b.blocks.length === 1 ? "" : "s"}`;
    case "row":
      return `${b.cols.length} columns`;
    case "legacy":
      return "kept exactly as published";
  }
}

/** Alignment for a text block. No wrapper is already left-aligned, so "Left"
 *  is the absence of one rather than an extra div around every paragraph. */
export const TEXT_WRAP_OPTIONS: { value: Wrap | undefined; label: string }[] = [
  { value: undefined, label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
];

/** Alignment for an image, where "no wrapper" means something different: a
 *  bare image centres itself via auto margins, so it needs its own option and
 *  Left has to be an explicit .align-left. */
export const IMAGE_WRAP_OPTIONS: { value: Wrap | undefined; label: string }[] = [
  { value: undefined, label: "Auto" },
  { value: "left", label: "Left" },
  { value: "center", label: "Centre" },
  { value: "right", label: "Right" },
];

/** Sizes offered as buttons, because "about a third" is the actual thought an
 *  editor has. The slider beside them covers everything in between. */
export const SIZE_PRESETS = [25, 40, 60, 80, 100];

/** Reading sizes as named steps, not free pixels. Nine slightly different body
 *  sizes across an issue reads as a mistake; four deliberate ones reads as
 *  typography. `undefined` is the reader's own 18px. */
export const TEXT_SIZE_OPTIONS: { value: TextSize | undefined; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: undefined, label: "Normal" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Huge" },
];

/**
 * Turn a pasted link into the embed URL the reader's iframe needs.
 *
 * Editors paste what is in their address bar. Nobody should ever be asked for
 * iframe HTML — it is the one input that lets arbitrary markup into a piece,
 * and it is exactly the sort of thing that gets copied from a forum post.
 */
export function toEmbed(input: string): { provider: "youtube" | "spotify" | "soundcloud"; url: string } | null {
  const raw = input.trim();
  if (!raw) return null;

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    return id ? { provider: "youtube", url: `https://www.youtube.com/embed/${id}` } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? { provider: "youtube", url: `https://www.youtube.com/embed/${id}` } : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
    return m ? { provider: "youtube", url: `https://www.youtube.com/embed/${m[1]}` } : null;
  }
  if (host === "open.spotify.com") {
    const m = u.pathname.match(/^\/(?:embed\/)?(track|album|playlist|episode|show)\/([^/?]+)/);
    return m
      ? { provider: "spotify", url: `https://open.spotify.com/embed/${m[1]}/${m[2]}` }
      : null;
  }
  if (host === "soundcloud.com" || host === "w.soundcloud.com") {
    if (host === "w.soundcloud.com") return { provider: "soundcloud", url: raw };
    // SoundCloud's player needs the API URL, which a page URL doesn't carry.
    // The widget resolves a page URL too, so hand it that.
    return {
      provider: "soundcloud",
      url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&visual=true&show_comments=true`,
    };
  }
  return null;
}

/** The address bar link for an embed, for showing back to the editor. */
export function fromEmbed(url: string): string {
  const m = url.match(/^https:\/\/www\.youtube\.com\/embed\/([^/?]+)/);
  if (m) return `https://youtu.be/${m[1]}`;
  const s = url.match(/^https:\/\/open\.spotify\.com\/embed\/(.+)$/);
  if (s) return `https://open.spotify.com/${s[1]}`;
  const c = url.match(/[?&]url=([^&]+)/);
  if (c && /soundcloud/.test(url)) {
    try {
      return decodeURIComponent(c[1]);
    } catch {
      return url;
    }
  }
  return url;
}
