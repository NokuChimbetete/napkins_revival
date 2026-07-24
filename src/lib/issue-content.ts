import { createClient } from "@/lib/supabase/server";
import issue1 from "@/lib/fixtures/issue-1.json";
import issue2 from "@/lib/fixtures/issue-2.json";
import issue3 from "@/lib/fixtures/issue-3.json";
import issue4 from "@/lib/fixtures/issue-4.json";
import issue5 from "@/lib/fixtures/issue-5.json";
import issue6 from "@/lib/fixtures/issue-6.json";
import issue7 from "@/lib/fixtures/issue-7.json";
import issue8 from "@/lib/fixtures/issue-8.json";

export type Entry = {
  slug: string;
  title: string;
  author_name: string;
  class_year: string;
  category: string | null;
  body: string | null;
  /** allowlisted HTML preserving the print layout: breaks, stanzas, alignment */
  body_html: string | null;
  /** slideshows, each rendered in place at its [[NAPKINSGAL n]] marker */
  galleries: string[][];
  images: string[];
  /** force verse treatment (no-wrap, wider measure) even when category isn't "poetry" */
  verse?: boolean;
  sort_order: number;
};

export type IssueContent = {
  issue_number: number;
  credits: string | null;
  pieces: Entry[];
  page_images: string[];
  pdf_download: string | null;
};

function normalize(fixture: unknown): IssueContent {
  const f = fixture as Partial<IssueContent> & { issue_number: number };
  return {
    issue_number: f.issue_number,
    credits: f.credits ?? null,
    pieces: (f.pieces ?? []).map((p) => ({
      ...p,
      images: p.images ?? [],
      galleries: p.galleries ?? [],
      verse: p.verse ?? false,
      body_html: p.body_html ?? null,
    })),
    page_images: f.page_images ?? [],
    pdf_download: f.pdf_download ?? null,
  };
}

// Ported issues live as local fixtures until Supabase is configured and seeded.
const FIXTURES: Record<number, IssueContent> = {
  1: normalize(issue1),
  2: normalize(issue2),
  3: normalize(issue3),
  4: normalize(issue4),
  5: normalize(issue5),
  6: normalize(issue6),
  7: normalize(issue7),
  8: normalize(issue8),
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-ref") && !key.startsWith("your-"));
}

export async function getIssueContent(issueNumber: number): Promise<IssueContent | null> {
  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: issue } = await supabase
        .from("issues")
        .select("id, credits, page_images, pdf_url")
        .eq("issue_number", issueNumber)
        .single();
      if (issue) {
        const { data: pieces } = await supabase
          .from("pieces")
          .select("*")
          .eq("issue_id", issue.id)
          .order("sort_order", { ascending: true });
        if (pieces?.length || (issue.page_images as string[])?.length) {
          return {
            issue_number: issueNumber,
            credits: issue.credits ?? null,
            pieces: (pieces ?? []).map((p, i) => ({
              slug: slugify(p.title),
              title: p.title,
              author_name: p.author_first_name,
              class_year: p.class_year,
              category: p.category ?? null,
              body: p.body ?? null,
              body_html: p.body_html ?? null,
              galleries: (p.galleries as string[][]) ?? [],
              images: (p.images as string[]) ?? [],
              sort_order: p.sort_order ?? i,
            })),
            page_images: (issue.page_images as string[]) ?? [],
            pdf_download: issue.pdf_url || null,
          };
        }
      }
    } catch {
      // fall through to fixtures
    }
  }
  return FIXTURES[issueNumber] ?? null;
}
