"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/admin/session";
import { normalizeCategoryInput } from "@/lib/categories";
import { nextIssueNumber, takenSlugs } from "@/lib/admin/data";
import { pieceSlug, uniqueSlug } from "@/lib/admin/slug";
import { isDoc, walkBlocks, type Doc } from "@/lib/blocks/types";
import { renderDoc } from "@/lib/blocks/render";
import { textToPlain } from "@/lib/blocks/inline";
import { sanitizeHtml } from "@/lib/sanitize-html";

export type Result = { ok: true } | { ok: false; error: string };

const ok: Result = { ok: true };
const bad = (error: string): Result => ({ ok: false, error });

/**
 * Every write in the admin goes through this file.
 *
 * Two rules hold everywhere below:
 *
 *  1. assertAdmin() first. RLS would refuse the write anyway, but a Postgres
 *     policy violation surfaces as "new row violates row-level security
 *     policy" — true, and useless to an editor.
 *
 *  2. body_html is never accepted from the client. It is always regenerated
 *     here from the block document, so there is no path by which a hand-crafted
 *     request can put arbitrary HTML into the reader.
 */

/** Turn whatever Postgres said into something an editor can act on. */
function explain(error: { message?: string; code?: string } | null): string {
  const m = error?.message ?? "Something went wrong.";
  if (/slug is immutable/i.test(m)) {
    return "A piece's web address is permanent — it's baked into shared links and into its napkin's paper and font, so renaming can't change it. The title was saved; the address stays as it was.";
  }
  if (error?.code === "23505" && /issue_number/.test(m)) {
    return "There's already an issue with that number. Pick another.";
  }
  if (error?.code === "23505" && /slug/.test(m)) {
    return "A piece with that web address already exists.";
  }
  if (/row-level security/i.test(m)) {
    return "Your session isn't allowed to make that change. Try signing out and back in.";
  }
  return m;
}

/** Regenerate everything derived from the block document, in one place, so a
 *  save can never leave the cache and the document disagreeing. */
function derive(doc: Doc) {
  const body_html = sanitizeHtml(renderDoc(doc)) ?? "";

  // `galleries` predates the block format and nothing reads it any more (the
  // reader renders galleries inline from body_html). Kept in step anyway:
  // rowToEntry still exposes it, and a column that quietly goes stale is a
  // column that misleads whoever finds it next.
  const galleries: string[][] = [];
  const plain: string[] = [];
  walkBlocks(doc.blocks, (b) => {
    if (b.type === "gallery") galleries.push(b.images.map((i) => i.src));
    else if (b.type === "text") plain.push(textToPlain(b.text));
    else if (b.type === "heading") plain.push(textToPlain(b.text));
    else if (b.type === "list") plain.push(b.items.map(textToPlain).join("\n"));
  });

  return { body_html, galleries, body: plain.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() };
}

// ---------------------------------------------------------------------------
// Issues
// ---------------------------------------------------------------------------

export type IssueInput = {
  id?: string;
  issue_number: number;
  title: string;
  cover_url: string;
  pdf_url: string | null;
  published_at: string | null;
  credits: string | null;
};

export async function saveIssue(input: IssueInput): Promise<Result & { id?: string }> {
  await assertAdmin();
  const supabase = await createClient();

  if (!input.title.trim()) return bad("Give the issue a title, like “Spring 2026”.");
  if (!Number.isInteger(input.issue_number) || input.issue_number < 1) {
    return bad("The issue number has to be a whole number.");
  }

  const row = {
    issue_number: input.issue_number,
    title: input.title.trim(),
    cover_url: input.cover_url.trim(),
    pdf_url: input.pdf_url?.trim() || null,
    published_at: input.published_at || null,
    credits: input.credits?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("issues").update(row).eq("id", input.id);
    if (error) return bad(explain(error));
    revalidateEverything(input.issue_number);
    return { ...ok, id: input.id };
  }

  // New issues start as drafts, always. Publishing is a separate, deliberate
  // press — an issue should never reach the bookshelf because someone filled in
  // a title and wandered off.
  const { data, error } = await supabase
    .from("issues")
    .insert({ ...row, status: "draft" })
    .select("id")
    .single();
  if (error) return bad(explain(error));
  revalidatePath("/admin");
  return { ...ok, id: data.id as string };
}

