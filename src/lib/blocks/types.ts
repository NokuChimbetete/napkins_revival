/**
 * The block document: what a piece actually *is*.
 *
 * `body_html` used to be the source of truth. It is now a derived cache — the
 * admin regenerates it from this document on every save, and the reader keeps
 * consuming it unchanged. The inversion matters for one reason: a document can
 * be re-rendered years from now with different markup, and content survives.
 * Hand-edited HTML cannot be restyled, only find-and-replaced.
 *
 * Shape rules that are load-bearing, not stylistic:
 *
 *  1. `text` is LITERAL, not markdown. The archive contains 39 asterisks and 39
 *     square brackets in prose — "***" as a scene divider, "[Baobab Boy]",
 *     "wh*re". Any `**bold**` convention would corrupt them. Emphasis is stored
 *     as the tags themselves.
 *
 *  2. In `text`, "\n" is a line break, one-for-one, including leading and
 *     trailing ones. 46 of 117 pieces are poetry and there are 4,612 <br> tags
 *     in the archive; a poet's line breaks are the form of the poem. A newline
 *     in a textarea is the only representation that no editor, paste handler or
 *     serializer can quietly normalise.
 *
 *  3. Blocks serialise back-to-back with NO separator. The <br> that sat
 *     between an image and the paragraph after it survives as a leading "\n" on
 *     that paragraph. This is what makes the round-trip exact rather than
 *     approximately right.
 */

/** Wrapper a block renders inside. Absent = no wrapper at all.
 *
 *  "left" is not the same as absent, and the difference only shows on images:
 *  a bare <img> in the reader carries `margin: … auto …`, so it centres itself
 *  whatever its width. An image scaled down to 30% therefore floats in the
 *  middle of the column unless something says otherwise, and .align-left is
 *  what says otherwise.
 *
 *  "plain" is Cargo's classless <div>, which four archive pieces still use. */
export type Wrap = "left" | "center" | "right" | "plain";

/** Hosts the archive uses, and the only ones an editor can paste. All future
 *  video is YouTube; the other two exist because one piece each uses them. */
export type EmbedProvider = "youtube" | "spotify" | "soundcloud";

export type ImageRef = { src: string; alt: string; width?: number; height?: number };

type Base = { id: string };

export type TextBlock = Base & { type: "text"; text: string; wrap?: Wrap };

export type ImageBlock = Base & {
  type: "image";
  src: string;
  alt: string;
  /** intrinsic pixel size, so the browser can reserve the box before the file
   *  arrives and the text below doesn't jump */
  width?: number;
  height?: number;
  /** displayed width as a percentage of the column, 5–100. Absent means "as
   *  wide as it goes". Separate from `width` on purpose: that one describes the
   *  file, this one is an editorial decision about how big it should look. */
  scale?: number;
  wrap?: Wrap;
};

/** A slideshow the editors grouped deliberately. Captioned images are NEVER
 *  collapsed into one of these — that is a standing design rule; they stay as
 *  scrolling figures with their captions (a `group` of image + text). */
export type GalleryBlock = Base & { type: "gallery"; images: ImageRef[] };

export type EmbedBlock = Base & { type: "embed"; provider: EmbedProvider; url: string };

/** One legacy self-hosted mp4 in the archive. Not offered when creating a new
 *  block — new video goes to YouTube — but it still has to render. */
export type VideoBlock = Base & { type: "video"; src: string };

export type HeadingBlock = Base & { type: "heading"; text: string };

export type ListBlock = Base & { type: "list"; ordered: boolean; items: string[] };

/** A <div> holding other blocks. This is what makes "image with caption" work
 *  without a special case: it is a centred group of [image, text]. */
export type GroupBlock = Base & { type: "group"; wrap?: Wrap; blocks: Block[] };

/** Side-by-side, on the 12-column grid the original authors composed on.
 *  `span` drives flex-grow in reader.module.css, so a 6/4 split stays 60/40. */
export type RowBlock = Base & { type: "row"; cols: { span: number; blocks: Block[] }[] };

/** The safety net. Nothing in the archive is expected to land here, but a
 *  parser that cannot represent something must preserve it rather than drop it.
 *  Renders verbatim through the same sanitizer as everything else. */
export type LegacyBlock = Base & { type: "legacy"; html: string };

export type Block =
  | TextBlock
  | ImageBlock
  | GalleryBlock
  | EmbedBlock
  | VideoBlock
  | HeadingBlock
  | ListBlock
  | GroupBlock
  | RowBlock
  | LegacyBlock;

export type Doc = { v: 1; blocks: Block[] };

export const emptyDoc = (): Doc => ({ v: 1, blocks: [] });

/** Short, collision-proof enough for block identity inside one document.
 *  Not a slug, not persisted anywhere that matters — purely React keys and
 *  drag-and-drop identity. */
export function blockId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function isDoc(value: unknown): value is Doc {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Doc).v === 1 &&
    Array.isArray((value as Doc).blocks)
  );
}

/** Walk every block in a document, including nested ones. */
export function walkBlocks(blocks: Block[], visit: (b: Block) => void): void {
  for (const b of blocks) {
    visit(b);
    if (b.type === "group") walkBlocks(b.blocks, visit);
    else if (b.type === "row") for (const c of b.cols) walkBlocks(c.blocks, visit);
  }
}
