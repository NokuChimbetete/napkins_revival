"use client";

import { useEffect, useState } from "react";
import type { AdminIssue } from "@/lib/admin/data";
import ui from "./ui.module.css";

/**
 * Publishing tells the editor exactly what is about to happen, because two of
 * the consequences are not obvious from the button:
 *
 *  · the issue takes first position on the bookshelf, pushing everything down
 *  · its pieces appear on the drawer immediately — there is no separate
 *    step for that, and no way to publish an issue while holding a piece back
 *    other than leaving that piece as a draft
 */
type Props = {
  issue: AdminIssue | null;
  highest: number;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (withDraftPieces: boolean) => void;
};

/** Mounted only while open, and keyed by issue, so the "also publish drafts"
 *  choice starts fresh for each issue rather than being reset by an effect. */
export function PublishDialog(props: Props) {
  return props.issue ? <Dialog key={props.issue.id} {...props} /> : null;
}

function Dialog({ issue, highest, busy, error, onCancel, onConfirm }: Props) {
  const [withPieces, setWithPieces] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!issue) return null;

  const drafts = issue.draft_piece_count ?? 0;
  const live = (issue.piece_count ?? 0) - drafts;
  const willBeFirst = issue.issue_number >= highest;
  const going = withPieces ? issue.piece_count ?? 0 : live;

  return (
    <div
      className={ui.scrim}
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={ui.modal} role="dialog" aria-modal="true">
        <div className={ui.modalScroll}>
          <h2 className={ui.modalTitle}>Publish “{issue.title}”?</h2>

          <div className={ui.modalBody}>
            <p style={{ margin: "0 0 10px" }}>
              {willBeFirst ? (
                <>
                  It goes to <strong>first position on the bookshelf</strong>, and every other issue
                  shifts one place right.
                </>
              ) : (
                <>
                  It sits at position {highest - issue.issue_number + 1} on the shelf — issue{" "}
                  {highest} is higher-numbered, so that one stays first.
                </>
              )}
            </p>
            <p style={{ margin: "0 0 10px" }}>
              {going > 0 ? (
                <>
                  {/* one expression, not text split across lines: JSX drops the
                      whitespace around a newline entirely, which silently glues
                      "pieces" to "become" */}
                  <strong>{going}</strong>
                  {`${going === 1 ? " piece becomes" : " pieces become"} readable, and any that aren’t front matter appear on the drawer straight away.`}
                </>
              ) : (
                <>The issue has no publishable pieces yet, so the shelf entry will open empty.</>
              )}
            </p>
            {!issue.cover_url && (
              <p className={ui.error} style={{ margin: "12px 0 0" }}>
                This issue has no cover yet. Add one first — the bookshelf has nothing to show
                without it.
              </p>
            )}
          </div>

          {drafts > 0 && (
            <label className={ui.checkRow} style={{ marginBottom: 18 }}>
              <input
                type="checkbox"
                checked={withPieces}
                onChange={(e) => setWithPieces(e.target.checked)}
              />
              <span className={ui.checkText}>
                Also publish the {drafts}{drafts === 1 ? " piece" : " pieces"} still marked draft
                <br />
                <span className={ui.hint}>
                  {live === 0
                    ? "Leave this off and the issue goes on the shelf empty — every piece in it is still a draft."
                    : `Leave this off to put the issue on the shelf with only the ${live} finished ${live === 1 ? "piece" : "pieces"}.`}
                </span>
              </span>
            </label>
          )}

          {error && <p className={ui.error}>{error}</p>}
        </div>

        <div className={ui.modalActions}>
          <button type="button" className={ui.btn} onClick={onCancel} disabled={busy}>
            Not yet
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            disabled={busy || !issue.cover_url}
            onClick={() => onConfirm(withPieces)}
          >
            {busy ? "Publishing…" : "Put it on the shelf"}
          </button>
        </div>
      </div>
    </div>
  );
}
