"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createIssue, deleteIssue, publishIssue, unpublishIssue } from "@/lib/admin/actions";
import type { AdminIssue } from "@/lib/admin/data";
import { ConfirmDelete } from "./ConfirmDelete";
import { PublishDialog } from "./PublishDialog";
import ui from "./ui.module.css";
import styles from "./issues.module.css";

export function IssueList({ issues }: { issues: AdminIssue[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, setDeleting] = useState<AdminIssue | null>(null);
  const [publishing, setPublishing] = useState<AdminIssue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const highest = Math.max(0, ...issues.map((i) => i.issue_number));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done?: () => void) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        done?.();
        router.refresh();
      }
    });

  return (
    <>
      <div className={ui.pageHead}>
        <div>
          <p className={ui.eyebrow}>Napkins</p>
          <h1 className={ui.h1}>Issues</h1>
        </div>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary}`}
          disabled={pending}
          onClick={() => start(() => createIssue())}
        >
          + Start issue {highest + 1}
        </button>
      </div>

      {error && (
        <p className={ui.error} style={{ marginBottom: 18 }}>
          {error}
        </p>
      )}

      {issues.length === 0 ? (
        <p className={ui.empty}>
          No issues yet. Start one and it&rsquo;ll appear here as a draft until you publish it.
        </p>
      ) : (
        <ul className={styles.list}>
          {issues.map((issue) => (
            <li key={issue.id} className={styles.row}>
              <Link href={`/admin/issues/${issue.id}`} className={styles.coverLink}>
                {issue.cover_url ? (
                  /* a plain <img>, not next/image: covers are arbitrary Storage
                     URLs on a page four people load, and the optimizer would
                     answer 400 on a cover that hasn't finished uploading */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={issue.cover_url} alt="" className={styles.cover} />
                ) : (
                  <span className={styles.coverEmpty}>no cover</span>
                )}
              </Link>

              <div className={styles.meta}>
                <div className={styles.titleRow}>
                  <Link href={`/admin/issues/${issue.id}`} className={styles.title}>
                    {issue.title || `Issue ${issue.issue_number}`}
                  </Link>
                  <span
                    className={`${ui.pill} ${issue.status === "published" ? ui.pillLive : ui.pillDraft}`}
                  >
                    {issue.status === "published" ? "on the shelf" : "draft"}
                  </span>
                  {issue.status === "published" && issue.issue_number === highest && (
                    <span className={styles.newest}>first on the shelf</span>
                  )}
                </div>
                <p className={styles.sub}>
                  Issue {issue.issue_number}
                  {" · "}
                  {issue.piece_count} {issue.piece_count === 1 ? "piece" : "pieces"}
                  {issue.draft_piece_count ? ` (${issue.draft_piece_count} still draft)` : ""}
                  {issue.published_at ? ` · ${issue.published_at}` : ""}
                </p>
              </div>

              <div className={styles.actions}>
                {issue.status === "published" && (
                  <Link
                    href={`/issues/${issue.issue_number}`}
                    target="_blank"
                    className={`${ui.btn} ${ui.btnSmall} ${ui.btnGhost}`}
                  >
                    View ↗
                  </Link>
                )}
                <Link href={`/admin/issues/${issue.id}`} className={`${ui.btn} ${ui.btnSmall}`}>
                  Edit
                </Link>
                {issue.status === "published" ? (
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnSmall}`}
                    disabled={pending}
                    onClick={() => run(() => unpublishIssue(issue.id))}
                  >
                    Take off shelf
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`}
                    disabled={pending}
                    onClick={() => setPublishing(issue)}
                  >
                    Publish
                  </button>
                )}
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`}
                  disabled={pending}
                  onClick={() => setDeleting(issue)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PublishDialog
        issue={publishing}
        highest={highest}
        busy={pending}
        error={error}
        onCancel={() => setPublishing(null)}
        onConfirm={(withPieces) =>
          publishing &&
          run(() => publishIssue(publishing.id, { pieces: withPieces }), () => setPublishing(null))
        }
      />

      <ConfirmDelete
        open={!!deleting}
        name={deleting?.title ?? ""}
        kind="issue"
        detail={
          deleting
            ? `Issue ${deleting.issue_number} and all ${deleting.piece_count} of its pieces will be deleted permanently. Student work is often only stored here — if you are not certain, take it off the shelf instead.`
            : undefined
        }
        busy={pending}
        error={error}
        onCancel={() => setDeleting(null)}
        onConfirm={(typed) =>
          deleting && run(() => deleteIssue(deleting.id, typed), () => setDeleting(null))
        }
      />
    </>
  );
}
