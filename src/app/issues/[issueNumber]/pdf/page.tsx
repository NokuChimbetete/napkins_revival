import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import { getIssues } from "@/lib/issues";
import { getIssueContent } from "@/lib/issue-content";
import { PdfSpreadViewer } from "@/components/reader/PdfSpreadViewer";

const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

type Params = { params: Promise<{ issueNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { issueNumber } = await params;
  const issue = (await getIssues()).find((i) => i.issue_number === Number(issueNumber));
  return { title: issue ? `${issue.title} (PDF) — Napkins` : "Napkins" };
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
