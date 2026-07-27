"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { PlaygroundPiece } from "@/lib/playground";
import { EntrySection } from "@/components/reader/EntrySection";
import styles from "./playground.module.css";

/**
 * The "other side" of a napkin: the full piece, rendered with the reader's
 * own EntrySection so every Phase-2 design rule (verse no-wrap, in-place
 * galleries, side-by-side rows) holds here automatically.
 *
 * Native <dialog> + showModal() supplies the focus trap, Escape handling and
 * backdrop for free; focus returns to the napkin that opened it on close.
 */
export function PieceModal({
  piece,
  onClose,
}: {
  piece: PlaygroundPiece | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (piece && !dialog.open) dialog.showModal();
    if (!piece && dialog.open) dialog.close();
  }, [piece]);

  // lock the page behind the modal; scroll position is untouched on close
  useEffect(() => {
    if (!piece) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [piece]);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-label={piece ? `${piece.entry.title} — full piece` : undefined}
      onCancel={(e) => {
        // Escape: route through onClose so URL + flip state stay in sync
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop click
      }}
    >
      {piece && (
        <div className={styles.modalInner}>
          <header className={styles.modalHead}>
            <span className={styles.modalIssue}>
              Issue {piece.issue_number} · {piece.season}
            </span>
            <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          {/* replicates the reader's .entries width context: 680px prose, 960px verse */}
          <div className={styles.entryHost}>
            <EntrySection entry={piece.entry} />
          </div>
          <footer className={styles.modalFoot}>
            <Link
              href={`/issues/${piece.issue_number}#${piece.entry.slug}`}
              className={styles.modalFootLink}
            >
              Read it in the {piece.season} issue →
            </Link>
          </footer>
        </div>
      )}
    </dialog>
  );
}
