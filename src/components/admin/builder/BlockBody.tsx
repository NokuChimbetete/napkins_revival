"use client";

import { useRef, useState } from "react";
import type { Block, ImageBlock, ImageRef, Wrap } from "@/lib/blocks/types";
import { blockId } from "@/lib/blocks/types";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { piecePath, uploadImage } from "@/lib/admin/upload";
import { IMAGE_WRAP_OPTIONS, SIZE_PRESETS, TEXT_WRAP_OPTIONS, fromEmbed, toEmbed } from "./blockOps";
import { BlockList, type ListProps } from "./BlockList";
import { TextPane } from "./TextPane";
import styles from "./builder.module.css";
import ui from "../ui.module.css";

/** Every block's own editor, dispatched by type. */
export function BlockBody({
  block,
  list,
  onChange,
}: {
  block: Block;
  list: ListProps;
  onChange: (b: Block) => void;
}) {
  switch (block.type) {
    case "text":
      return (
        <>
          <TextPane
            value={block.text}
            verse={list.verse}
            placeholder="Start typing. A blank line starts a new paragraph."
            onChange={(text) => onChange({ ...block, text })}
          />
          <WrapPicker kind="text" value={block.wrap} onChange={(wrap) => onChange({ ...block, wrap })} />
        </>
      );

    case "image":
      return (
        <ImageEditor
          value={block}
          list={list}
          onChange={(patch) => onChange({ ...block, ...patch })}
          wrap={block.wrap}
          onWrap={(wrap) => onChange({ ...block, wrap })}
        />
      );

    case "gallery":
      return <GalleryEditor block={block} list={list} onChange={onChange} />;

    case "embed":
      return <EmbedEditor block={block} onChange={onChange} />;

    case "video":
      return (
        <>
          <p className={styles.legacyNote}>
            <span>⚠</span>
            <span>
              A video file uploaded to Storage. One archive piece uses this; new video goes on
              YouTube instead, which loads faster and doesn&rsquo;t cost us bandwidth.
            </span>
          </p>
          <input className={styles.miniInput} value={block.src} readOnly style={{ width: "100%" }} />
        </>
      );

    case "heading":
      return (
        <input
          className={ui.input}
          value={block.text}
          placeholder="Section title"
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );

    case "list":
      return (
        <>
          <textarea
            className={ui.textarea}
            value={block.items.join("\n")}
            rows={Math.max(3, block.items.length + 1)}
            placeholder={"One item per line"}
            onChange={(e) => onChange({ ...block, items: e.target.value.split("\n") })}
          />
          <div className={styles.controls}>
            <Segmented
              options={[
                { value: true, label: "1. 2. 3." },
                { value: false, label: "• • •" },
              ]}
              value={block.ordered}
              onChange={(ordered) => onChange({ ...block, ordered })}
            />
            <span className={styles.miniLabel}>One item per line.</span>
          </div>
        </>
      );

    case "group":
      return (
        <>
          <WrapPicker
            kind="group"
            value={block.wrap}
            onChange={(wrap) => onChange({ ...block, wrap })}
          />
          <div className={styles.nested} style={{ marginTop: 10 }}>
            <BlockList
              {...list}
              depth={(list.depth ?? 0) + 1}
              blocks={block.blocks}
              onChange={(blocks) => onChange({ ...block, blocks })}
              onLift={undefined}
            />
          </div>
        </>
      );

    case "row":
      return (
        <>
          <div className={styles.cols}>
            {block.cols.map((col, i) => (
              <div key={i} className={styles.col} style={{ flexGrow: col.span }}>
                <div className={styles.colHead}>
                  <span className={styles.colLabel}>Column {i + 1}</span>
                  <span className={styles.blockSpacer} />
                  <span className={styles.miniLabel}>width</span>
                  <select
                    className={styles.miniInput}
                    style={{ flex: "0 0 62px" }}
                    value={col.span}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        cols: block.cols.map((c, j) =>
                          j === i ? { ...c, span: Number(e.target.value) } : c
                        ),
                      })
                    }
                  >
                    {Array.from({ length: 12 }, (_, n) => n + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}/12
                      </option>
                    ))}
                  </select>
                  {block.cols.length > 1 && (
                    <button
                      type="button"
                      className={`${styles.blockAct} ${styles.blockActDanger}`}
                      title="Remove this column"
                      onClick={() =>
                        onChange({ ...block, cols: block.cols.filter((_, j) => j !== i) })
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>

                <BlockList
                  {...list}
                  compact
                  depth={(list.depth ?? 0) + 1}
                  blocks={col.blocks}
                  onChange={(blocks) =>
                    onChange({
                      ...block,
                      cols: block.cols.map((c, j) => (j === i ? { ...c, blocks } : c)),
                    })
                  }
                />
              </div>
            ))}
          </div>

          {block.cols.length < 4 && (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSmall} ${ui.btnGhost}`}
              style={{ marginTop: 10 }}
              onClick={() =>
                onChange({
                  ...block,
                  cols: [...block.cols, { span: 4, blocks: [] }],
                })
              }
            >
              + Add a column
            </button>
          )}
          <p className={styles.miniLabel} style={{ marginTop: 8 }}>
            Widths are shares of a 12-column grid — 6 and 6 is an even split, 8 and 4 puts a
            narrow photo beside a wide column. Columns stack on a phone.
          </p>
        </>
      );

    case "legacy":
      return <LegacyEditor html={block.html} onChange={(html) => onChange({ ...block, html })} />;
  }
}

// ---------------------------------------------------------------------------

function WrapPicker({
  value,
  onChange,
  kind,
}: {
  value: Wrap | undefined;
  onChange: (w: Wrap | undefined) => void;
  kind: "text" | "image" | "group";
}) {
  const base = kind === "text" ? TEXT_WRAP_OPTIONS : IMAGE_WRAP_OPTIONS;
  const options =
    kind === "group" ? [...base, { value: "plain" as Wrap, label: "Plain box" }] : base;
  return (
    <div className={styles.controls}>
      <span className={styles.miniLabel}>Align</span>
      <Segmented
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/** How big the image should look, as a share of the reading column.
 *
 *  Separate from the intrinsic width/height, which describe the file and stay
 *  put so the browser can still reserve the right box while it loads. */
function SizePicker({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
}) {
  const pct = value ?? 100;
  return (
    <div className={styles.controls}>
      <span className={styles.miniLabel}>Size</span>
      <span className={styles.segmented}>
        {SIZE_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.segment} ${pct === p ? styles.segmentOn : ""}`}
            onClick={() => onChange(p === 100 ? undefined : p)}
          >
            {p === 100 ? "Full" : `${p}%`}
          </button>
        ))}
      </span>
      <input
        type="range"
        min={5}
        max={100}
        step={1}
        value={pct}
        aria-label="Image width, percent of the column"
        className={styles.slider}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(n >= 100 ? undefined : n);
        }}
      />
      <span className={styles.dims} style={{ minWidth: 34 }}>
        {pct}%
      </span>
    </div>
  );
}

