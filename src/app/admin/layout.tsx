import type { Metadata } from "next";
import Link from "next/link";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin — Napkins",
  robots: { index: false, follow: false },
};

/**
 * The admin is desktop-only by decision, not by omission. Editors add, edit and
 * delete issues from a computer, never a phone, so these routes refuse narrow
 * screens rather than trying to squeeze a layout editor onto one.
 *
 * The gate lives here so every /admin/* route inherits it, and it is a media
 * query rather than a user-agent sniff or a useEffect width test: both of those
 * render the editor on the server and tear it down in the browser, which on a
 * phone means a flash of a dashboard the visitor is about to be told they can't
 * use. One switch, in admin.module.css, that the server and the browser agree
 * on.
 *
 * Note this layout does NOT check auth. A layout doesn't re-render on client
 * navigation, so an auth check here would go stale; every page and every action
 * calls requireAdmin()/assertAdmin() itself. See src/lib/admin/session.ts.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={styles.desk}>{children}</div>

      <section className={styles.gate}>
        <span className={styles.mark}>Napkins Admin</span>
        <h1 className={styles.title}>This one needs a bigger screen.</h1>
        <p className={styles.body}>
          Phones are for doom scrolling, not for editing zines you silly goose.
          Admin panel only works on desktop with a full-sized browser window.
        </p>
        <Link href="/" className={styles.back}>
          ← Back to the shelf
        </Link>
      </section>
    </>
  );
}
