import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Averia_Serif_Libre, Inter, Lora } from "next/font/google";
import { requireAdmin } from "@/lib/admin/session";
import { docFor, getIssue, getPiece, listCategories } from "@/lib/admin/data";
import { AdminBar } from "@/components/admin/AdminBar";
import { PieceBuilder } from "@/components/admin/builder/PieceBuilder";
import styles from "../../../../admin.module.css";

// The preview pane renders the real reader components, so it needs the real
// reader's fonts — otherwise "exactly what a reader sees" is a lie about the
// one thing an editor is most likely to be judging.
const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; pieceId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pieceId } = await params;
  const piece = await getPiece(pieceId).catch(() => null);
  return { title: piece ? `${piece.title} — Napkins Admin` : "Napkins Admin" };
}

export default async function BuilderPage({ params }: Props) {
  const user = await requireAdmin();
  const { id, pieceId } = await params;

  const [piece, issue, categories] = await Promise.all([
    getPiece(pieceId),
    getIssue(id),
    listCategories(),
  ]);
  if (!piece || !issue || piece.issue_id !== issue.id) notFound();

  return (
    <main className={`${styles.page} ${averia.variable} ${inter.variable} ${lora.variable}`}>
      <AdminBar
        crumbs={[
          { label: "Issues", href: "/admin" },
          { label: issue.title, href: `/admin/issues/${issue.id}` },
          { label: piece.title },
        ]}
        email={user.email}
      />
      <div className={`${styles.frame} ${styles.frameWide}`}>
        <PieceBuilder
          piece={piece}
          initialDoc={docFor(piece)}
          issueId={issue.id}
          issueNumber={issue.issue_number}
          issueTitle={issue.title}
          categories={categories}
        />
      </div>
    </main>
  );
}
