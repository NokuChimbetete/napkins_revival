import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/admin/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { isDoc, emptyDoc, type Doc } from "@/lib/blocks/types";
import { canonicalize, parseHtml } from "@/lib/blocks/parse";

/**
 * Admin-side reads. Separate from src/lib/issues.ts and src/lib/issue-content.ts
 * on purpose: those are the *public* paths and filter drafts out, which is
 * exactly what the admin must not do.
 *
 * Every function here calls assertAdmin() first. Not because it is the security
 * boundary — RLS is — but so that a mistake shows up as an error at the call
 * site rather than as an empty list an editor reads as "my issue is gone".
 */

export type AdminIssue = {
  id: string;
  issue_number: number;
  title: string;
  cover_url: string;
  pdf_url: string | null;
  published_at: string | null;
  credits: string | null;
  status: "draft" | "published";
  page_images: string[];
  piece_count?: number;
  draft_piece_count?: number;
};

export type AdminPiece = {
  id: string;
  issue_id: string | null;
  slug: string;
  title: string;
  author_name: string;
  class_year: string;
  category: string | null;
  is_frontmatter: boolean;
  status: "draft" | "published";
  sort_order: number;
  body_html: string | null;
  doc: unknown;
};

export async function listIssues(): Promise<AdminIssue[]> {
  await assertAdmin();
  const supabase = await createClient();

  const [{ data: issues, error }, { data: pieces }] = await Promise.all([
    supabase.from("issues").select("*").order("issue_number", { ascending: false }),
    supabase.from("pieces").select("issue_id, status"),
  ]);
  if (error) throw error;

  const counts = new Map<string, { total: number; drafts: number }>();
  for (const p of pieces ?? []) {
    if (!p.issue_id) continue;
    const c = counts.get(p.issue_id) ?? { total: 0, drafts: 0 };
    c.total++;
    if (p.status === "draft") c.drafts++;
    counts.set(p.issue_id, c);
  }

  return (issues ?? []).map((i) => ({
    ...i,
    page_images: (i.page_images as string[]) ?? [],
    piece_count: counts.get(i.id)?.total ?? 0,
    draft_piece_count: counts.get(i.id)?.drafts ?? 0,
  }));
}

export async function getIssue(id: string): Promise<AdminIssue | null> {
  await assertAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("issues").select("*").eq("id", id).maybeSingle();
  return data ? { ...data, page_images: (data.page_images as string[]) ?? [] } : null;
}

export async function listPieces(issueId: string): Promise<AdminPiece[]> {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pieces")
    .select(
      "id, issue_id, slug, title, author_name, class_year, category, is_frontmatter, status, sort_order, body_html, doc"
    )
    .eq("issue_id", issueId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminPiece[];
}

export async function getPiece(id: string): Promise<AdminPiece | null> {
  await assertAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("pieces").select("*").eq("id", id).maybeSingle();
  return (data as AdminPiece) ?? null;
}

/**
 * The document to edit.
 *
 * `doc` is canonical, but a row seeded before the migration — or one whose doc
 * somehow gets lost — still has body_html, and parsing that back is a complete
 * recovery rather than an approximation (scripts/verify-blocks.mjs proves the
 * round-trip on all 117 archive pieces). This is the reason a bad render is
 * always recoverable.
 */
export function docFor(piece: Pick<AdminPiece, "doc" | "body_html">): Doc {
  if (isDoc(piece.doc)) return piece.doc;
  if (piece.body_html) return parseHtml(canonicalize(piece.body_html));
  return emptyDoc();
}

export async function listCategories(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("name, sort_order")
    .order("sort_order")
    .order("name");
  if (error || !data?.length) return [...DEFAULT_CATEGORIES];
  return data.map((c) => c.name as string);
}

/** Every slug in use, so a new piece can avoid colliding with one. Slugs are
 *  unique across all issues, not just within one. */
export async function takenSlugs(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("pieces").select("slug");
  return new Set((data ?? []).map((p) => p.slug as string));
}

/** The number a newly created issue should take: one past the highest that
 *  exists, drafts included, so two editors starting issues on the same evening
 *  don't both grab 9. */
export async function nextIssueNumber(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("issues")
    .select("issue_number")
    .order("issue_number", { ascending: false })
    .limit(1);
  return (data?.[0]?.issue_number ?? 0) + 1;
}