function Segmented<T>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <span className={styles.segmented}>
      {options.map((o) => (
        <button
          key={String(o.label)}
          type="button"
          className={`${styles.segment} ${o.value === value ? styles.segmentOn : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

function ImageEditor({
  value,
  list,
  onChange,
  wrap,
  onWrap,
}: {
  value: ImageBlock;
  list: ListProps;
  onChange: (patch: Partial<ImageBlock>) => void;
  wrap?: Wrap;
  onWrap?: (w: Wrap | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function take(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const name = `inline-${Date.now().toString(36)}`;
      const { url, width, height } = await uploadImage(
        file,
        "piece-images",
        piecePath(list.issueNumber, list.slug, name)
      );
      onChange({ src: url, width, height, alt: value.alt || file.name.replace(/\.[^.]+$/, "") });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className={styles.imageRow}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
      >
        {value.src ? (
          /* a Storage URL in an admin-only thumbnail; next/image adds nothing
             here and 400s on an image that is still uploading */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.src}
            alt=""
            className={styles.thumb}
            onClick={() => inputRef.current?.click()}
            style={{ cursor: "pointer" }}
          />
        ) : (
          <button
            type="button"
            className={`${styles.thumb} ${styles.thumbEmpty}`}
            style={over ? { borderColor: "#e2622b", color: "#b4470f" } : undefined}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : "Drop an image\nor click"}
          </button>
        )}

        <div className={styles.imageFields}>
          <input
            className={styles.miniInput}
            value={value.alt}
            placeholder="Describe the image for screen readers"
            onChange={(e) => onChange({ alt: e.target.value })}
          />
          <div className={styles.controls} style={{ marginTop: 0 }}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSmall}`}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "Uploading…" : value.src ? "Replace" : "Choose image"}
            </button>
            {value.width && value.height ? (
              <span className={styles.dims}>
                {value.width} × {value.height}
              </span>
            ) : null}
          </div>
          {onWrap && <WrapPicker kind="image" value={wrap} onChange={onWrap} />}
          <SizePicker
            value={value.scale}
            onChange={(scale) =>
              // shrinking an image and leaving it centred is almost never what
              // anyone means, so the first time it is scaled down it also picks
              // a side — changeable straight afterwards
              onChange(scale && !wrap ? { scale, wrap: "left" } : { scale })
            }
          />
          <span className={styles.miniLabel}>
            Size is a share of the reading column, so it holds at every screen width.
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {error && (
        <p className={ui.error} style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </>
  );
}

function GalleryEditor({
  block,
  list,
  onChange,
}: {
  block: Extract<Block, { type: "gallery" }>;
  list: ListProps;
  onChange: (b: Block) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function take(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(files.length);
    const added: ImageRef[] = [];
    try {
      for (const file of Array.from(files)) {
        const name = `gal-${Date.now().toString(36)}-${added.length}`;
        const { url, width, height } = await uploadImage(
          file,
          "piece-images",
          piecePath(list.issueNumber, list.slug, name)
        );
        added.push({ src: url, alt: "", width, height });
        setBusy((n) => n - 1);
      }
      onChange({ ...block, images: [...block.images, ...added] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      if (added.length) onChange({ ...block, images: [...block.images, ...added] });
    } finally {
      setBusy(0);
    }
  }

  const move = (i: number, d: number) => {
    const to = i + d;
    if (to < 0 || to >= block.images.length) return;
    const next = [...block.images];
    [next[i], next[to]] = [next[to], next[i]];
    onChange({ ...block, images: next });
  };

  return (
    <>
      <div className={styles.galleryGrid}>
        {block.images.map((img, i) => (
          <div key={`${img.src}-${i}`} className={styles.galleryCell}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="" className={styles.galleryImg} />
            <button
              type="button"
              className={styles.cellRemove}
              title="Remove"
              onClick={() =>
                onChange({ ...block, images: block.images.filter((_, j) => j !== i) })
              }
            >
              ✕
            </button>
            <span className={styles.cellOrder}>
              <button type="button" className={styles.cellArrow} onClick={() => move(i, -1)}>
                ←
              </button>
              <button type="button" className={styles.cellArrow} onClick={() => move(i, 1)}>
                →
              </button>
            </span>
          </div>
        ))}

        <button
          type="button"
          className={styles.galleryDrop}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? `Uploading ${busy}…` : "+ Add images"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void take(e.target.files);
          e.target.value = "";
        }}
      />

      <p className={styles.miniLabel} style={{ marginTop: 9 }}>
        A slideshow swipes sideways, one image at a time. For pictures that each need their own
        caption, use <strong>Image + caption</strong> blocks instead — captions belong beside their
        picture, not on a carousel.
      </p>

      {error && (
        <p className={ui.error} style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </>
  );
}

function EmbedEditor({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "embed" }>;
  onChange: (b: Block) => void;
}) {
  const [raw, setRaw] = useState(block.url ? fromEmbed(block.url) : "");
  const [error, setError] = useState<string | null>(null);

  function apply(input: string) {
    setRaw(input);
    if (!input.trim()) {
      setError(null);
      return;
    }
    const parsed = toEmbed(input);
    if (!parsed) {
      setError("That link isn’t YouTube, Spotify or SoundCloud — those are the three we embed.");
      return;
    }
    setError(null);
    onChange({ ...block, provider: parsed.provider, url: parsed.url });
  }

  return (
    <>
      <input
        className={ui.input}
        value={raw}
        placeholder="Paste a YouTube, Spotify or SoundCloud link"
        onChange={(e) => apply(e.target.value)}
      />
      {error ? (
        <p className={ui.error} style={{ marginTop: 9 }}>
          {error}
        </p>
      ) : (
        <p className={styles.miniLabel} style={{ marginTop: 9 }}>
          {block.url
            ? `Recognised as ${block.provider}. Paste what's in your address bar — never iframe code.`
            : "Paste what's in your address bar. We build the player from it."}
        </p>
      )}
    </>
  );
}

function LegacyEditor({ html, onChange }: { html: string; onChange: (h: string) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <p className={styles.legacyNote}>
        <span>◆</span>
        <span>
          Imported from the old site with a layout the block editor can&rsquo;t take apart. It
          renders exactly as it was published — leave it alone unless something looks wrong.
        </span>
      </p>

      {editing ? (
        <textarea
          className={styles.rawArea}
          rows={8}
          value={html}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          className={styles.legacyPreview}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) ?? "" }}
        />
      )}

      <button
        type="button"
        className={`${ui.btn} ${ui.btnSmall} ${ui.btnGhost}`}
        style={{ marginTop: 9 }}
        onClick={() => setEditing((e) => !e)}
      >
        {editing ? "Done editing HTML" : "Edit the HTML"}
      </button>
    </>
  );
}

export { blockId };
