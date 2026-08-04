/**
 * Categories, kept deliberately narrow.
 *
 * Before this, 117 pieces carried 22 distinct values — three spellings of
 * Nonfiction, two of Short Fiction, four ways of saying collage. Free text
 * guarantees a worse mess in two years; a hard-coded enum guarantees that an
 * editor eventually cannot file the piece in front of them and types something
 * into the nearest box anyway.
 *
 * So the list lives in a `categories` table: the admin offers exactly what is
 * in it, and "add new" writes a row there rather than a one-off string on a
 * piece. New values are a deliberate act that every later editor inherits,
 * instead of a typo nobody notices.
 */

/** Shipped list, mirrored in 0004_admin.sql. Used as the fallback when the
 *  table can't be read, so the dropdown is never empty. */
export const DEFAULT_CATEGORIES = [
  "Poetry",
  "Fiction",
  "Short Fiction",
  "Nonfiction",
  "Photography",
  "Art",
  "Illustration",
  "Collage",
  "Sequential Art",
  "Video",
  "Animation",
  "Audio",
  "Introduction",
] as const;

/**
 * `EntrySection` gives a piece verse layout — no wrapping, wider measure —
 * when this matches, so the category is not purely descriptive. Anything
 * renamed here has to be checked against it, which is why 0004 folds
 * "Poetry/Song" into "Poetry" rather than into "Music".
 */
export const VERSE_CATEGORY = /poetry|poem|verse|song/i;

export const looksLikeVerse = (category: string | null | undefined): boolean =>
  VERSE_CATEGORY.test(category ?? "");

/** Trim and collapse whitespace; nothing more. Case is left alone on purpose —
 *  an editor adding "Sequential Art" means that capitalisation. */
export function normalizeCategoryInput(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