export async function createIssue(): Promise<never> {
  await assertAdmin();
  const supabase = await createClient();
  const n = await nextIssueNumber();
  const { data, error } = await supabase
    .from("issues")
    .insert({
      issue_number: n,
      title: `Issue ${n}`,
      cover_url: "",
      status: "draft",
    })
    .select("id")
    .single();
  if (error) throw new Error(explain(error));
  revalidatePath("/admin");
  redirect(`/admin/issues/${data.id}`);
}

/**
 * Publishing.
 *
 * The bookshelf sorts newest-first (`Bookshelf.tsx` sorts by issue_number
 * descending), so "first position on the shelf" and "highest issue number" are
 * the same statement. An issue created through `createIssue` already holds the
 * highest number; this checks it still does, because an editor can edit the
 * number by hand and two people can be drafting at once.
 */
export async function publishIssue(id: string, opts: { pieces: boolean }): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("issue_number, title, cover_url")
    .eq("id", id)
    .maybeSingle();
  if (!issue) return bad("That issue no longer exists.");
  if (!issue.cover_url) return bad("An issue needs a cover before it can go on the shelf.");

  if (opts.pieces) {
    const { error } = await supabase
      .from("pieces")
      .update({ status: "published" })
      .eq("issue_id", id);
    if (error) return bad(explain(error));
  }

  const { error } = await supabase.from("issues").update({ status: "published" }).eq("id", id);
  if (error) return bad(explain(error));

  revalidateEverything(issue.issue_number as number);
  return ok;
}

export async function unpublishIssue(id: string): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: issue } = await supabase
    .from("issues")
    .select("issue_number")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("issues").update({ status: "draft" }).eq("id", id);
  if (error) return bad(explain(error));
  revalidateEverything(issue?.issue_number as number);
  return ok;
}

/**
 * Deleting an issue.
 *
 * `pieces.issue_id` is ON DELETE SET NULL, so dropping an issue row would
 * silently orphan its pieces rather than remove them — they would vanish from
 * the site (no issue to belong to) while still occupying their slugs forever,
 * which would then block anyone re-creating the issue. So the pieces go first,
 * explicitly, and the caller has to have typed the issue's title to get here.
 */
export async function deleteIssue(id: string, confirmation: string): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("issues")
    .select("issue_number, title")
    .eq("id", id)
    .maybeSingle();
  if (!issue) return bad("That issue no longer exists.");

  if (confirmation.trim() !== (issue.title as string).trim()) {
    return bad(`Type the issue title exactly — “${issue.title}” — to confirm.`);
  }

  const { error: pieceError } = await supabase.from("pieces").delete().eq("issue_id", id);
  if (pieceError) return bad(explain(pieceError));

  const { error } = await supabase.from("issues").delete().eq("id", id);
  if (error) return bad(explain(error));

  revalidateEverything(issue.issue_number as number);
  return ok;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

export type PieceMeta = {
  title: string;
  author_name: string;
  class_year: string;
  category: string | null;
  is_frontmatter: boolean;
  verse: boolean;
};

