"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Doc } from "@/lib/blocks/types";
import type { AdminPiece } from "@/lib/admin/data";
import type { PieceMeta } from "@/lib/admin/actions";
import { deletePiece, savePieceDoc, savePieceMeta, setPieceStatus } from "@/lib/admin/actions";
import { looksLikeVerse } from "@/lib/categories";
import { BlockList } from "./BlockList";
import { PiecePreview } from "./PiecePreview";
import { PieceMetaFields } from "../PieceMetaFields";
import { ConfirmDelete } from "../ConfirmDelete";
import styles from "./builder.module.css";
import ui from "../ui.module.css";

/**
 * The builder.
 *
 * Two panes, both live: blocks on the left, the actual reader on the right.
 * The preview is not a lookalike — it renders `EntrySection`, the same
 * component `/issues/[n]` and the napkin modal render, through the same
 * `renderDoc()` the save path uses. There is no second renderer that can drift.
 *
 * Everything autosaves as a draft. An editor can close the tab mid-poem and
 * find it exactly as they left it; nothing they do here reaches the public site
 * until the piece and its issue are both published.
 */

const SAVE_DEBOUNCE = 1400;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function PieceBuilder({
  piece,
  initialDoc,
  issueId,
  issueNumber,
  issueTitle,
  categories,
}: {
  piece: AdminPiece;
  initialDoc: Doc;
  issueId: string;
  issueNumber: number;
  issueTitle: string;
  categories: string[];
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc>(initialDoc);
  const [meta, setMeta] = useState<PieceMeta>({
    title: piece.title,
    author_name: piece.author_name ?? "",
    class_year: piece.class_year ?? "",
    category: piece.category,
    is_frontmatter: piece.is_frontmatter,
    verse: (piece as AdminPiece & { verse?: boolean }).verse ?? false,
  });
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metaOpen, setMetaOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, start] = useTransition();

  const verse = meta.verse || looksLikeVerse(meta.category);

  // What is actually pending. Refs rather than state so the debounce timer
  // always flushes the latest values without re-arming itself on every keystroke.
  const pendingDoc = useRef<Doc | null>(null);
  const pendingMeta = useRef<PieceMeta | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const d = pendingDoc.current;
    const m = pendingMeta.current;
    pendingDoc.current = null;
    pendingMeta.current = null;
    if (!d && !m) return;

    setState("saving");
    setError(null);
    try {
      const results = await Promise.all([
        d ? savePieceDoc(piece.id, d) : Promise.resolve({ ok: true as const }),
        m ? savePieceMeta(piece.id, m) : Promise.resolve({ ok: true as const }),
      ]);
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        setState("error");
        setError(failed.error);
        return;
      }
      setState("saved");
      router.refresh();
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Couldn't save.");
    }
  }, [piece.id, router]);

  const queue = useCallback(
    (next: { doc?: Doc; meta?: PieceMeta }) => {
      if (next.doc) pendingDoc.current = next.doc;
      if (next.meta) pendingMeta.current = next.meta;
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DEBOUNCE);
    },
    [flush]
  );

  const changeDoc = useCallback(
    (blocks: Doc["blocks"]) => {
      const next = { ...doc, blocks };
      setDoc(next);
      queue({ doc: next });
    },
    [doc, queue]
  );

  const changeMeta = useCallback(
    (patch: Partial<PieceMeta>) => {
      const next = { ...meta, ...patch };
      setMeta(next);
      queue({ meta: next });
    },
    [meta, queue]
  );

  // Nothing should be able to leave the page with work still in the debounce
  // window. This is the difference between "autosave" and "usually autosave".
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (pendingDoc.current || pendingMeta.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  const saveNow = () => {
    if (timer.current) clearTimeout(timer.current);
    void flush();
  };

  const togglePublished = () =>
    start(async () => {
      saveNow();
      const res = await setPieceStatus(
        piece.id,
        piece.status === "published" ? "draft" : "published"
      );
      if (!res.ok) setError(res.error);
      else router.refresh();
    });

  const entry = useMemo(
    () => ({
      slug: piece.slug,
      title: meta.title,
      author_name: meta.author_name,
      class_year: meta.class_year,
      category: meta.category,
      verse: meta.verse,
      is_frontmatter: meta.is_frontmatter,
    }),
    [piece.slug, meta]
  );

  return (
    <div className={styles.shell}>
      <div className={styles.head}>
        <div style={{ minWidth: 0 }}>
          <h1 className={styles.headTitle}>{meta.title || "Untitled"}</h1>
          <span className={styles.headSub}>
            {issueTitle} · {meta.author_name || "no author yet"}
          </span>
        </div>

        <span className={styles.headSpacer} />

        <SaveBadge state={state} error={error} />

        <span
          className={`${ui.pill} ${piece.status === "published" ? ui.pillLive : ui.pillDraft}`}
        >
          {piece.status === "published" ? "live" : "draft"}
        </span>

        <button type="button" className={ui.btn} onClick={saveNow} disabled={state === "saving"}>
          Save now
        </button>
        <button
          type="button"
          className={`${ui.btn} ${piece.status === "published" ? "" : ui.btnPrimary}`}
          onClick={togglePublished}
          disabled={pending}
        >
          {piece.status === "published" ? "Back to draft" : "Publish piece"}
        </button>
        <Link href={`/admin/issues/${issueId}`} className={ui.btn}>
          Done
        </Link>
      </div>

      {error && (
        <p className={ui.error} style={{ margin: "12px 26px 0" }}>
          {error}
        </p>
      )}

      <div className={styles.split}>
        <div className={`${styles.pane} ${styles.paneLeft}`}>
          <div className={styles.metaCard}>
            <button
              type="button"
              className={styles.metaToggle}
              onClick={() => setMetaOpen((o) => !o)}
            >
              <span className={styles.blockKind}>About this piece</span>
              <span className={styles.metaSummary}>
                {[meta.author_name, meta.class_year, meta.category]
                  .filter(Boolean)
                  .join(" · ") || "no author or category yet"}
                {meta.is_frontmatter ? " · front matter" : ""}
                {verse ? " · poem" : ""}
              </span>
              <span className={styles.metaChevron}>{metaOpen ? "▾" : "▸"}</span>
            </button>

            {metaOpen && (
              <div className={styles.metaBody}>
                <PieceMetaFields value={meta} categories={categories} onChange={changeMeta} />

                <div className={styles.slugRow}>
                  <span className={styles.lockIcon}>🔒</span>
                  <span className={styles.slugValue}>{piece.slug}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11 }}>
                    permanent — it&rsquo;s in shared links and in this napkin&rsquo;s look
                  </span>
                </div>

                <div className={ui.btnRow} style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`}
                    onClick={() => setDeleting(true)}
                  >
                    Delete this piece
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.sectionHead}>
            <p className={styles.sectionTitle}>The piece</p>
            <span className={styles.sectionRule} />
          </div>

          <BlockList
            blocks={doc.blocks}
            onChange={changeDoc}
            verse={verse}
            issueNumber={issueNumber}
            slug={piece.slug}
          />
        </div>

        <div className={`${styles.pane} ${styles.paneRight}`}>
          <div className={styles.previewBar}>
            <span>Preview</span>
            <span style={{ flex: 1 }} />
            <span style={{ textTransform: "none", letterSpacing: 0 }}>
              exactly what a reader sees
            </span>
          </div>
          <div className={styles.previewStage}>
            <PiecePreview entry={entry} doc={doc} />
          </div>
        </div>
      </div>

      <ConfirmDelete
        open={deleting}
        name={piece.title}
        kind="piece"
        detail="This piece will be deleted permanently, along with its place on the playground. Student work is often only stored here — if you're not sure, set it back to draft instead."
        busy={pending}
        error={error}
        onCancel={() => setDeleting(false)}
        onConfirm={(typed) =>
          start(async () => {
            const res = await deletePiece(piece.id, typed);
            if (!res.ok) setError(res.error);
            else router.push(`/admin/issues/${issueId}`);
          })
        }
      />
    </div>
  );
}

function SaveBadge({ state, error }: { state: SaveState; error: string | null }) {
  const label =
    state === "saving"
      ? "Saving…"
      : state === "dirty"
        ? "Unsaved"
        : state === "saved"
          ? "Saved as draft"
          : state === "error"
            ? error ?? "Couldn't save"
            : "";
  const dot =
    state === "dirty"
      ? styles.saveDotDirty
      : state === "saved"
        ? styles.saveDotSaved
        : state === "error"
          ? styles.saveDotError
          : styles.saveDot;

  if (!label) return null;
  return (
    <span className={styles.saveState}>
      <span className={`${styles.saveDot} ${dot}`} />
      {label}
    </span>
  );
}
