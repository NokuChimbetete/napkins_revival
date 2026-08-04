import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Averia_Serif_Libre, Inter, Lora } from "next/font/google";
import { requireAdmin } from "@/lib/admin/session";
import { docFor, getIssue, listPieces } from "@/lib/admin/data";
import { renderDoc } from "@/lib/blocks/render";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { optimizeBodyImages } from "@/lib/optimize-body-images";
import type { Entry, IssueContent } from "@/lib/issue-content";
import { IssueReader } from "@/components/reader/IssueReader";
import { PreviewRibbon } from "@/components/admin/PreviewRibbon";

const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Preview — Napkins Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/**
 * The whole issue, exactly as it will read once published — drafts included.
 *
 * This renders `IssueReader`, the same component `/issues/[n]` renders, off the
 * same pipeline (`renderDoc` → `sanitizeHtml` → `optimizeBodyImages`) that
 * `rowToEntry()` puts published content through. The only difference from
 * production is that draft pieces are in it, which is the point.
 *
 * Deliberately not a public route: requireAdmin() runs first, so a link to this
 * page shows a stranger the sign-in screen rather than an unpublished issue.
 */
export default async function IssuePreviewPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const issue = await getIssue(id);
  if (!issue) notFound();
  const pieces = await listPieces(id);

  const entries: Entry[] = pieces.map((p, i) => ({
    slug: p.slug,
    title: p.title,
    author_name: p.author_name ?? "",
    class_year: p.class_year ?? "",
    category: p.category,
    body: null,
    body_html: optimizeBodyImages(sanitizeHtml(renderDoc(docFor(p)))),
    galleries: [],
    images: [],
    verse: (p as typeof p & { verse?: boolean }).verse ?? false,
    is_frontmatter: p.is_frontmatter,
    sort_order: p.sort_order ?? i,
  }));

  const content: IssueContent = {
    issue_number: issue.issue_number,
    credits: issue.credits,
    pieces: entries,
    page_images: issue.page_images,
    pdf_download: issue.pdf_url || null,
  };

  const drafts = pieces.filter((p) => p.status === "draft").length;

  return (
    <div className={`${averia.variable} ${inter.variable} ${lora.variable}`}>
      <PreviewRibbon
        issueId={issue.id}
        live={issue.status === "published"}
        drafts={drafts}
        total={pieces.length}
      />
      <IssueReader
        issue={{
          id: issue.id,
          issue_number: issue.issue_number,
          title: issue.title,
          cover_url: issue.cover_url || "/assets/cover-issue-1.png",
          pdf_url: issue.pdf_url ?? "",
          published_at: issue.published_at,
        }}
        content={content}
      />
    </div>
  );
}
