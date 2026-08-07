"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminIssue, AdminPiece } from "@/lib/admin/data";
import { deleteIssue, publishIssue, saveIssue, unpublishIssue } from "@/lib/admin/actions";
import { CoverDrop } from "./CoverDrop";
import { PieceList } from "./PieceList";
import { NewPieceDialog } from "./NewPieceDialog";
import { ConfirmDelete } from "./ConfirmDelete";
import { PublishDialog } from "./PublishDialog";
import ui from "./ui.module.css";
import styles from "./issues.module.css";

export function IssueEditor({
  issue,
  pieces,
  categories,
  highest,
}: {
  issue: AdminIssue;
  pieces: AdminPiece[];
  categories: string[];
  highest: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    issue_number: String(issue.issue_number),
    title: issue.title,
    cover_url: issue.cover_url ?? "",
    pdf_url: issue.pdf_url ?? "",
    published_at: issue.published_at ?? "",
    credits: issue.credits ?? "",
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPiece, setNewPiece] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
    setSaved(false);
  };

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveIssue({
        id: issue.id,
        issue_number: Number(form.issue_number),
        title: form.title,
        cover_url: form.cover_url,
        pdf_url: form.pdf_url || null,
        published_at: form.published_at || null,
        credits: form.credits || null,
      });
      if (!res.ok) setError(res.error);
      else {
        setDirty(false);
        setSaved(true);
        router.refresh();
      }
    });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        after?.();
        router.refresh();
      }
    });

  const live = issue.status === "published";

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <p className={ui.eyebrow}>Issue {issue.issue_number}</p>
          <h1 className={ui.h1}>{form.title || `Issue ${issue.issue_number}`}</h1>
        </div>
        <div className={ui.btnRow}>
          <span className={`${ui.pill} ${live ? ui.pillLive : ui.pillDraft}`}>
            {live ? "on the shelf" : "draft"}
          </span>
          <Link
            href={`/admin/issues/${issue.id}/preview`}
            className={ui.btn}
            target="_blank"
          >
            Preview issue ↗
          </Link>
          {live ? (
            <button
              type="button"
              className={ui.btn}
              disabled={pending}
              onClick={() => run(() => unpublishIssue(issue.id))}
            >
              Take off shelf
            </button>
          ) : (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnPrimary}`}
              disabled={pending}
              onClick={() => setPublishing(true)}
            >
              Publish
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className={ui.error} style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}

      <div className={styles.editorGrid}>
        <div className={ui.stack}>
          <section className={ui.card}>
            <div className={ui.cardHead}>
              <h2 className={ui.h2}>The issue</h2>
              <span className={dirty ? ui.saving : saved ? ui.saved : ui.hint}>
                {pending ? "Saving…" : dirty ? "Unsaved changes" : saved ? "Saved" : ""}
              </span>
            </div>

            <div className={ui.stack}>
              <div className={ui.grid2}>
                <label className={ui.field}>
                  <span className={ui.label}>Title</span>
                  <input
                    className={ui.input}
                    value={form.title}
                    placeholder="Spring 2026"
                    onChange={(e) => set({ title: e.target.value })}
                  />
                  <span className={ui.hint}>Shown under the cover on the shelf.</span>
                </label>

                <label className={ui.field}>
                  <span className={ui.label}>Issue number</span>
                  <input
                    className={ui.input}
                    type="number"
                    min={1}
                    value={form.issue_number}
                    onChange={(e) => set({ issue_number: e.target.value })}
                  />
                  <span className={ui.hint}>
                    {Number(form.issue_number) >= highest
                      ? "Highest number, so it takes first place on the shelf."
                      : `Below issue ${highest}, so it won't be first on the shelf.`}
                  </span>
                </label>
              </div>

              <div className={ui.grid2}>
                <label className={ui.field}>
                  <span className={ui.label}>
                    Published date <span className={ui.optional}>· optional</span>
                  </span>
                  <input
                    className={ui.input}
                    type="date"
                    value={form.published_at}
                    onChange={(e) => set({ published_at: e.target.value })}
                  />
                </label>

                <label className={ui.field}>
                  <span className={ui.label}>
                    PDF link <span className={ui.optional}>· optional</span>
                  </span>
                  <input
                    className={`${ui.input} ${ui.inputMono}`}
                    value={form.pdf_url}
                    placeholder="https://…"
                    onChange={(e) => set({ pdf_url: e.target.value })}
                  />
                  <span className={ui.hint}>Adds a “Read as PDF” link to the reader.</span>
                </label>
              </div>

              <label className={ui.field}>
                <span className={ui.label}>
                  Credits <span className={ui.optional}>· optional</span>
                </span>
                <textarea
                  className={ui.textarea}
                  value={form.credits}
                  rows={4}
                  placeholder={"Editors-in-chief\nAda Lovelace, Grace Hopper"}
                  onChange={(e) => set({ credits: e.target.value })}
                />
                <span className={ui.hint}>
                  Appears at the end of the issue. Line breaks are kept as you type them.
                </span>
              </label>

              <div className={ui.btnRow}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  onClick={save}
                  disabled={pending || !dirty}
                >
                  Save issue
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnDanger}`}
                  onClick={() => setDeleting(true)}
                  disabled={pending}
                >
                  Delete issue
                </button>
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHead}>
              <h2 className={ui.h2}>
                Pieces <span className={ui.hint}>· {pieces.length}</span>
              </h2>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`}
                onClick={() => setNewPiece(true)}
              >
                + Add a piece
              </button>
            </div>

            {pieces.length === 0 ? (
              <p className={ui.empty}>
                No pieces yet. Add the foreword first — the order here is the order they&rsquo;re
                read in.
              </p>
            ) : (
              <PieceList issueId={issue.id} pieces={pieces} />
            )}
          </section>
        </div>

        <aside className={styles.sticky}>
          <section className={ui.card}>
            <div className={ui.cardHead}>
              <h2 className={ui.h2}>Cover</h2>
            </div>
            <CoverDrop
              issueNumber={Number(form.issue_number) || issue.issue_number}
              value={form.cover_url}
              onChange={(url) => set({ cover_url: url })}
            />
            <p className={ui.hint} style={{ marginTop: 12 }}>
              Portrait works best — the shelf crops to roughly 3:4. Save the issue after replacing
              it.
            </p>
          </section>

          <p className={ui.notice}>
            Pieces appear on the drawer automatically once they and this issue are published.
            There is no separate step for the drawer.
          </p>
        </aside>
      </div>

      <NewPieceDialog
        open={newPiece}
        issueId={issue.id}
        categories={categories}
        onClose={() => setNewPiece(false)}
      />

      <PublishDialog
        issue={publishing ? { ...issue, ...countsOf(pieces) } : null}
        highest={highest}
        busy={pending}
        error={error}
        onCancel={() => setPublishing(false)}
        onConfirm={(withPieces) =>
          run(() => publishIssue(issue.id, { pieces: withPieces }), () => setPublishing(false))
        }
      />

      <ConfirmDelete
        open={deleting}
        name={issue.title}
        kind="issue"
        detail={`Issue ${issue.issue_number} and all ${pieces.length} of its pieces will be deleted permanently. Student work is often only stored here — if you are not certain, take it off the shelf instead.`}
        busy={pending}
        error={error}
        onCancel={() => setDeleting(false)}
        onConfirm={(typed) =>
          run(() => deleteIssue(issue.id, typed), () => router.push("/admin"))
        }
      />
    </>
  );
}

const countsOf = (pieces: AdminPiece[]) => ({
  piece_count: pieces.length,
  draft_piece_count: pieces.filter((p) => p.status === "draft").length,
});
