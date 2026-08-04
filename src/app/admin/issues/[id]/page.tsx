import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import { getIssue, listCategories, listIssues, listPieces } from "@/lib/admin/data";
import { AdminBar } from "@/components/admin/AdminBar";
import { IssueEditor } from "@/components/admin/IssueEditor";
import styles from "../../admin.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssue(id).catch(() => null);
  return { title: issue ? `${issue.title} — Napkins Admin` : "Napkins Admin" };
}

export default async function IssuePage({ params }: Props) {
  const user = await requireAdmin();
  const { id } = await params;

  const issue = await getIssue(id);
  if (!issue) notFound();

  const [pieces, categories, all] = await Promise.all([
    listPieces(id),
    listCategories(),
    listIssues(),
  ]);
  const highest = Math.max(0, ...all.map((i) => i.issue_number));

  return (
    <main className={styles.page}>
      <AdminBar
        crumbs={[{ label: "Issues", href: "/admin" }, { label: issue.title }]}
        email={user.email}
      />
      <div className={styles.frame}>
        <IssueEditor issue={issue} pieces={pieces} categories={categories} highest={highest} />
      </div>
    </main>
  );
}
