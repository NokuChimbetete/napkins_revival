import Link from "next/link";

/**
 * A preview that looks exactly like the live site is one an editor can mistake
 * for the live site. This says which it is, and stays out of the reading
 * column while it does — fixed to the top-right, above the reader's own sticky
 * bar.
 */
export function PreviewRibbon({
  issueId,
  live,
  drafts,
  total,
}: {
  issueId: string;
  live: boolean;
  drafts: number;
  total: number;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(27, 27, 27, 0.9)",
        color: "#fff",
        fontFamily: "var(--font-geist-sans), Helvetica, Arial, sans-serif",
        fontSize: 12,
        boxShadow: "0 6px 20px -8px rgba(0,0,0,0.5)",
      }}
    >
      <strong style={{ fontWeight: 600, letterSpacing: 0.6 }}>PREVIEW</strong>
      <span style={{ color: "#c9c4b8" }}>
        {live ? "on the shelf" : "not published"}
        {drafts > 0 && ` · ${drafts} of ${total} pieces still draft`}
      </span>
      <Link href={`/admin/issues/${issueId}`} style={{ color: "#ffb185" }}>
        Back to editing
      </Link>
    </div>
  );
}
