import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Averia_Serif_Libre, Inter, Lora } from "next/font/google";
import { getIssues } from "@/lib/issues";
import { getIssueContent } from "@/lib/issue-content";
import { IssueReader } from "@/components/reader/IssueReader";

const averia = Averia_Serif_Libre({ variable: "--font-averia", subsets: ["latin"], weight: "400" });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

type Params = { params: Promise<{ issueNumber: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { issueNumber } = await params;
  const issue = (await getIssues()).find((i) => i.issue_number === Number(issueNumber));
  return { title: issue ? `${issue.title} — Napkins` : "Napkins" };
}

export default async function IssuePage({ params }: Params) {
  const { issueNumber } = await params;
  const n = Number(issueNumber);
  if (!Number.isInteger(n)) notFound();

  const issue = (await getIssues()).find((i) => i.issue_number === n);
  if (!issue) notFound();

  const content = await getIssueContent(n);

  // PDF-only issues go straight to the spread viewer
  if (content && content.pieces.length === 0 && content.page_images.length > 0) {
    redirect(`/issues/${n}/pdf`);
  }

  if (!content || content.pieces.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white p-8 text-center">
        <h1 className="text-2xl" style={{ color: "#0071ad" }}>
          {issue.title}
        </h1>
        <p className="text-neutral-500">
          This issue hasn&rsquo;t been digitized yet — check back soon.
        </p>
      </main>
    );
  }

  return (
    <div className={`${averia.variable} ${inter.variable} ${lora.variable}`}>
      <IssueReader issue={issue} content={content} />
    </div>
  );
}