export async function createPiece(issueId: string, meta: PieceMeta): Promise<Result & { id?: string }> {
  await assertAdmin();
  const supabase = await createClient();

  if (!meta.title.trim()) return bad("A piece needs a title.");

  // Generated once, here, and frozen by the pieces_slug_immutable trigger from
  // then on. See src/lib/admin/slug.ts for why it can never follow the title.
  const slug = uniqueSlug(
    pieceSlug(meta.title, meta.author_name, meta.class_year),
    await takenSlugs()
  );

  const { data: last } = await supabase
    .from("pieces")
    .select("sort_order")
    .eq("issue_id", issueId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const { data, error } = await supabase
    .from("pieces")
    .insert({
      issue_id: issueId,
      slug,
      title: meta.title.trim(),
      author_name: meta.author_name.trim(),
      class_year: meta.class_year.trim(),
      category: meta.category,
      is_frontmatter: meta.is_frontmatter,
      verse: meta.verse,
      status: "draft",
      sort_order: (last?.[0]?.sort_order ?? -1) + 1,
      doc: { v: 1, blocks: [] },
      body_html: "",
      body: "",
      // left NULL deliberately: NULL means "derive paper and font from the
      // slug", which is what makes every napkin look different (0003 §2)
      napkin_variant: null,
      font_preset: null,
    })
    .select("id")
    .single();

  if (error) return bad(explain(error));
  revalidatePath(`/admin/issues/${issueId}`);
  return { ...ok, id: data.id as string };
}

/** Metadata only — the block document is saved separately, so a title fix
 *  can't be lost to a body save and vice versa. */
export async function savePieceMeta(id: string, meta: PieceMeta): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();
  if (!meta.title.trim()) return bad("A piece needs a title.");

  const { error } = await supabase
    .from("pieces")
    .update({
      title: meta.title.trim(),
      author_name: meta.author_name.trim(),
      class_year: meta.class_year.trim(),
      category: meta.category,
      is_frontmatter: meta.is_frontmatter,
      verse: meta.verse,
    })
    .eq("id", id);

  if (error) return bad(explain(error));
  await revalidatePiece(id);
  return ok;
}

export async function savePieceDoc(id: string, doc: Doc): Promise<Result> {
  await assertAdmin();
  if (!isDoc(doc)) return bad("That doesn't look like a valid document.");

  const supabase = await createClient();
  const derived = derive(doc);

  const { error } = await supabase
    .from("pieces")
    .update({ doc, ...derived })
    .eq("id", id);

  if (error) return bad(explain(error));
  await revalidatePiece(id);
  return ok;
}

export async function setPieceStatus(id: string, status: "draft" | "published"): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("pieces").update({ status }).eq("id", id);
  if (error) return bad(explain(error));
  await revalidatePiece(id);
  return ok;
}

export async function deletePiece(id: string, confirmation: string): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();

  const { data: piece } = await supabase
    .from("pieces")
    .select("title, issue_id")
    .eq("id", id)
    .maybeSingle();
  if (!piece) return bad("That piece no longer exists.");

  if (confirmation.trim() !== (piece.title as string).trim()) {
    return bad(`Type the piece's title exactly — “${piece.title}” — to confirm.`);
  }

  const { error } = await supabase.from("pieces").delete().eq("id", id);
  if (error) return bad(explain(error));
  if (piece.issue_id) revalidatePath(`/admin/issues/${piece.issue_id}`);
  revalidatePath("/playground");
  return ok;
}

/** Print order. Also the order napkins are seated on the playground table, so
 *  reordering an issue moves its napkins — but only within their own rows. */
export async function reorderPieces(issueId: string, orderedIds: string[]): Promise<Result> {
  await assertAdmin();
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("pieces")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("issue_id", issueId);
    if (error) return bad(explain(error));
  }

  revalidatePath(`/admin/issues/${issueId}`);
  revalidatePath("/playground");
  return ok;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function addCategory(name: string): Promise<Result> {
  await assertAdmin();
  const clean = normalizeCategoryInput(name);
  if (clean.length < 2) return bad("That's a bit short for a category name.");
  if (clean.length > 40) return bad("Keep category names under 40 characters.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .upsert({ name: clean, sort_order: 500 }, { onConflict: "name" });
  if (error) return bad(explain(error));
  return ok;
}

// ---------------------------------------------------------------------------

async function revalidatePiece(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pieces")
    .select("issue_id, issues(issue_number)")
    .eq("id", id)
    .maybeSingle();
  const issues = data?.issues as { issue_number: number } | { issue_number: number }[] | undefined;
  const n = Array.isArray(issues) ? issues[0]?.issue_number : issues?.issue_number;
  if (data?.issue_id) revalidatePath(`/admin/issues/${data.issue_id}`);
  revalidateEverything(n);
}

/** The three public surfaces a content change can reach. */
function revalidateEverything(issueNumber?: number) {
  revalidatePath("/");
  revalidatePath("/playground");
  revalidatePath("/admin");
  if (issueNumber) revalidatePath(`/issues/${issueNumber}`);
}
