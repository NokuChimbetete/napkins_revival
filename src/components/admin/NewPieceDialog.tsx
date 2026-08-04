"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPiece, type PieceMeta } from "@/lib/admin/actions";
import { pieceSlug } from "@/lib/admin/slug";
import { PieceMetaFields } from "./PieceMetaFields";
import ui from "./ui.module.css";

const BLANK: PieceMeta = {
  title: "",
  author_name: "",
  class_year: "",
  category: null,
  is_frontmatter: false,
  verse: false,
};

/**
 * A piece begins with who wrote it, not with a blank page.
 *
 * The slug is shown here, live, because this is the last moment it can change:
 * once the row exists, `pieces_freeze_slug()` rejects any update to it. Better
 * an editor sees the permanent web address while they can still fix the
 * spelling of a name than discovers it afterwards.
 */
type Props = {
  open: boolean;
  issueId: string;
  categories: string[];
  onClose: () => void;
};

/** Mounted only while open, so each "Add a piece" starts from a blank form
 *  without an effect having to clear the last one. */
export function NewPieceDialog(props: Props) {
  return props.open ? <Dialog {...props} /> : null;
}

function Dialog({ issueId, categories, onClose }: Props) {
  const router = useRouter();
  const [meta, setMeta] = useState<PieceMeta>(BLANK);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const slug = meta.title
    ? pieceSlug(meta.title, meta.author_name, meta.class_year)
    : "";

  function create() {
    start(async () => {
      setError(null);
      const res = await createPiece(issueId, meta);
      if (!res.ok) setError(res.error);
      else router.push(`/admin/issues/${issueId}/pieces/${res.id}`);
    });
  }

  return (
    <div className={ui.scrim} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={ui.modal} style={{ maxWidth: "38rem" }} role="dialog" aria-modal="true">
        <h2 className={ui.modalTitle}>Add a piece</h2>
        <p className={ui.modalBody} style={{ marginBottom: 22 }}>
          Who wrote it and what it is. The writing comes next.
        </p>

        <PieceMetaFields
          value={meta}
          categories={categories}
          onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
        />

        <div className={ui.notice} style={{ marginTop: 18 }}>
          <strong style={{ fontWeight: 500, color: "#1b1b1b" }}>Web address</strong>
          <br />
          <code style={{ fontSize: 12, color: slug ? "#4a4a45" : "#b9b2a4" }}>
            {slug || "…starts once there's a title"}
          </code>
          <br />
          Set once, when you create the piece, and permanent after that — it&rsquo;s baked into
          shared links and into how this piece&rsquo;s napkin looks. Fix any spelling now.
        </div>

        {error && (
          <p className={ui.error} style={{ marginTop: 14 }}>
            {error}
          </p>
        )}

        <div className={ui.modalActions} style={{ marginTop: 20 }}>
          <button type="button" className={ui.btn} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={create}
            disabled={pending || !meta.title.trim()}
          >
            {pending ? "Creating…" : "Create and start writing"}
          </button>
        </div>
      </div>
    </div>
  );
}
