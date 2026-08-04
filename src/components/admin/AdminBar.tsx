import Link from "next/link";
import { signOut } from "@/app/admin/login/actions";
import styles from "@/app/admin/admin.module.css";

export type Crumb = { label: string; href?: string };

/** The one bar across the top of every admin page. Breadcrumbs rather than a
 *  sidebar: the whole admin is three levels deep (issues → issue → piece) and a
 *  sidebar would spend permanent screen width saying so. */
export function AdminBar({ crumbs, email }: { crumbs: Crumb[]; email: string }) {
  return (
    <header className={styles.bar}>
      <Link href="/admin" className={styles.barMark}>
        Napkins
      </Link>

      <nav className={styles.crumbs}>
        {crumbs.map((c, i) => (
          <span key={i} className={styles.crumbs}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? (
              <Link href={c.href} className={styles.crumbLink}>
                {c.label}
              </Link>
            ) : (
              <span className={styles.crumbHere}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <span className={styles.barSpacer} />

      <Link href="/" className={styles.viewSite} target="_blank">
        View site ↗
      </Link>
      <span className={styles.who}>{email}</span>
      <form action={signOut}>
        <button type="submit" className={styles.signOut}>
          Sign out
        </button>
      </form>
    </header>
  );
}
