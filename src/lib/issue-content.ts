import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/configured";
import { optimizeBodyImages } from "@/lib/optimize-body-images";
import { sanitizeHtml } from "@/lib/sanitize-html";
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
  /** front matter (foreword, editor's note) — read in the issue, not on the drawer */
  is_frontmatter?: boolean;
  sort_order: number;
  /** explicit napkin pairing from the DB; when absent the playground derives
   *  both deterministically from the slug (hash % count) */
  napkin_variant?: number | null;
  font_preset?: number | null;
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
      // fixtures predate the flag; "Introduction" was the old magic string
      is_frontmatter: p.is_frontmatter ?? p.category === "Introduction",
      body_html: optimizeBodyImages(p.body_html ?? null),
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

/** Columns the reader needs. Listed explicitly so a `select *` can't quietly
 *  start shipping a future large column to every page. */
export const PIECE_COLUMNS =
  "slug, title, author_name, class_year, category, body, body_html, galleries, images, verse, is_frontmatter, sort_order, napkin_variant, font_preset";

/** One place that turns a `pieces` row into an Entry, so every query path —
 *  whole issue, single piece, napkin metadata — maps identically. */
export function rowToEntry(p: Record<string, unknown>, fallbackOrder = 0): Entry {
  return {
    // stored, never derived: the slug is baked into shared links and into the
    // napkin's paper/font/position (see 0003_playground.sql)
    slug: p.slug as string,
    title: p.title as string,
    author_name: (p.author_name as string) ?? "",
    class_year: (p.class_year as string) ?? "",
    category: (p.category as string) ?? null,
    body: (p.body as string) ?? null,
    // Two passes, in this order and only here.
    //
    // sanitizeHtml first: body_html is a regenerable cache, but it is still a
    // text column that gets injected with dangerouslySetInnerHTML, so it is
    // re-checked against an allowlist on the way out rather than trusted
    // because of who wrote it. This is the single choke point every read path
    // shares — reader, napkin modal, admin preview.
    //
    // Then the image optimizer, so artwork gets AVIF negotiation and
    // per-viewport sizing. Done in the data layer so it happens once,
    // server-side, and travels with the JSON the napkin modal fetches.
    body_html: optimizeBodyImages(sanitizeHtml((p.body_html as string) ?? null)),
    galleries: (p.galleries as string[][]) ?? [],
    images: (p.images as string[]) ?? [],
    verse: (p.verse as boolean) ?? false,
    is_frontmatter: (p.is_frontmatter as boolean) ?? false,
    sort_order: (p.sort_order as number) ?? fallbackOrder,
    // NULL means "derive from the slug" — a value is a deliberate override
    napkin_variant: (p.napkin_variant as number) ?? null,
    font_preset: (p.font_preset as number) ?? null,
  };
}

export async function getIssueContent(issueNumber: number): Promise<IssueContent | null> {
  if (supabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: issue } = await supabase
        .from("issues")
        .select("id, credits, page_images, pdf_url")
        .eq("issue_number", issueNumber)
        .eq("status", "published")
        .single();
      if (issue) {
        const { data: pieces } = await supabase
          .from("pieces")
          .select(PIECE_COLUMNS)
          .eq("issue_id", issue.id)
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        if (pieces?.length || (issue.page_images as string[])?.length) {
          return {
            issue_number: issueNumber,
            credits: issue.credits ?? null,
            pieces: (pieces ?? []).map((p, i) => rowToEntry(p, i)),
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
