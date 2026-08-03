import type { Metadata } from "next";
import Link from "next/link";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin — Napkins",
};

/**
 * PHASE 4 — READ THIS BEFORE BUILDING THE DASHBOARD.
 *
 * The admin editor is desktop-only by decision, not by omission. Editors add,
 * edit and delete issues from a computer, never a phone, so this route refuses
 * narrow screens rather than trying to squeeze a layout editor onto one.
 *
 * Build the dashboard inside <section className={styles.desk}> and it inherits
 * the gate for free — the single 900px switch lives in admin.module.css.
 *
 * Don't reach for a user-agent check or a useEffect width test to do this. Both
 * render the editor on the server and tear it down in the browser, which on a
 * phone means a flash of a dashboard the visitor is about to be told they can't
 * use. The media query keeps server and client agreeing on one answer.
 */
export default function AdminPage() {
  return (
    <main className={styles.page}>
      <section className={styles.desk}>
        <p className={styles.stub}>Upload dashboard — arrives in Phase 4.</p>
      </section>

      <section className={styles.gate}>
        <span className={styles.mark}>Napkins Admin</span>
        <h1 className={styles.title}>This one needs a bigger desk.</h1>
        <p className={styles.body}>
          Issues get added, edited and deleted from a computer. Laying out an
          issue on a phone was never going to be pleasant, so we didn&rsquo;t
          pretend otherwise — open this page again on a desktop and everything
          will be here.
        </p>
        <Link href="/" className={styles.back}>
          ← Back to the shelf
        </Link>
      </section>
    </main>
  );
}
