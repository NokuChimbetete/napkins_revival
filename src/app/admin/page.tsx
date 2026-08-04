import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { listIssues } from "@/lib/admin/data";
import { AdminBar } from "@/components/admin/AdminBar";
import { IssueList } from "@/components/admin/IssueList";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Issues — Napkins Admin" };

// Always current: an editor who just published needs to see it, and a cached
// list of issues is a list that lies about what is on the shelf.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();
  const issues = await listIssues();

  return (
    <main className={styles.page}>
      <AdminBar crumbs={[{ label: "Issues" }]} email={user.email} />
      <div className={styles.frame}>
        <IssueList issues={issues} />
      </div>
    </main>
  );
}
