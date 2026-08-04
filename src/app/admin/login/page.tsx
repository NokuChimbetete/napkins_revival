import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/session";
import { LoginForm } from "./LoginForm";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Sign in — Napkins Admin" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  // already signed in and allowed? go where they were headed
  if (await getAdminUser()) redirect(safeNext(next));

  return (
    <main className={styles.page}>
      <div className={styles.signInPage}>
        <div className={styles.signInCard}>
          <span className={styles.mark}>Napkins Admin</span>
          <h1 className={styles.signInTitle}>Sign in to publish.</h1>
          <p className={styles.signInBody}>
            Use the Google account that matches your Minerva email.
          </p>

          {error && <p className={styles.signInError}>{ERRORS[error] ?? ERRORS.default}</p>}

          <LoginForm next={safeNext(next)} />

          <p className={styles.signInFoot}>
            Only green listed editors will be granted access
            <br />
            <Link href="/" style={{ color: "#0071ad" }}>
              ← Back to the shelf
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const ERRORS: Record<string, string> = {
  not_admin:
    "That account isn’t on the editors list, so we signed you back out. If you have more than one Google account, check you picked your Minerva one — otherwise ask another editor to add you to admin_whitelist in Supabase.",
  expired: "That sign-in had already been used, or it expired. Try again.",
  cancelled: "No problem — nothing was signed in. Press the button again whenever you’re ready.",
  provider:
    "Google turned that sign-in down. Try again — if it keeps happening, check Authentication → Providers in the Supabase dashboard.",
  default: "Something went wrong signing you in. Try again.",
};

/** Only ever redirect within our own admin. An open redirect on a sign-in page
 *  is how a phishing link gets to look like it came from us. */
function safeNext(next: string | undefined): string {
  return next && /^\/admin(?:\/|$)/.test(next) && !next.startsWith("/admin/login")
    ? next
    : "/admin";
}
