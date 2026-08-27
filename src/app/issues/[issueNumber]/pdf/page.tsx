import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { getIssues } from "@/lib/issues";
import { SITE_NAME } from "@/lib/site";
import { getIssueContent } from "@/lib/issue-content";
import { PdfSpreadViewer } from "@/components/reader/PdfSpreadViewer";

const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

type Params = { params: Promise<{ issueNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { issueNumber } = await params;
  const issue = (await getIssues()).find((i) => i.issue_number === Number(issueNumber));
  if (!issue) return { title: "Napkins" };

  return {
    title: `${issue.title} (PDF) — Napkins`,
    description: `Read ${issue.title}, issue ${issue.issue_number} of Napkins, as facing pages.`,
    alternates: { canonical: `/issues/${issue.issue_number}/pdf` },
    openGraph: {
      // Naming images here stops Next injecting the site-wide card for this
      // route — it only falls through when a segment leaves openGraph.images
      // unset — which is the point: an issue should share as its own cover.
      // openGraph replaces rather than merges, so siteName and locale have to
      // be restated or they are lost.
      siteName: SITE_NAME,
      type: "article",
      locale: "en_US",
      images: [{ url: issue.cover_url, alt: `Cover of ${issue.title}` }],
    },
    // Every cover is portrait (roughly 1:1.4). A summary_large_image card
    // would crop a horizontal band out of the middle of one and show nothing
    // recognisable, so issues use the square card, which shows the whole cover.
    twitter: { card: "summary" },
  };
}

export default async function IssuePdfPage({ params }: Params) {
  const { issueNumber } = await params;
  const n = Number(issueNumber);
  if (!Number.isInteger(n)) notFound();

  const issue = (await getIssues()).find((i) => i.issue_number === n);
  if (!issue) notFound();

  const content = await getIssueContent(n);
  if (!content || content.page_images.length === 0) {
    // no rendered pages: fall back to the web reader (or its "not digitized" state)
    redirect(`/issues/${n}`);
  }

  return (
    <div className={`${averia.variable} ${inter.variable}`}>
      <PdfSpreadViewer
        pages={content.page_images}
        issueNumber={n}
        issueTitle={issue.title}
        pdfHref={content.pdf_download}
        hasWeb={content.pieces.length > 0}
      />
    </div>
  );
}
